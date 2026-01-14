'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Monitor, MonitorOff, Phone, PhoneOff } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { WebRTCManager } from './webrtc';

interface VoiceDockProps {
  roomId: string;
}

export default function VoiceDock({ roomId }: VoiceDockProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const { setVoiceConnected, setMuted, setScreenSharing } = useAppStore();

  // Use refs to store store setters to avoid stale closures
  const storeSettersRef = useRef({ setVoiceConnected, setMuted, setScreenSharing });
  
  // Update refs when setters change (though Zustand setters are stable)
  useEffect(() => {
    storeSettersRef.current = { setVoiceConnected, setMuted, setScreenSharing };
  }, [setVoiceConnected, setMuted, setScreenSharing]);

  useEffect(() => {
    if (!roomId) return;

    // Initialize WebRTC
    const webrtc = new WebRTCManager({
      roomId,
      onLocalStream: (stream) => {
        setLocalStream(stream);
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = stream;
          localAudioRef.current.muted = true; // Mute local audio to prevent feedback
        }
      },
      onRemoteStream: (stream) => {
        setRemoteStream(stream);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
        }
        setIsConnected(true);
        // Use ref to access latest setter
        storeSettersRef.current.setVoiceConnected(true);
      },
      onConnectionStateChange: (state) => {
        const connected = state === 'connected';
        setIsConnected(connected);
        // Use ref to access latest setter
        storeSettersRef.current.setVoiceConnected(connected);
      },
    });

    webrtcRef.current = webrtc;

    // Auto-connect on mount
    webrtc.initialize().then(() => {
      webrtc.startLocalStream().catch((error) => {
        console.error('Failed to start local stream:', error);
      });
    });

    return () => {
      webrtc.cleanup();
    };
  }, [roomId]); // Only depend on roomId, use refs for store setters

  // Update audio elements when streams change
  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleToggleMute = () => {
    if (webrtcRef.current) {
      webrtcRef.current.toggleMute();
      const muted = webrtcRef.current.isMuted();
      setIsMuted(muted);
      storeSettersRef.current.setMuted(muted);
    }
  };

  const handleToggleScreenShare = async () => {
    if (!webrtcRef.current) return;

    try {
      if (isScreenSharing) {
        await webrtcRef.current.stopScreenShare();
        setIsScreenSharing(false);
        storeSettersRef.current.setScreenSharing(false);
      } else {
        await webrtcRef.current.startScreenShare();
        setIsScreenSharing(true);
        storeSettersRef.current.setScreenSharing(true);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      alert('Failed to toggle screen share');
    }
  };

  const handleDisconnect = async () => {
    if (webrtcRef.current) {
      await webrtcRef.current.cleanup();
      setIsConnected(false);
      storeSettersRef.current.setVoiceConnected(false);
      setIsMuted(false);
      setIsScreenSharing(false);
      storeSettersRef.current.setMuted(false);
      storeSettersRef.current.setScreenSharing(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-t border-border bg-card p-4">
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
      </div>

      <div className="text-xs text-muted-foreground">
        {isConnected ? 'Connected' : 'Connecting...'}
      </div>
    </div>
  );
}
