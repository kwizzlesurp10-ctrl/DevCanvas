'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, Copy, Check, Bell, BellOff } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getUserDisplayName } from '@/lib/supabaseClient';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface NavigationProps {
  notificationsEnabled?: boolean;
  notificationPermission?: NotificationPermission | 'default';
  onToggleNotifications?: () => void;
}

export default function Navigation({
  notificationsEnabled,
  notificationPermission,
  onToggleNotifications,
}: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userName } = useAppStore();
  const [copied, setCopied] = useState(false);
  const displayName = userName || getUserDisplayName();

  const isRoomPage = pathname?.startsWith('/room/');
  const roomId = isRoomPage ? pathname.split('/room/')[1] : null;

  const handleCopyRoomLink = useCallback(async () => {
    if (!roomId) return;

    const roomUrl = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      toast.success('Room link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy room link');
    }
  }, [roomId]);

  const handleGoHome = () => {
    router.push('/');
  };

  // Keyboard shortcut: Ctrl/Cmd+Shift+L → copy room link
  useEffect(() => {
    if (!isRoomPage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleCopyRoomLink();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isRoomPage, handleCopyRoomLink]);

  return (
    <nav className="border-b border-border bg-card px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isRoomPage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoHome}
              title="Go to home"
            >
              <Home className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">DevCanvas</h1>
            {isRoomPage && roomId && (
              <span className="hidden sm:inline text-sm text-muted-foreground">
                Room: {roomId.slice(0, 8)}...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {displayName && (
            <span className="hidden sm:inline max-w-[120px] truncate text-sm text-muted-foreground">
              {displayName}
            </span>
          )}
          {isRoomPage && onToggleNotifications && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onToggleNotifications();
                if (!notificationsEnabled && notificationPermission === 'denied') {
                  toast.error('Notifications blocked. Please enable them in your browser settings.');
                }
              }}
              title={
                notificationsEnabled
                  ? 'Disable notifications'
                  : notificationPermission === 'denied'
                    ? 'Notifications blocked by browser'
                    : 'Enable notifications'
              }
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
          )}
          {isRoomPage && roomId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyRoomLink}
              className="gap-2"
              aria-keyshortcuts="Control+Shift+L"
              title="Copy room link (Ctrl+Shift+L)"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="hidden sm:inline">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
