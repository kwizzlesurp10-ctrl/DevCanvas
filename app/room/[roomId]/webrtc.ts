// WebRTC signaling and peer connection logic
import { supabase } from '@/lib/supabaseClient';

export interface WebRTCConfig {
  roomId: string;
  onLocalStream: (stream: MediaStream) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private localStream: MediaStream | null = null;
  private isInitiator = false;
  private config: WebRTCConfig;

  constructor(config: WebRTCConfig) {
    this.config = config;
  }

  async initialize() {
    // Create peer connection with STUN servers
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Set up Supabase realtime channel for signaling
    this.channel = supabase.channel(`room:${this.config.roomId}:webrtc`, {
      config: {
        broadcast: { self: false },
      },
    });

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.channel) {
        this.channel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate },
        });
      }
    };

    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      if (event.streams[0]) {
        this.config.onRemoteStream(event.streams[0]);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection && this.config.onConnectionStateChange) {
        this.config.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    // Subscribe to signaling messages
    this.channel
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (!this.peerConnection || this.isInitiator) return;

        try {
          // Validate payload structure
          if (!payload.offer || typeof payload.offer !== 'object') {
            console.error('Invalid offer payload:', payload);
            return;
          }

          // Ensure offer has required properties (type and sdp)
          const offer = payload.offer as RTCSessionDescriptionInit;
          if (!offer.type || !offer.sdp) {
            console.error('Offer missing required properties (type or sdp):', offer);
            return;
          }

          // Modern WebRTC: pass plain object directly, no RTCSessionDescription constructor
          await this.peerConnection.setRemoteDescription(offer);
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);

          this.channel?.send({
            type: 'broadcast',
            event: 'answer',
            payload: { answer },
          });
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (!this.peerConnection || !this.isInitiator) return;

        try {
          // Validate payload structure
          if (!payload.answer || typeof payload.answer !== 'object') {
            console.error('Invalid answer payload:', payload);
            return;
          }

          // Ensure answer has required properties (type and sdp)
          const answer = payload.answer as RTCSessionDescriptionInit;
          if (!answer.type || !answer.sdp) {
            console.error('Answer missing required properties (type or sdp):', answer);
            return;
          }

          // Modern WebRTC: pass plain object directly, no RTCSessionDescription constructor
          await this.peerConnection.setRemoteDescription(answer);
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (!this.peerConnection) return;

        try {
          await this.peerConnection.addIceCandidate(payload.candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      })
      .subscribe();

    // Check if we're the first peer (become initiator)
    // Simple heuristic: wait a bit and if no offer received, become initiator
    setTimeout(async () => {
      if (!this.isInitiator && this.peerConnection) {
        await this.createOffer();
      }
    }, 1000);
  }

  async createOffer() {
    if (!this.peerConnection || !this.channel) return;

    this.isInitiator = true;
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.channel.send({
      type: 'broadcast',
      event: 'offer',
      payload: { offer },
    });
  }

  async startLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false, // Voice only for now
      });

      // Add tracks to peer connection
      if (this.peerConnection) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection?.addTrack(track, this.localStream!);
        });
      }

      this.config.onLocalStream(this.localStream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Replace video track in peer connection
      if (this.peerConnection && this.localStream) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = this.peerConnection
          .getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        } else if (videoTrack) {
          this.peerConnection.addTrack(videoTrack, screenStream);
        }

        // Handle screen share stop
        videoTrack.onended = () => {
          this.stopScreenShare();
        };
      }

      return screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  async stopScreenShare() {
    if (this.localStream && this.peerConnection) {
      // Restore original video track if we had one, or remove video track
      const senders = this.peerConnection.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(null);
      }
    }
  }

  toggleMute() {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  }

  isMuted(): boolean {
    if (!this.localStream) return true;
    return this.localStream.getAudioTracks().some((track) => !track.enabled);
  }

  async cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }
  }
}
