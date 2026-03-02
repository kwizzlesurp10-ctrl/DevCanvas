import { useAppStore } from '@/lib/store';

// Reset store state before each test so tests are isolated
beforeEach(() => {
  useAppStore.setState({
    currentRoomId: null,
    currentChannelId: null,
    userId: '',
    userName: 'Anonymous',
    isVoiceConnected: false,
    isMuted: false,
    isScreenSharing: false,
  });
});

describe('useAppStore', () => {
  describe('initial state', () => {
    it('has expected default values', () => {
      const state = useAppStore.getState();
      expect(state.currentRoomId).toBeNull();
      expect(state.currentChannelId).toBeNull();
      expect(state.userId).toBe('');
      expect(state.userName).toBe('Anonymous');
      expect(state.isVoiceConnected).toBe(false);
      expect(state.isMuted).toBe(false);
      expect(state.isScreenSharing).toBe(false);
    });
  });

  describe('setCurrentRoomId', () => {
    it('updates currentRoomId', () => {
      useAppStore.getState().setCurrentRoomId('room-123');
      expect(useAppStore.getState().currentRoomId).toBe('room-123');
    });

    it('can clear currentRoomId to null', () => {
      useAppStore.getState().setCurrentRoomId('room-123');
      useAppStore.getState().setCurrentRoomId(null);
      expect(useAppStore.getState().currentRoomId).toBeNull();
    });
  });

  describe('setCurrentChannelId', () => {
    it('updates currentChannelId', () => {
      useAppStore.getState().setCurrentChannelId('channel-456');
      expect(useAppStore.getState().currentChannelId).toBe('channel-456');
    });

    it('can clear currentChannelId to null', () => {
      useAppStore.getState().setCurrentChannelId('channel-456');
      useAppStore.getState().setCurrentChannelId(null);
      expect(useAppStore.getState().currentChannelId).toBeNull();
    });
  });

  describe('setUserId', () => {
    it('updates userId', () => {
      useAppStore.getState().setUserId('anon_abc123');
      expect(useAppStore.getState().userId).toBe('anon_abc123');
    });
  });

  describe('setUserName', () => {
    it('updates userName', () => {
      useAppStore.getState().setUserName('Alice');
      expect(useAppStore.getState().userName).toBe('Alice');
    });
  });

  describe('setVoiceConnected', () => {
    it('sets isVoiceConnected to true', () => {
      useAppStore.getState().setVoiceConnected(true);
      expect(useAppStore.getState().isVoiceConnected).toBe(true);
    });

    it('sets isVoiceConnected to false', () => {
      useAppStore.getState().setVoiceConnected(true);
      useAppStore.getState().setVoiceConnected(false);
      expect(useAppStore.getState().isVoiceConnected).toBe(false);
    });
  });

  describe('setMuted', () => {
    it('sets isMuted to true', () => {
      useAppStore.getState().setMuted(true);
      expect(useAppStore.getState().isMuted).toBe(true);
    });

    it('sets isMuted to false', () => {
      useAppStore.getState().setMuted(true);
      useAppStore.getState().setMuted(false);
      expect(useAppStore.getState().isMuted).toBe(false);
    });
  });

  describe('setScreenSharing', () => {
    it('sets isScreenSharing to true', () => {
      useAppStore.getState().setScreenSharing(true);
      expect(useAppStore.getState().isScreenSharing).toBe(true);
    });

    it('sets isScreenSharing to false', () => {
      useAppStore.getState().setScreenSharing(true);
      useAppStore.getState().setScreenSharing(false);
      expect(useAppStore.getState().isScreenSharing).toBe(false);
    });
  });

  describe('store updates do not affect unrelated state', () => {
    it('setCurrentRoomId does not change other fields', () => {
      useAppStore.getState().setUserId('u1');
      useAppStore.getState().setCurrentRoomId('r1');
      expect(useAppStore.getState().userId).toBe('u1');
    });
  });
});
