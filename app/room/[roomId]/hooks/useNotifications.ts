import { useState, useEffect, useCallback, useRef } from 'react';
import { NOTIFICATION_PREVIEW_LENGTH } from '@/lib/constants';

const STORAGE_KEY = 'devcanvas_notifications_enabled';

type PermissionState = NotificationPermission | 'default';

interface UseNotificationsResult {
  permissionState: PermissionState;
  isEnabled: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  toggleEnabled: () => Promise<void>;
  sendNotification: (title: string, body: string, options?: NotificationOptions & { channelId?: string }) => void;
}

export function useNotifications(
  onNavigateToChannel?: (channelId: string) => void
): UseNotificationsResult {
  const [permissionState, setPermissionState] = useState<PermissionState>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const onNavigateRef = useRef(onNavigateToChannel);
  onNavigateRef.current = onNavigateToChannel;

  // Initialize state from browser + localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    setPermissionState(Notification.permission);

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true' && Notification.permission === 'granted') {
      setIsEnabled(true);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    setPermissionState(permission);
    return permission;
  }, []);

  const toggleEnabled = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (!isEnabled) {
      // Turning on: ensure permission is granted
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await requestPermission();
      }

      if (permission === 'granted') {
        setIsEnabled(true);
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    } else {
      // Turning off
      setIsEnabled(false);
      localStorage.setItem(STORAGE_KEY, 'false');
    }
  }, [isEnabled, requestPermission]);

  const sendNotification = useCallback(
    (title: string, body: string, options?: NotificationOptions & { channelId?: string }) => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (!isEnabled || Notification.permission !== 'granted') return;

      // Don't show if window is focused
      if (document.visibilityState === 'visible') return;

      const truncatedBody =
        body.length > NOTIFICATION_PREVIEW_LENGTH
          ? body.slice(0, NOTIFICATION_PREVIEW_LENGTH) + '...'
          : body;

      const { channelId, ...notifOptions } = options || {};

      const notification = new Notification(title, {
        body: truncatedBody,
        icon: '/favicon.ico',
        ...notifOptions,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (channelId && onNavigateRef.current) {
          onNavigateRef.current(channelId);
        }
      };
    },
    [isEnabled]
  );

  return {
    permissionState,
    isEnabled,
    requestPermission,
    toggleEnabled,
    sendNotification,
  };
}
