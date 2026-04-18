import { useState, useCallback } from 'react';
import { PANEL_SIZE_KEYS, DEFAULT_PANEL_SIZES } from '@/lib/constants';

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

interface PanelSizes {
  sidebar: number;
  canvas: number;
  chat: number;
  voice: number;
  main: number;
}

interface PanelSizeHandlers {
  handleHorizontalLayoutChange: (layout: { [panelId: string]: number }) => void;
  handleVerticalLayoutChange: (layout: { [panelId: string]: number }) => void;
}

/**
 * Hook to manage panel size state and persistence across browser sessions.
 * Loads saved sizes from localStorage and provides handlers for layout changes.
 */
export function usePanelPersistence(): [PanelSizes, PanelSizeHandlers] {
  // Load saved panel sizes or use defaults
  const [sidebarSize, setSidebarSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.sidebar, DEFAULT_PANEL_SIZES.sidebar)
  );
  const [canvasSize, setCanvasSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.canvas, DEFAULT_PANEL_SIZES.canvas)
  );
  const [chatSize, setChatSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.chat, DEFAULT_PANEL_SIZES.chat)
  );
  const [voiceSize, setVoiceSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.voice, DEFAULT_PANEL_SIZES.voice)
  );
  const [mainSize, setMainSize] = useState(() =>
    getStoredPanelSize(PANEL_SIZE_KEYS.main, DEFAULT_PANEL_SIZES.main)
  );

  // Handler for horizontal panel layout changes (sidebar, canvas, chat)
  const handleHorizontalLayoutChange = useCallback((layout: { [panelId: string]: number }) => {
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
  }, []);

  // Handler for vertical panel layout changes (main, voice)
  const handleVerticalLayoutChange = useCallback((layout: { [panelId: string]: number }) => {
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
  }, []);

  return [
    { sidebar: sidebarSize, canvas: canvasSize, chat: chatSize, voice: voiceSize, main: mainSize },
    { handleHorizontalLayoutChange, handleVerticalLayoutChange },
  ];
}
