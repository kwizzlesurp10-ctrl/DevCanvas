'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import Chat from './Chat';
import VoiceDock from './VoiceDock';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { setCurrentRoomId, currentChannelId, setCurrentChannelId } = useAppStore();

  useEffect(() => {
    setCurrentRoomId(roomId);
    
    // Set default channel if none selected
    if (!currentChannelId) {
      // We'll load channels in Sidebar and set the first one
    }
  }, [roomId, setCurrentRoomId, currentChannelId, setCurrentChannelId]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar roomId={roomId} />

        {/* Main Canvas Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Canvas roomId={roomId} />
        </div>

        {/* Right Sidebar - Chat */}
        <Chat roomId={roomId} />
      </div>

      {/* Bottom Voice Dock */}
      <VoiceDock roomId={roomId} />
    </div>
  );
}
