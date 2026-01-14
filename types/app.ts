// Application state types

export interface AppState {
  currentRoomId: string | null;
  currentChannelId: string | null;
  userId: string;
  userName: string;
  isVoiceConnected: boolean;
  isMuted: boolean;
  isScreenSharing: boolean;
}

export interface WebRTCState {
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isInitializing: boolean;
}
