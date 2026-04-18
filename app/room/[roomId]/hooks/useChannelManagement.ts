import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';
import type { Channel } from '@/types/database';

interface UseChannelManagementResult {
  channels: Channel[];
  currentChannelId: string | null;
  setCurrentChannelId: (id: string | null) => void;
  createChannel: (name: string, userId?: string) => Promise<Channel | null>;
}

/**
 * Hook to manage channel loading, subscriptions, and creation for a room.
 * Handles race conditions when switching between rooms.
 */
export function useChannelManagement(roomId: string): UseChannelManagementResult {
  const [channels, setChannels] = useState<Channel[]>([]);
  const { currentChannelId, setCurrentChannelId } = useAppStore();
  const currentRoomIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // Track the current roomId for this effect
    currentRoomIdRef.current = roomId;

    // Load initial channels
    const loadChannels = async () => {
      // Capture the roomId at the time this async function is called
      const loadRoomId = currentRoomIdRef.current;

      if (!loadRoomId) return;

      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('room_id', loadRoomId)
        .order('order', { ascending: true });

      if (error) {
        console.error('Error loading channels:', error);
        return;
      }

      // Only update channels if this effect is still for the current room
      // This prevents race conditions when rapidly switching rooms
      if (currentRoomIdRef.current !== loadRoomId) {
        return; // Stale response, ignore it
      }

      if (data && data.length > 0) {
        setChannels(data);
        // Get current channel ID from store
        const currentId = useAppStore.getState().currentChannelId;

        // Check if current channel exists in this room's channels
        const channelExists = currentId && data.some((ch) => ch.id === currentId);

        // Set first channel as active if none selected OR if current channel doesn't exist in this room
        if (!currentId || !channelExists) {
          setCurrentChannelId(data[0].id);
        }
      }
    };

    loadChannels();

    // Subscribe to channel changes
    const channel = supabase
      .channel(`room:${roomId}:channels`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadChannels();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      // Clear the ref when component unmounts or room changes
      currentRoomIdRef.current = null;
    };
  }, [roomId, setCurrentChannelId]);

  const createChannel = useCallback(
    async (name: string, userId?: string): Promise<Channel | null> => {
      try {
        const { data, error } = await supabase
          .from('channels')
          .insert({
            room_id: roomId,
            name: name.trim().toLowerCase(),
            order: channels.length,
            created_by: userId || 'anonymous',
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setCurrentChannelId(data.id);
          return data;
        }
        return null;
      } catch (error) {
        console.error('Error creating channel:', error);
        throw error;
      }
    },
    [roomId, channels.length, setCurrentChannelId]
  );

  return {
    channels,
    currentChannelId,
    setCurrentChannelId,
    createChannel,
  };
}
