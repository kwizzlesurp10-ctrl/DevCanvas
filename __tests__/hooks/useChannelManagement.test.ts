/**
 * Tests for useChannelManagement hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChannelManagement } from '@/app/room/[roomId]/hooks/useChannelManagement';
import { useAppStore } from '@/lib/store';

// ---------------------------------------------------------------------------
// Mock Supabase
// ---------------------------------------------------------------------------
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn().mockResolvedValue(undefined);
const mockOn = jest.fn();

// Chain builders for select queries
const selectChain = {
  eq: mockEq,
  order: mockOrder,
};

// Chain builder for insert queries
const insertChain = {
  select: jest.fn(),
};

const insertSelectChain = {
  single: mockSingle,
};

// Set up chainable returns
mockSelect.mockReturnValue(selectChain);
mockEq.mockReturnValue(selectChain);
mockOrder.mockResolvedValue({ data: [], error: null });
mockInsert.mockReturnValue(insertChain);
insertChain.select.mockReturnValue(insertSelectChain);
mockSingle.mockResolvedValue({ data: null, error: null });

// Channel subscription mock - built lazily to avoid hoisting issues
const getChannelObj = () => ({
  on: mockOn,
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
});

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'channels') {
        return {
          select: mockSelect,
          insert: mockInsert,
        };
      }
      return { select: jest.fn(), insert: jest.fn() };
    }),
    channel: jest.fn(() => getChannelObj()),
  },
  isSupabaseConfigured: true,
}));

// ---------------------------------------------------------------------------
// Reset store before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
  useAppStore.setState({
    currentRoomId: null,
    currentChannelId: null,
    userId: '',
    userName: 'Anonymous',
    isVoiceConnected: false,
    isMuted: false,
    isScreenSharing: false,
  });

  // Re-setup chainable mocks
  mockSelect.mockReturnValue(selectChain);
  mockEq.mockReturnValue(selectChain);
  mockOrder.mockResolvedValue({ data: [], error: null });
  mockInsert.mockReturnValue(insertChain);
  insertChain.select.mockReturnValue(insertSelectChain);
  mockSingle.mockResolvedValue({ data: null, error: null });
  mockOn.mockReturnValue(getChannelObj());
  mockSubscribe.mockReturnValue(getChannelObj());
});

describe('useChannelManagement', () => {
  describe('initial state', () => {
    it('returns empty channels array initially', () => {
      const { result } = renderHook(() => useChannelManagement('room-1'));
      expect(result.current.channels).toEqual([]);
    });

    it('returns null currentChannelId initially', () => {
      const { result } = renderHook(() => useChannelManagement('room-1'));
      expect(result.current.currentChannelId).toBeNull();
    });

    it('provides setCurrentChannelId function', () => {
      const { result } = renderHook(() => useChannelManagement('room-1'));
      expect(typeof result.current.setCurrentChannelId).toBe('function');
    });

    it('provides createChannel function', () => {
      const { result } = renderHook(() => useChannelManagement('room-1'));
      expect(typeof result.current.createChannel).toBe('function');
    });
  });

  describe('channel loading', () => {
    it('loads channels from Supabase on mount', async () => {
      const channels = [
        { id: 'ch-1', name: 'general', room_id: 'room-1', order: 0 },
        { id: 'ch-2', name: 'random', room_id: 'room-1', order: 1 },
      ];
      mockOrder.mockResolvedValue({ data: channels, error: null });

      const { result } = renderHook(() => useChannelManagement('room-1'));

      await waitFor(() => {
        expect(result.current.channels).toHaveLength(2);
      });

      expect(result.current.channels[0].name).toBe('general');
      expect(result.current.channels[1].name).toBe('random');
    });

    it('auto-selects first channel when none is selected', async () => {
      const channels = [
        { id: 'ch-1', name: 'general', room_id: 'room-1', order: 0 },
      ];
      mockOrder.mockResolvedValue({ data: channels, error: null });

      renderHook(() => useChannelManagement('room-1'));

      await waitFor(() => {
        expect(useAppStore.getState().currentChannelId).toBe('ch-1');
      });
    });

    it('handles loading error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const { result } = renderHook(() => useChannelManagement('room-1'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error loading channels:', expect.anything());
      });

      expect(result.current.channels).toEqual([]);
      consoleError.mockRestore();
    });
  });

  describe('channel subscription', () => {
    it('subscribes to channel changes on mount', () => {
      renderHook(() => useChannelManagement('room-1'));

      const { supabase } = require('@/lib/supabaseClient');
      expect(supabase.channel).toHaveBeenCalledWith('room:room-1:channels');
    });

    it('unsubscribes on unmount', () => {
      const { unmount } = renderHook(() => useChannelManagement('room-1'));
      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('createChannel', () => {
    it('inserts channel with trimmed lowercase name', async () => {
      const newChannel = { id: 'ch-new', name: 'design', room_id: 'room-1', order: 0 };
      mockSingle.mockResolvedValue({ data: newChannel, error: null });

      const { result } = renderHook(() => useChannelManagement('room-1'));

      let created: unknown;
      await act(async () => {
        created = await result.current.createChannel('  Design  ', 'user-1');
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          room_id: 'room-1',
          name: 'design',
          created_by: 'user-1',
        })
      );
      expect(created).toEqual(newChannel);
    });

    it('sets current channel to the newly created one', async () => {
      const newChannel = { id: 'ch-new', name: 'dev', room_id: 'room-1', order: 0 };
      mockSingle.mockResolvedValue({ data: newChannel, error: null });

      const { result } = renderHook(() => useChannelManagement('room-1'));

      await act(async () => {
        await result.current.createChannel('dev');
      });

      expect(useAppStore.getState().currentChannelId).toBe('ch-new');
    });

    it('uses "anonymous" as default userId', async () => {
      mockSingle.mockResolvedValue({ data: { id: 'ch-new', name: 'test' }, error: null });

      const { result } = renderHook(() => useChannelManagement('room-1'));

      await act(async () => {
        await result.current.createChannel('test');
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          created_by: 'anonymous',
        })
      );
    });

    it('throws on insert error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockSingle.mockResolvedValue({ data: null, error: { message: 'insert failed' } });

      const { result } = renderHook(() => useChannelManagement('room-1'));

      await expect(
        act(async () => {
          await result.current.createChannel('test');
        })
      ).rejects.toBeDefined();

      consoleError.mockRestore();
    });
  });

  describe('setCurrentChannelId', () => {
    it('updates the store channel ID', () => {
      const { result } = renderHook(() => useChannelManagement('room-1'));

      act(() => {
        result.current.setCurrentChannelId('ch-5');
      });

      expect(useAppStore.getState().currentChannelId).toBe('ch-5');
    });
  });
});
