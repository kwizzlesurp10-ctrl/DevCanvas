import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, getAnonymousUserId, getUserDisplayName } from '@/lib/supabaseClient';
import type { Message } from '@/types/database';

interface UseMessageHandlingResult {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string, userId?: string, userName?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
}

/**
 * Hook to manage message loading, subscriptions, and CRUD operations for a channel.
 * Handles optimistic updates and real-time synchronization.
 */
export function useMessageHandling(
  roomId: string,
  channelId: string | null
): UseMessageHandlingResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      return;
    }

    // Set loading state before clearing messages
    setIsLoading(true);
    setMessages([]);

    // Load initial messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        setMessages(data);
        setIsLoading(false);
      }
    };

    loadMessages();

    // Subscribe to new messages
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
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new as Message]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? (payload.new as Message) : msg
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [channelId, roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string, userId?: string, userName?: string): Promise<void> => {
      if (!channelId) throw new Error('No channel selected');

      const { error } = await supabase.from('messages').insert({
        channel_id: channelId,
        content: content.trim(),
        author_id: userId || getAnonymousUserId(),
        author_name: userName || getUserDisplayName(),
      });

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

  return {
    messages,
    isLoading,
    sendMessage,
    editMessage,
    deleteMessage,
  };
}
