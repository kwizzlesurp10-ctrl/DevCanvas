import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, getAnonymousUserId, getUserDisplayName } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';

export interface PresenceUser {
  id: string;
  name: string;
  status: 'online' | 'away' | 'idle';
  lastSeen: string;
  currentPanel?: string;
}

interface UsePresenceResult {
  onlineUsers: PresenceUser[];
  isConnected: boolean;
  updateStatus: (status: PresenceUser['status']) => void;
  updatePanel: (panel: string) => void;
}

const PRESENCE_HEARTBEAT_INTERVAL = 30000; // 30 seconds
const IDLE_TIMEOUT = 60000; // 1 minute

/**
 * Hook to manage user presence in a room using Supabase Realtime Presence.
 * Tracks who is online and their current activity status.
 */
export function usePresence(roomId: string): UsePresenceResult {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { userId, userName } = useAppStore();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const statusRef = useRef<PresenceUser['status']>('online');
  const panelRef = useRef<string>('canvas');

  const currentUserId = userId || getAnonymousUserId();
  const currentUserName = userName || getUserDisplayName();

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      if (statusRef.current === 'idle' || statusRef.current === 'away') {
        statusRef.current = 'online';
        broadcastPresence();
      }
    };

    const checkIdle = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity > IDLE_TIMEOUT && statusRef.current === 'online') {
        statusRef.current = 'idle';
        broadcastPresence();
      }
    }, 10000);

    // Activity listeners
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      clearInterval(checkIdle);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);

  const broadcastPresence = useCallback(() => {
    if (!channelRef.current) return;

    channelRef.current.track({
      id: currentUserId,
      name: currentUserName,
      status: statusRef.current,
      lastSeen: new Date().toISOString(),
      currentPanel: panelRef.current,
    });
  }, [currentUserId, currentUserName]);

  // Set up presence channel
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`room:${roomId}:presence`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users: PresenceUser[] = [];

        for (const presences of Object.values(state)) {
          if (presences && presences.length > 0) {
            // Take the most recent presence for each user
            const latestPresence = presences[presences.length - 1];
            users.push({
              id: latestPresence.id,
              name: latestPresence.name,
              status: latestPresence.status,
              lastSeen: latestPresence.lastSeen,
              currentPanel: latestPresence.currentPanel,
            });
          }
        }

        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        if (newPresences && newPresences.length > 0) {
          const user = newPresences[0] as PresenceUser;
          setOnlineUsers((prev) => {
            const exists = prev.find((u) => u.id === user.id);
            if (exists) {
              return prev.map((u) => (u.id === user.id ? user : u));
            }
            return [...prev, user];
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (leftPresences && leftPresences.length > 0) {
          const userId = (leftPresences[0] as PresenceUser).id;
          setOnlineUsers((prev) => prev.filter((u) => u.id !== userId));
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Track our presence
          await channel.track({
            id: currentUserId,
            name: currentUserName,
            status: 'online',
            lastSeen: new Date().toISOString(),
            currentPanel: panelRef.current,
          });
        }
      });

    // Heartbeat to keep presence alive
    const heartbeat = setInterval(() => {
      broadcastPresence();
    }, PRESENCE_HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(heartbeat);
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [roomId, currentUserId, currentUserName, broadcastPresence]);

  const updateStatus = useCallback((status: PresenceUser['status']) => {
    statusRef.current = status;
    broadcastPresence();
  }, [broadcastPresence]);

  const updatePanel = useCallback((panel: string) => {
    panelRef.current = panel;
    broadcastPresence();
  }, [broadcastPresence]);

  return {
    onlineUsers,
    isConnected,
    updateStatus,
    updatePanel,
  };
}
