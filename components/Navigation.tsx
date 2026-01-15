'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, Copy, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getUserDisplayName } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentRoomId, userName } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    setDisplayName(userName || getUserDisplayName());
  }, [userName]);

  const isRoomPage = pathname?.startsWith('/room/');
  const roomId = isRoomPage ? pathname.split('/room/')[1] : null;

  const handleCopyRoomLink = async () => {
    if (!roomId) return;

    const roomUrl = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      toast.success('Room link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy room link');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

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
              <span className="text-sm text-muted-foreground">
                Room: {roomId.slice(0, 8)}...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {displayName && (
            <span className="text-sm text-muted-foreground">
              {displayName}
            </span>
          )}
          {isRoomPage && roomId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyRoomLink}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
