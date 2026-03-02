'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Panel, Group, Separator, usePanelRef } from 'react-resizable-panels';
import Navigation from '@/components/Navigation';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import Chat from './Chat';
import VoiceDock from './VoiceDock';
import { Hash, PenSquare, MessageCircle, Mic } from 'lucide-react';

// Panel size persistence keys
const PANEL_SIZE_KEYS = {
  sidebar: 'devcanvas-panel-sidebar',
  canvas: 'devcanvas-panel-canvas',
  chat: 'devcanvas-panel-chat',
  voice: 'devcanvas-panel-voice',
  main: 'devcanvas-panel-main',
} as const;

// Matches Tailwind's `md` breakpoint (768px) — expressed as max-width so values
// below 768px are treated as mobile.
const MOBILE_BREAKPOINT = '(max-width: 767px)';

// Delay (ms) to allow a mobile panel switch to finish rendering before focusing
// an element inside the newly-visible panel.
const PANEL_SWITCH_FOCUS_DELAY_MS = 50;

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

type MobilePanel = 'channels' | 'canvas' | 'chat' | 'voice';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { setCurrentRoomId, setCurrentChannelId } = useAppStore();

  // Detect mobile screen size (lazy initializer avoids SSR mismatch)
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(MOBILE_BREAKPOINT).matches
      : false
  );
  const [mobileActivePanel, setMobileActivePanel] = useState<MobilePanel>('canvas');

  // Load saved panel sizes or use defaults
  // Canvas-first layout: prioritize canvas space (60% of horizontal space)
  // Ensure sizes add up to 100% for proper layout
  const [sidebarSize, setSidebarSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.sidebar, 15)
  );
  const [canvasSize, setCanvasSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.canvas, 60)
  );
  const [chatSize, setChatSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.chat, 25)
  );
  const [voiceSize, setVoiceSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.voice, 12)
  );
  const [mainSize, setMainSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.main, 88)
  );

  // Imperative ref for sidebar panel (for keyboard shortcut toggle)
  const sidebarPanelRef = usePanelRef();

  useEffect(() => {
    setCurrentRoomId(roomId);
    
    // Clear channel selection when room changes
    // This ensures we don't keep a channel from the previous room
    setCurrentChannelId(null);
  }, [roomId, setCurrentRoomId, setCurrentChannelId]);

  // Keep mobile state in sync with viewport changes
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BREAKPOINT);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const isMod = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd+B: toggle sidebar (desktop only)
      if (isMod && e.key === 'b') {
        e.preventDefault();
        if (isMobile) {
          setMobileActivePanel((prev) => (prev === 'channels' ? 'canvas' : 'channels'));
        } else if (sidebarPanelRef.current) {
          if (sidebarPanelRef.current.isCollapsed()) {
            sidebarPanelRef.current.expand();
          } else {
            sidebarPanelRef.current.collapse();
          }
        }
        return;
      }

      // /: focus chat input (when not already in an input)
      if (e.key === '/' && !isInInput) {
        e.preventDefault();
        if (isMobile) {
          setMobileActivePanel('chat');
        }
        // Small delay to let the mobile panel switch render before focusing
        setTimeout(() => {
          document.getElementById('chat-message-input')?.focus();
        }, PANEL_SWITCH_FOCUS_DELAY_MS);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, sidebarPanelRef]);

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

  const mobileTabs: { id: MobilePanel; label: string; icon: React.ReactNode }[] = [
    { id: 'channels', label: 'Channels', icon: <Hash className="h-5 w-5" /> },
    { id: 'canvas', label: 'Canvas', icon: <PenSquare className="h-5 w-5" /> },
    { id: 'chat', label: 'Chat', icon: <MessageCircle className="h-5 w-5" /> },
    { id: 'voice', label: 'Voice', icon: <Mic className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Navigation />

      {/* Mobile layout (< md) */}
      {isMobile ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Active panel content */}
          <div className="flex-1 overflow-hidden">
            <div className={mobileActivePanel === 'channels' ? 'h-full' : 'hidden'}>
              <Sidebar roomId={roomId} />
            </div>
            <div className={mobileActivePanel === 'canvas' ? 'h-full' : 'hidden'}>
              <Canvas roomId={roomId} />
            </div>
            <div className={mobileActivePanel === 'chat' ? 'h-full' : 'hidden'}>
              <Chat roomId={roomId} />
            </div>
            <div className={mobileActivePanel === 'voice' ? 'h-full' : 'hidden'}>
              <VoiceDock roomId={roomId} />
            </div>
          </div>

          {/* Mobile tab bar */}
          <nav className="flex border-t border-border bg-card" aria-label="Mobile panel navigation">
            {mobileTabs.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setMobileActivePanel(id)}
                aria-pressed={mobileActivePanel === id}
                className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
                  mobileActivePanel === id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </nav>
        </div>
      ) : (
        /* Desktop layout (md+) */
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
                  panelRef={sidebarPanelRef}
                  defaultSize={sidebarSize}
                  minSize={15}
                  maxSize={40}
                  collapsible={true}
                  collapsedSize={0}
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
      )}
    </div>
  );
}
