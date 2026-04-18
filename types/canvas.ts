// Additional Canvas-specific types

export interface CanvasThrottleFunction {
  (snapshot: TLStoreSnapshot): void;
}

export interface ToolbarDragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
}

export interface ToolbarPosition {
  x: number;
  y: number;
}

export interface CanvasHookState {
  isEditorMounted: boolean;
  isHidden: boolean;
  isHovering: boolean;
}

// Re-export tldraw types for convenience
import type { TLStoreSnapshot } from '@tldraw/tldraw';
export type { TLStoreSnapshot };
