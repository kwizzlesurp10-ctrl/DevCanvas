import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, getAnonymousUserId } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';
import type { Reaction } from '@/types/database';

interface UseReactionsResult {
  reactions: Record<string, Reaction[]>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook to manage emoji reactions on messages.
 * Handles loading, toggling, and real-time subscriptions for reactions.
 */
export function useReactions(channelId: string | null, messageIds: string[]): UseReactionsResult {
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useAppStore();

  // Stable key derived from messageIds for use in dependency arrays
  const messageIdsKey = useMemo(() => messageIds.join(','), [messageIds]);

  // Load reactions whenever message IDs change
  useEffect(() => {
    if (!channelId || messageIds.length === 0) {
      // Use a microtask to avoid synchronous setState in effect
      queueMicrotask(() => setReactions({}));
      return;
    }

    let cancelled = false;
    const loadReactions = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .in('message_id', messageIds);

      if (cancelled) return;

      if (error) {
        console.error('Error loading reactions:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        const grouped: Record<string, Reaction[]> = {};
        for (const reaction of data) {
          if (!grouped[reaction.message_id]) {
            grouped[reaction.message_id] = [];
          }
          grouped[reaction.message_id].push(reaction);
        }
        setReactions(grouped);
      }
      setIsLoading(false);
    };

    loadReactions();
    return () => { cancelled = true; };
  }, [channelId, messageIds, messageIdsKey]);

  // Subscribe to realtime changes on reactions
  useEffect(() => {
    if (!channelId || messageIds.length === 0) return;

    const channel = supabase
      .channel(`reactions:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReaction = payload.new as Reaction;
            setReactions((prev) => {
              const msgReactions = prev[newReaction.message_id] || [];
              // Avoid duplicates
              if (msgReactions.some((r) => r.id === newReaction.id)) return prev;
              return {
                ...prev,
                [newReaction.message_id]: [...msgReactions, newReaction],
              };
            });
          } else if (payload.eventType === 'DELETE') {
            const oldReaction = payload.old as { id: string; message_id: string };
            setReactions((prev) => {
              const msgReactions = prev[oldReaction.message_id];
              if (!msgReactions) return prev;
              const filtered = msgReactions.filter((r) => r.id !== oldReaction.id);
              if (filtered.length === 0) {
                const next = { ...prev };
                delete next[oldReaction.message_id];
                return next;
              }
              return { ...prev, [oldReaction.message_id]: filtered };
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [channelId, messageIds, messageIdsKey]);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const authorId = userId || getAnonymousUserId();
      const msgReactions = reactions[messageId] || [];
      const existing = msgReactions.find(
        (r) => r.emoji === emoji && r.author_id === authorId
      );

      if (existing) {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existing.id);

        if (error) {
          console.error('Error removing reaction:', error);
          throw error;
        }
      } else {
        const { error } = await supabase.from('reactions').insert({
          message_id: messageId,
          emoji,
          author_id: authorId,
        });

        if (error) {
          console.error('Error adding reaction:', error);
          throw error;
        }
      }
    },
    [reactions, userId]
  );

  return {
    reactions,
    toggleReaction,
    isLoading,
  };
}
