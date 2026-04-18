'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mic, MicOff, Monitor, MonitorOff, Phone, PhoneOff } from 'lucide-react';
import { useWebRTC } from './hooks/useWebRTC';

interface VoiceDockProps {
  roomId: string;
}

export default function VoiceDock({ roomId }: VoiceDockProps) {
  const {
    isConnected,
    isMuted,
    isScreenSharing,
    localStream,
    remoteStream,
    connect,
    disconnect,
    toggleMute,
    toggleScreenShare,
    localAudioRef,
    remoteAudioRef,
  } = useWebRTC(roomId);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect:', error);
      toast.error('Failed to access microphone. Please grant permissions and try again.');
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleToggleMute = () => {
    toggleMute();
  };

  const handleToggleScreenShare = async () => {
    try {
      await toggleScreenShare();
    } catch (error) {
      console.error('Error toggling screen share:', error);
      toast.error('Failed to toggle screen share');
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-between border-t border-border bg-card p-4">
      <div className="flex items-center gap-2">
        {/* Hidden audio elements for playback */}
        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay />

        {/* Participant avatars/indicators */}
        <div className="flex items-center gap-2">
          {localStream && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              {isMuted ? '🔇' : '🎤'}
            </div>
          )}
          {remoteStream && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs">
              🎧
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isConnected ? (
          <Button
            variant="default"
            size="icon"
            onClick={handleConnect}
            title="Connect voice"
          >
            <Phone className="h-4 w-4" />
          </Button>
        ) : (
          <>
            <Button
              variant={isMuted ? 'destructive' : 'default'}
              size="icon"
              onClick={handleToggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            <Button
              variant={isScreenSharing ? 'default' : 'outline'}
              size="icon"
              onClick={handleToggleScreenShare}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              {isScreenSharing ? (
                <MonitorOff className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="destructive"
              size="icon"
              onClick={handleDisconnect}
              title="Disconnect"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {isConnected ? 'Connected' : 'Not connected'}
      </div>
    </div>
  );
}
