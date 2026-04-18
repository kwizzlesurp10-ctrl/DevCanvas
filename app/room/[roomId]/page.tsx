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
import { usePanelPersistence } from './hooks/usePanelPersistence';
import { MOBILE_BREAKPOINT, TIMING, PANEL_CONSTRAINTS } from '@/lib/constants';

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

  // Use custom hook for panel size persistence
  const [panelSizes, panelHandlers] = usePanelPersistence();

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
        }, TIMING.PANEL_SWITCH_FOCUS_DELAY);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, sidebarPanelRef]);

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
            onLayoutChange={panelHandlers.handleVerticalLayoutChange}
          >
            {/* Main content area with horizontal panels */}
            <Panel
              defaultSize={panelSizes.main}
              minSize={PANEL_CONSTRAINTS.main.min}
              id="main-panel"
            >
              <Group
                orientation="horizontal"
                onLayoutChange={panelHandlers.handleHorizontalLayoutChange}
              >
                {/* Left Sidebar - Channels */}
                <Panel
                  panelRef={sidebarPanelRef}
                  defaultSize={panelSizes.sidebar}
                  minSize={PANEL_CONSTRAINTS.sidebar.min}
                  maxSize={PANEL_CONSTRAINTS.sidebar.max}
                  collapsible={true}
                  collapsedSize={0}
                  id="sidebar-panel"
                >
                  <Sidebar roomId={roomId} />
                </Panel>

                <Separator className="w-1 bg-border hover:bg-primary transition-colors duration-200 cursor-col-resize" />

                {/* Main Canvas Area */}
                <Panel
                  defaultSize={panelSizes.canvas}
                  minSize={PANEL_CONSTRAINTS.canvas.min}
                  maxSize={PANEL_CONSTRAINTS.canvas.max}
                  id="canvas-panel"
                >
                  <div className="h-full w-full overflow-hidden">
                    <Canvas roomId={roomId} />
                  </div>
                </Panel>

                <Separator className="w-1 bg-border hover:bg-primary transition-colors duration-200 cursor-col-resize" />

                {/* Right Sidebar - Chat */}
                <Panel
                  defaultSize={panelSizes.chat}
                  minSize={PANEL_CONSTRAINTS.chat.min}
                  maxSize={PANEL_CONSTRAINTS.chat.max}
                  id="chat-panel"
                >
                  <Chat roomId={roomId} />
                </Panel>
              </Group>
            </Panel>

            <Separator className="h-1 bg-border hover:bg-primary transition-colors duration-200 cursor-row-resize" />

            {/* Bottom Voice Dock */}
            <Panel
              defaultSize={panelSizes.voice}
              minSize={PANEL_CONSTRAINTS.voice.min}
              maxSize={PANEL_CONSTRAINTS.voice.max}
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
