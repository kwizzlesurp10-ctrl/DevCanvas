import { WebRTCManager } from '@/app/room/[roomId]/webrtc';

// ---------------------------------------------------------------------------
// Mock Supabase – factory with stable inner mocks via module-scope refs
// ---------------------------------------------------------------------------
// We use __mocks__ variables named with the jest-hoist-safe prefix
const mockSend = jest.fn();
const mockUnsubscribeFn = jest.fn().mockResolvedValue(undefined);
const mockSubscribeFn = jest.fn();
const mockOnFn = jest.fn();

// Build the channel object that the factory will return
const channelObject = {
  on: mockOnFn,
  send: mockSend,
  subscribe: mockSubscribeFn,
  unsubscribe: mockUnsubscribeFn,
};

// Make .on() chainable
mockOnFn.mockReturnValue(channelObject);
// Make .subscribe() return a sensible value
mockSubscribeFn.mockReturnValue(channelObject);

const mockChannelFn = jest.fn().mockReturnValue(channelObject);

jest.mock('@/lib/supabaseClient', () => ({
  // The factory runs in a hoisted context so we cannot reference outer vars.
  // We use jest.requireActual to avoid that, but instead we use a stable
  // module-level object that we populate separately.
  supabase: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    channel: (...args: unknown[]) => (require('@/lib/supabaseClient') as { supabase: { channel: jest.Mock } }).supabase.channel(...args),
  },
  isSupabaseConfigured: false,
}));

// ---------------------------------------------------------------------------
// Patch the supabase mock channel after module loading
// ---------------------------------------------------------------------------
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/lib/supabaseClient') as { supabase: { channel: jest.Mock } };
  mod.supabase.channel = mockChannelFn;
});

// ---------------------------------------------------------------------------
// Mock WebRTC APIs (not available in jsdom)
// ---------------------------------------------------------------------------
const mockClose = jest.fn();
const mockGetSenders = jest.fn().mockReturnValue([]);
const mockSetRemoteDescription = jest.fn().mockResolvedValue(undefined);
const mockSetLocalDescription = jest.fn().mockResolvedValue(undefined);
const mockCreateAnswer = jest.fn().mockResolvedValue({ type: 'answer', sdp: 'answer-sdp' });
const mockCreateOffer = jest.fn().mockResolvedValue({ type: 'offer', sdp: 'offer-sdp' });
const mockAddIceCandidate = jest.fn().mockResolvedValue(undefined);

class MockRTCPeerConnection {
  onicecandidate: ((e: { candidate: RTCIceCandidate | null }) => void) | null = null;
  ontrack: ((e: { streams: MediaStream[] }) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  connectionState: RTCPeerConnectionState = 'new';

  setRemoteDescription = mockSetRemoteDescription;
  setLocalDescription = mockSetLocalDescription;
  createAnswer = mockCreateAnswer;
  createOffer = mockCreateOffer;
  getSenders = mockGetSenders;
  addIceCandidate = mockAddIceCandidate;
  addTrack = jest.fn();
  close = mockClose;
}

Object.defineProperty(globalThis, 'RTCPeerConnection', {
  value: MockRTCPeerConnection,
  writable: true,
});

// ---------------------------------------------------------------------------
// Mock navigator.mediaDevices.getUserMedia
// ---------------------------------------------------------------------------
function makeMockStream(overrides: Partial<{ enabled: boolean; stop: jest.Mock }> = {}) {
  const track = {
    kind: 'audio',
    enabled: overrides.enabled ?? true,
    stop: overrides.stop ?? jest.fn(),
  };
  return {
    getTracks: () => [track],
    getAudioTracks: () => [track],
    getVideoTracks: () => [],
  } as unknown as MediaStream;
}

const mockGetUserMedia = jest.fn().mockImplementation(() =>
  Promise.resolve(makeMockStream())
);

Object.defineProperty(globalThis.navigator, 'mediaDevices', {
  value: { getUserMedia: mockGetUserMedia },
  writable: true,
  configurable: true,
});

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------
function makeManager(
  opts: Partial<{
    onLocalStream: jest.Mock;
    onRemoteStream: jest.Mock;
    onConnectionStateChange: jest.Mock;
  }> = {}
) {
  return new WebRTCManager({
    roomId: 'test-room',
    onLocalStream: opts.onLocalStream ?? jest.fn(),
    onRemoteStream: opts.onRemoteStream ?? jest.fn(),
    onConnectionStateChange: opts.onConnectionStateChange ?? jest.fn(),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('WebRTCManager', () => {
  let offerHandler: ((payload: { payload: unknown }) => Promise<void> | void) | undefined;
  let answerHandler: ((payload: { payload: unknown }) => Promise<void> | void) | undefined;
  let iceCandidateHandler: ((payload: { payload: unknown }) => Promise<void> | void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    offerHandler = undefined;
    answerHandler = undefined;
    iceCandidateHandler = undefined;
    mockAddIceCandidate.mockResolvedValue(undefined);
    mockSetRemoteDescription.mockResolvedValue(undefined);

    mockOnFn.mockImplementation((event, _config, callback) => {
      if (event === 'broadcast') {
        const castCallback = callback as (payload: { payload: unknown }) => Promise<void> | void;
        const eventName = (_config as { event?: string }).event;
        if (eventName === 'offer') {
          offerHandler = castCallback;
        } else if (eventName === 'answer') {
          answerHandler = castCallback;
        } else if (eventName === 'ice-candidate') {
          iceCandidateHandler = castCallback;
        }
      }
      return channelObject;
    });

    mockSubscribeFn.mockReturnValue(channelObject);
    mockChannelFn.mockReturnValue(channelObject);
    mockGetUserMedia.mockImplementation(() => Promise.resolve(makeMockStream()));
  });

  // ---------- constructor --------------------------------------------------
  describe('constructor', () => {
    it('creates an instance without throwing', () => {
      expect(() => makeManager()).not.toThrow();
    });
  });

  // ---------- isMuted (before stream) --------------------------------------
  describe('isMuted (no stream)', () => {
    it('returns true when there is no local stream', () => {
      const manager = makeManager();
      expect(manager.isMuted()).toBe(true);
    });
  });

  // ---------- toggleMute (before stream) -----------------------------------
  describe('toggleMute (no stream)', () => {
    it('does not throw when no local stream is set', () => {
      const manager = makeManager();
      expect(() => manager.toggleMute()).not.toThrow();
    });
  });

  // ---------- startLocalStream --------------------------------------------
  describe('startLocalStream', () => {
    it('calls getUserMedia with audio:true, video:false', async () => {
      const onLocalStream = jest.fn();
      const manager = makeManager({ onLocalStream });
      await manager.startLocalStream();
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true, video: false });
      expect(onLocalStream).toHaveBeenCalled();
    });

    it('isMuted returns false after stream with enabled track is started', async () => {
      const manager = makeManager();
      await manager.startLocalStream();
      expect(manager.isMuted()).toBe(false);
    });

    it('isMuted returns true after toggling mute once', async () => {
      const manager = makeManager();
      await manager.startLocalStream();
      manager.toggleMute();
      expect(manager.isMuted()).toBe(true);
    });

    it('isMuted returns false after toggling mute twice (back to unmuted)', async () => {
      const manager = makeManager();
      await manager.startLocalStream();
      manager.toggleMute(); // mute
      manager.toggleMute(); // unmute
      expect(manager.isMuted()).toBe(false);
    });
  });

  // ---------- cleanup -----------------------------------------------------
  describe('cleanup', () => {
    it('resolves without throwing when called before initialize', async () => {
      const manager = makeManager();
      await expect(manager.cleanup()).resolves.toBeUndefined();
    });

    it('stops all stream tracks on cleanup', async () => {
      const mockStop = jest.fn();
      mockGetUserMedia.mockResolvedValueOnce(makeMockStream({ stop: mockStop }));

      const manager = makeManager();
      await manager.initialize();
      await manager.startLocalStream();
      await manager.cleanup();

      expect(mockStop).toHaveBeenCalled();
    });

    it('closes the peer connection on cleanup', async () => {
      const manager = makeManager();
      await manager.initialize();
      await manager.cleanup();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  // ---------- initialize --------------------------------------------------
  describe('initialize', () => {
    it('creates a Supabase channel with the correct room name', async () => {
      const manager = makeManager();
      await manager.initialize();
      expect(mockChannelFn).toHaveBeenCalledWith(
        'room:test-room:webrtc',
        expect.objectContaining({ config: { broadcast: { self: false } } })
      );
    });

    it('subscribes to the signalling channel', async () => {
      const manager = makeManager();
      await manager.initialize();
      expect(mockSubscribeFn).toHaveBeenCalled();
    });

    it('ignores invalid offer payloads', async () => {
      const manager = makeManager();
      await manager.initialize();
      expect(offerHandler).toBeDefined();

      await offerHandler?.({ payload: { offer: { type: 'offer' } } });
      expect(mockSetRemoteDescription).not.toHaveBeenCalled();
    });

    it('ignores invalid answer payloads', async () => {
      const manager = makeManager();
      await manager.initialize();
      await manager.createOffer();
      expect(answerHandler).toBeDefined();

      await answerHandler?.({ payload: { answer: { type: 'answer' } } });
      expect(mockSetRemoteDescription).toHaveBeenCalledTimes(0);
    });

    it('ignores invalid ice-candidate payloads', async () => {
      const manager = makeManager();
      await manager.initialize();
      expect(iceCandidateHandler).toBeDefined();

      await iceCandidateHandler?.({ payload: { candidate: null } });
      expect(mockAddIceCandidate).not.toHaveBeenCalled();
    });
  });
});
