'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Panel, Group, Separator } from 'react-resizable-panels';
import Navigation from '@/components/Navigation';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import Chat from './Chat';
import VoiceDock from './VoiceDock';

// Panel size persistence keys
const PANEL_SIZE_KEYS = {
  sidebar: 'devcanvas-panel-sidebar',
  canvas: 'devcanvas-panel-canvas',
  chat: 'devcanvas-panel-chat',
  voice: 'devcanvas-panel-voice',
  main: 'devcanvas-panel-main',
} as const;

// Helper functions for panel size persistence
function getStoredPanelSize(key: string, defaultValue: number): number {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (stored) {
    const size = parseFloat(stored);
    if (!isNaN(size) && size >= 0 && size <= 100) {
      return size;
    }
  }
  return defaultValue;
}

function savePanelSize(key: string, size: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, size.toString());
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { setCurrentRoomId, setCurrentChannelId } = useAppStore();

  // Load saved panel sizes or use defaults
  // Ensure sizes add up to 100% for proper layout
  const [sidebarSize, setSidebarSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.sidebar, 20)
  );
  const [canvasSize, setCanvasSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.canvas, 50)
  );
  const [chatSize, setChatSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.chat, 30)
  );
  const [voiceSize, setVoiceSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.voice, 15)
  );
  const [mainSize, setMainSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.main, 85)
  );

  useEffect(() => {
    setCurrentRoomId(roomId);
    
    // Clear channel selection when room changes
    // This ensures we don't keep a channel from the previous room
    setCurrentChannelId(null);
  }, [roomId, setCurrentRoomId, setCurrentChannelId]);

  // Handler for horizontal panel layout changes (sidebar, canvas, chat)
  const handleHorizontalLayoutChange = (layout: { [panelId: string]: number }) => {
    const sidebarSize = layout['sidebar-panel'];
    const canvasSize = layout['canvas-panel'];
    const chatSize = layout['chat-panel'];
    
    if (sidebarSize !== undefined) {
      setSidebarSize(sidebarSize);
      savePanelSize(PANEL_SIZE_KEYS.sidebar, sidebarSize);
    }
    if (canvasSize !== undefined) {
      setCanvasSize(canvasSize);
      savePanelSize(PANEL_SIZE_KEYS.canvas, canvasSize);
    }
    if (chatSize !== undefined) {
      setChatSize(chatSize);
      savePanelSize(PANEL_SIZE_KEYS.chat, chatSize);
    }
  };

  // Handler for vertical panel layout changes (main, voice)
  const handleVerticalLayoutChange = (layout: { [panelId: string]: number }) => {
    const mainSize = layout['main-panel'];
    const voiceSize = layout['voice-panel'];
    
    if (mainSize !== undefined) {
      setMainSize(mainSize);
      savePanelSize(PANEL_SIZE_KEYS.main, mainSize);
    }
    if (voiceSize !== undefined) {
      setVoiceSize(voiceSize);
      savePanelSize(PANEL_SIZE_KEYS.voice, voiceSize);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Navigation />
      <div className="flex-1 overflow-hidden">
        <Group 
          orientation="vertical"
          onLayoutChange={handleVerticalLayoutChange}
        >
          {/* Main content area with horizontal panels */}
          <Panel
            defaultSize={mainSize}
            minSize={30}
            id="main-panel"
          >
            <Group 
              orientation="horizontal"
              onLayoutChange={handleHorizontalLayoutChange}
            >
              {/* Left Sidebar - Channels */}
              <Panel
                defaultSize={sidebarSize}
                minSize={15}
                maxSize={40}
                id="sidebar-panel"
              >
                <Sidebar roomId={roomId} />
              </Panel>

              <Separator className="w-1 bg-border hover:bg-primary transition-colors duration-200 cursor-col-resize" />

              {/* Main Canvas Area */}
              <Panel
                defaultSize={canvasSize}
                minSize={30}
                maxSize={70}
                id="canvas-panel"
              >
                <div className="h-full w-full overflow-hidden">
                  <Canvas roomId={roomId} />
                </div>
              </Panel>

              <Separator className="w-1 bg-border hover:bg-primary transition-colors duration-200 cursor-col-resize" />

              {/* Right Sidebar - Chat */}
              <Panel
                defaultSize={chatSize}
                minSize={15}
                maxSize={40}
                id="chat-panel"
              >
                <Chat roomId={roomId} />
              </Panel>
            </Group>
          </Panel>

          <Separator className="h-1 bg-border hover:bg-primary transition-colors duration-200 cursor-row-resize" />

          {/* Bottom Voice Dock */}
          <Panel
            defaultSize={voiceSize}
            minSize={8}
            maxSize={30}
            id="voice-panel"
          >
            <VoiceDock roomId={roomId} />
          </Panel>
        </Group>
      </div>
    </div>
  );
}
