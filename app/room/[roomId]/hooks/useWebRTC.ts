import { useEffect, useState, useRef, useCallback } from 'react';
import { WebRTCManager } from '../webrtc';
import { useAppStore } from '@/lib/store';

interface UseWebRTCResult {
  isConnected: boolean;
  isMuted: boolean;
  isScreenSharing: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMute: () => void;
  toggleScreenShare: () => Promise<void>;
  localAudioRef: React.RefObject<HTMLAudioElement>;
  remoteAudioRef: React.RefObject<HTMLAudioElement>;
}

/**
 * Hook to manage WebRTC connection lifecycle for voice/video communication.
 * Wraps WebRTCManager class with React hooks pattern.
 */
export function useWebRTC(roomId: string): UseWebRTCResult {
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

    // Initialize WebRTC manager but don't auto-connect
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
        storeSettersRef.current.setVoiceConnected(true);
      },
      onConnectionStateChange: (state) => {
        const connected = state === 'connected';
        setIsConnected(connected);
        storeSettersRef.current.setVoiceConnected(connected);
      },
    });

    webrtcRef.current = webrtc;

    return () => {
      webrtc.cleanup();
    };
  }, [roomId]);

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

  const connect = useCallback(async () => {
    if (!webrtcRef.current) return;

    await webrtcRef.current.initialize();
    await webrtcRef.current.startLocalStream();
    setIsConnected(true);
    storeSettersRef.current.setVoiceConnected(true);
  }, []);

  const disconnect = useCallback(async () => {
    if (webrtcRef.current) {
      await webrtcRef.current.cleanup();
      setIsConnected(false);
      storeSettersRef.current.setVoiceConnected(false);
      setIsMuted(false);
      setIsScreenSharing(false);
      storeSettersRef.current.setMuted(false);
      storeSettersRef.current.setScreenSharing(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (webrtcRef.current) {
      webrtcRef.current.toggleMute();
      const muted = webrtcRef.current.isMuted();
      setIsMuted(muted);
      storeSettersRef.current.setMuted(muted);
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!webrtcRef.current) return;

    if (isScreenSharing) {
      await webrtcRef.current.stopScreenShare();
      setIsScreenSharing(false);
      storeSettersRef.current.setScreenSharing(false);
    } else {
      await webrtcRef.current.startScreenShare();
      setIsScreenSharing(true);
      storeSettersRef.current.setScreenSharing(true);
    }
  }, [isScreenSharing]);

  return {
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
  };
}
