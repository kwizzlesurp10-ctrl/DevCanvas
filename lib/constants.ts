// Centralized constants for DevCanvas application

// Breakpoints
export const MOBILE_BREAKPOINT = '(max-width: 767px)'; // Matches Tailwind's `md` breakpoint (768px)

// Panel size persistence keys
export const PANEL_SIZE_KEYS = {
  sidebar: 'devcanvas-panel-sidebar',
  canvas: 'devcanvas-panel-canvas',
  chat: 'devcanvas-panel-chat',
  voice: 'devcanvas-panel-voice',
  main: 'devcanvas-panel-main',
} as const;

// Default panel sizes (percentages)
export const DEFAULT_PANEL_SIZES = {
  sidebar: 15,
  canvas: 60,  // Canvas-first layout: prioritize canvas space
  chat: 25,
  voice: 12,
  main: 88,
} as const;

// Timing constants (milliseconds)
export const TIMING = {
  PANEL_SWITCH_FOCUS_DELAY: 50,  // Delay for mobile panel switch before focusing
  CANVAS_CHANNEL_SUBSCRIPTION_DELAY: 100,  // Delay before setting up canvas store listener
  TOOLBAR_DRAGGABLE_INIT_DELAY: 500,  // Wait for tldraw to render toolbars
  WEBRTC_INITIATOR_TIMEOUT: 1000,  // Wait before becoming WebRTC initiator
} as const;

// Canvas sync
export const CANVAS_SYNC_FPS = 30;
export const CANVAS_THROTTLE_MS = Math.floor(1000 / CANVAS_SYNC_FPS); // ~33ms for 30fps

// WebRTC configuration
export const WEBRTC_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
] as const;

// Panel size constraints
export const PANEL_CONSTRAINTS = {
  sidebar: { min: 15, max: 40 },
  canvas: { min: 30, max: 70 },
  chat: { min: 15, max: 40 },
  voice: { min: 8, max: 30 },
  main: { min: 30, max: 100 },
} as const;
