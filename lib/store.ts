import { create } from 'zustand';
import type { AppState } from '@/types/app';

interface AppStore extends AppState {
  setCurrentRoomId: (roomId: string | null) => void;
  setCurrentChannelId: (channelId: string | null) => void;
  setUserId: (userId: string) => void;
  setUserName: (userName: string) => void;
  setVoiceConnected: (connected: boolean) => void;
  setMuted: (muted: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentRoomId: null,
  currentChannelId: null,
  userId: '',
  userName: 'Anonymous',
  isVoiceConnected: false,
  isMuted: false,
  isScreenSharing: false,
  setCurrentRoomId: (roomId) => set({ currentRoomId: roomId }),
  setCurrentChannelId: (channelId) => set({ currentChannelId: channelId }),
  setUserId: (userId) => set({ userId }),
  setUserName: (userName) => set({ userName }),
  setVoiceConnected: (connected) => set({ isVoiceConnected: connected }),
  setMuted: (muted) => set({ isMuted: muted }),
  setScreenSharing: (sharing) => set({ isScreenSharing: sharing }),
}));
