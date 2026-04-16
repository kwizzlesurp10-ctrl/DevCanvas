// WebRTC signaling and peer connection logic
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

export interface WebRTCConfig {
  roomId: string;
  onLocalStream: (stream: MediaStream) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

const SessionDescriptionSchema = z.object({
  type: z.enum(['offer', 'answer', 'pranswer', 'rollback']),
  sdp: z.string().min(1),
});

const IceCandidatePayloadSchema = z.object({
  candidate: z.custom<RTCIceCandidateInit>(
    (value) => typeof value === 'object' && value !== null,
    'ICE candidate payload is invalid'
  ),
});

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private localStream: MediaStream | null = null;
  private isInitiator = false;
  private hasReceivedOffer = false;
  private hasCreatedOffer = false;
  private offerTimer: ReturnType<typeof setTimeout> | null = null;
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
          const parsedOffer = SessionDescriptionSchema.safeParse(payload.offer);
          if (!parsedOffer.success) {
            console.error('Invalid offer payload:', payload);
            return;
          }

          this.hasReceivedOffer = true;

          // Modern WebRTC: pass plain object directly, no RTCSessionDescription constructor
          await this.peerConnection.setRemoteDescription(parsedOffer.data);
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
          const parsedAnswer = SessionDescriptionSchema.safeParse(payload.answer);
          if (!parsedAnswer.success) {
            console.error('Invalid answer payload:', payload);
            return;
          }

          // Modern WebRTC: pass plain object directly, no RTCSessionDescription constructor
          await this.peerConnection.setRemoteDescription(parsedAnswer.data);
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (!this.peerConnection) return;

        try {
          const parsedCandidate = IceCandidatePayloadSchema.safeParse(payload);
          if (!parsedCandidate.success) {
            console.error('Invalid ICE candidate payload:', payload);
            return;
          }

          await this.peerConnection.addIceCandidate(parsedCandidate.data.candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      })
      .subscribe();

    // Check if we're the first peer (become initiator)
    // Simple heuristic: wait a bit and if no offer received, become initiator
    this.offerTimer = setTimeout(async () => {
      if (!this.isInitiator && !this.hasReceivedOffer && this.peerConnection) {
        await this.createOffer();
      }
    }, 1000);
  }

  async createOffer() {
    if (!this.peerConnection || !this.channel) return;

    this.hasCreatedOffer = true;
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
    if (this.offerTimer) {
      clearTimeout(this.offerTimer);
      this.offerTimer = null;
    }

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
