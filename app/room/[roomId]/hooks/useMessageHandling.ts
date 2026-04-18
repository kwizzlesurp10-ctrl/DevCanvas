import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, getAnonymousUserId, getUserDisplayName } from '@/lib/supabaseClient';
import type { Message } from '@/types/database';

interface UseMessageHandlingResult {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string, userId?: string, userName?: string, parentId?: string | null) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  replyCounts: Record<string, number>;
  threadParentId: string | null;
  threadMessages: Message[];
  threadLoading: boolean;
  openThread: (messageId: string) => void;
  closeThread: () => void;
}

/**
 * Hook to manage message loading, subscriptions, and CRUD operations for a channel.
 * Handles optimistic updates and real-time synchronization.
 * Supports threaded replies via parent_id.
 */
export function useMessageHandling(
  roomId: string,
  channelId: string | null
): UseMessageHandlingResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
  const [threadParentId, setThreadParentId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load reply counts for a set of message IDs
  const loadReplyCounts = useCallback(async (msgIds: string[]) => {
    if (msgIds.length === 0) return;

    const { data, error } = await supabase
      .from('messages')
      .select('parent_id')
      .in('parent_id', msgIds);

    if (error) {
      console.error('Error loading reply counts:', error);
      return;
    }

    if (data) {
      const counts: Record<string, number> = {};
      for (const row of data) {
        if (row.parent_id) {
          counts[row.parent_id] = (counts[row.parent_id] || 0) + 1;
        }
      }
      setReplyCounts(counts);
    }
  }, []);

  // Load top-level messages and reply counts
  useEffect(() => {
    if (!channelId) {
      queueMicrotask(() => {
        setMessages([]);
        setReplyCounts({});
        setThreadParentId(null);
        setThreadMessages([]);
      });
      return;
    }

    queueMicrotask(() => {
      setIsLoading(true);
      setMessages([]);
    });

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        setMessages(data);
        setIsLoading(false);
        loadReplyCounts(data.map((m) => m.id));
      }
    };

    loadMessages();

    // Subscribe to messages in this channel
    const channel = supabase
      .channel(`room:${roomId}:messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (payload.eventType === 'INSERT') {
            if (!msg.parent_id) {
              setMessages((prev) => [...prev, msg]);
            } else {
              // A reply was added — increment count for its parent
              setReplyCounts((prev) => ({
                ...prev,
                [msg.parent_id as string]: (prev[msg.parent_id as string] || 0) + 1,
              }));
              // If thread is open for this parent, add to thread messages
              setThreadParentId((currentParentId) => {
                if (currentParentId === msg.parent_id) {
                  setThreadMessages((prev) => [...prev, msg]);
                }
                return currentParentId;
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            if (!msg.parent_id) {
              setMessages((prev) =>
                prev.map((m) => (m.id === msg.id ? msg : m))
              );
            }
            // Update in thread view if open
            setThreadMessages((prev) =>
              prev.map((m) => (m.id === msg.id ? msg : m))
            );
          } else if (payload.eventType === 'DELETE') {
            const oldMsg = payload.old as { id: string; parent_id?: string | null };
            if (!oldMsg.parent_id) {
              setMessages((prev) => prev.filter((m) => m.id !== oldMsg.id));
            } else {
              setReplyCounts((prev) => {
                const parentId = oldMsg.parent_id as string;
                const count = (prev[parentId] || 1) - 1;
                if (count <= 0) {
                  const next = { ...prev };
                  delete next[parentId];
                  return next;
                }
                return { ...prev, [parentId]: count };
              });
              setThreadMessages((prev) => prev.filter((m) => m.id !== oldMsg.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [channelId, roomId, loadReplyCounts]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string, userId?: string, userName?: string, parentId?: string | null): Promise<void> => {
      if (!channelId) throw new Error('No channel selected');

      const insertData: Record<string, unknown> = {
        channel_id: channelId,
        content: content.trim(),
        author_id: userId || getAnonymousUserId(),
        author_name: userName || getUserDisplayName(),
      };

      if (parentId) {
        insertData.parent_id = parentId;
      }

      const { error } = await supabase.from('messages').insert(insertData);

      if (error) throw error;
    },
    [channelId]
  );

  const editMessage = useCallback(async (messageId: string, content: string): Promise<void> => {
    const { error } = await supabase
      .from('messages')
      .update({ content: content.trim() })
      .eq('id', messageId);

    if (error) throw error;
  }, []);

  const deleteMessage = useCallback(async (messageId: string): Promise<void> => {
    const { error } = await supabase.from('messages').delete().eq('id', messageId);

    if (error) throw error;
  }, []);

  // Thread management
  const openThread = useCallback(
    async (messageId: string) => {
      setThreadParentId(messageId);
      setThreadLoading(true);
      setThreadMessages([]);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('parent_id', messageId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading thread messages:', error);
      } else if (data) {
        setThreadMessages(data);
      }
      setThreadLoading(false);
    },
    []
  );

  const closeThread = useCallback(() => {
    setThreadParentId(null);
    setThreadMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    replyCounts,
    threadParentId,
    threadMessages,
    threadLoading,
    openThread,
    closeThread,
  };
}
