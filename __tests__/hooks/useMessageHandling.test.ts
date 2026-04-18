/**
 * Tests for useMessageHandling hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessageHandling } from '@/app/room/[roomId]/hooks/useMessageHandling';

// ---------------------------------------------------------------------------
// Mock Supabase
// ---------------------------------------------------------------------------
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn().mockResolvedValue(undefined);
const mockOn = jest.fn();

// Chain builders
const selectChain = { eq: mockEq, order: mockOrder };
const eqChain = { eq: mockEq, order: mockOrder };
const updateChain = { eq: jest.fn() };
const deleteChain = { eq: jest.fn() };

mockSelect.mockReturnValue(selectChain);
mockEq.mockReturnValue(eqChain);
mockOrder.mockResolvedValue({ data: [], error: null });
mockInsert.mockResolvedValue({ error: null });
mockUpdate.mockReturnValue(updateChain);
updateChain.eq.mockResolvedValue({ error: null });
mockDelete.mockReturnValue(deleteChain);
deleteChain.eq.mockResolvedValue({ error: null });

// Built lazily to avoid hoisting issues with jest.mock
const getChannelObj = () => ({
  on: mockOn,
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
});

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'messages') {
        return {
          select: mockSelect,
          insert: mockInsert,
          update: mockUpdate,
          delete: mockDelete,
        };
      }
      return { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() };
    }),
    channel: jest.fn(() => getChannelObj()),
  },
  getAnonymousUserId: () => 'anon_test-user',
  getUserDisplayName: () => 'TestUser',
  isSupabaseConfigured: true,
}));

beforeEach(() => {
  jest.clearAllMocks();

  // Re-setup chainable mocks
  mockSelect.mockReturnValue(selectChain);
  mockEq.mockReturnValue(eqChain);
  mockOrder.mockResolvedValue({ data: [], error: null });
  mockInsert.mockResolvedValue({ error: null });
  mockUpdate.mockReturnValue(updateChain);
  updateChain.eq.mockResolvedValue({ error: null });
  mockDelete.mockReturnValue(deleteChain);
  deleteChain.eq.mockResolvedValue({ error: null });
  mockOn.mockReturnValue(getChannelObj());
  mockSubscribe.mockReturnValue(getChannelObj());
});

describe('useMessageHandling', () => {
  describe('initial state', () => {
    it('returns empty messages array when no channel is selected', () => {
      const { result } = renderHook(() => useMessageHandling('room-1', null));
      expect(result.current.messages).toEqual([]);
    });

    it('returns isLoading false when no channel is selected', () => {
      const { result } = renderHook(() => useMessageHandling('room-1', null));
      expect(result.current.isLoading).toBe(false);
    });

    it('provides sendMessage, editMessage, deleteMessage functions', () => {
      const { result } = renderHook(() => useMessageHandling('room-1', null));
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.editMessage).toBe('function');
      expect(typeof result.current.deleteMessage).toBe('function');
    });
  });

  describe('message loading', () => {
    it('loads messages when channelId is provided', async () => {
      const messages = [
        { id: 'msg-1', content: 'Hello', channel_id: 'ch-1', created_at: '2024-01-01T00:00:00Z' },
        { id: 'msg-2', content: 'World', channel_id: 'ch-1', created_at: '2024-01-01T00:01:00Z' },
      ];
      mockOrder.mockResolvedValue({ data: messages, error: null });

      const { result } = renderHook(() => useMessageHandling('room-1', 'ch-1'));

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('handles loading error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const { result } = renderHook(() => useMessageHandling('room-1', 'ch-1'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error loading messages:', expect.anything());
      });

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      consoleError.mockRestore();
    });

    it('clears messages when channelId changes to null', async () => {
      const messages = [
        { id: 'msg-1', content: 'Hello', channel_id: 'ch-1', created_at: '2024-01-01T00:00:00Z' },
      ];
      mockOrder.mockResolvedValue({ data: messages, error: null });

      const { result, rerender } = renderHook(
        ({ channelId }) => useMessageHandling('room-1', channelId),
        { initialProps: { channelId: 'ch-1' as string | null } }
      );

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1);
      });

      rerender({ channelId: null });
      expect(result.current.messages).toEqual([]);
    });
  });

  describe('message subscription', () => {
    it('subscribes to message changes when channel is provided', () => {
      renderHook(() => useMessageHandling('room-1', 'ch-1'));

      const { supabase } = require('@/lib/supabaseClient');
      expect(supabase.channel).toHaveBeenCalledWith('room:room-1:messages:ch-1');
    });

    it('unsubscribes on unmount', () => {
      const { unmount } = renderHook(() => useMessageHandling('room-1', 'ch-1'));
      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('inserts a message with trimmed content', async () => {
      const { result } = renderHook(() => useMessageHandling('room-1', 'ch-1'));

      await act(async () => {
        await result.current.sendMessage('  Hello World  ', 'user-1', 'Alice');
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          channel_id: 'ch-1',
          content: 'Hello World',
          author_id: 'user-1',
          author_name: 'Alice',
        })
      );
    });

    it('uses default user ID and name when not provided', async () => {
      const { result } = renderHook(() => useMessageHandling('room-1', 'ch-1'));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          author_id: 'anon_test-user',
          author_name: 'TestUser',
        })
      );
    });

    it('throws when no channel is selected', async () => {
      const { result } = renderHook(() => useMessageHandling('room-1', null));

      await expect(
        act(async () => {
          await result.current.sendMessage('Hello');
        })
      ).rejects.toThrow('No channel selected');
    });

    it('throws when insert fails', async () => {
      mockInsert.mockResolvedValueOnce({ error: { message: 'insert error' } });

      const { result } = renderHook(() => useMessageHandling('room-1', 'ch-1'));

      await expect(
        act(async () => {
          await result.current.sendMessage('Hello');
        })
      ).rejects.toBeDefined();
    });
  });

  describe('editMessage', () => {
    it('updates message content with trimmed value', async () => {
      const { result } = renderHook(() => useMessageHandling('room-1', 'ch-1'));

      await act(async () => {
        await result.current.editMessage('msg-1', '  Updated content  ');
      });

      expect(mockUpdate).toHaveBeenCalledWith({ content: 'Updated content' });
      expect(updateChain.eq).toHaveBeenCalledWith('id', 'msg-1');
    });

    it('throws when update fails', async () => {
      updateChain.eq.mockResolvedValueOnce({ error: { message: 'update error' } });

      const { result } = renderHook(() => useMessageHandling('room-1', 'ch-1'));

      await expect(
        act(async () => {
          await result.current.editMessage('msg-1', 'Updated');
        })
      ).rejects.toBeDefined();
    });
  });

  describe('deleteMessage', () => {
    it('deletes message by ID', async () => {
      const { result } = renderHook(() => useMessageHandling('room-1', 'ch-1'));

      await act(async () => {
        await result.current.deleteMessage('msg-1');
      });

      expect(mockDelete).toHaveBeenCalled();
      expect(deleteChain.eq).toHaveBeenCalledWith('id', 'msg-1');
    });

    it('throws when delete fails', async () => {
      deleteChain.eq.mockResolvedValueOnce({ error: { message: 'delete error' } });

      const { result } = renderHook(() => useMessageHandling('room-1', 'ch-1'));

      await expect(
        act(async () => {
          await result.current.deleteMessage('msg-1');
        })
      ).rejects.toBeDefined();
    });
  });
});
