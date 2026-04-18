import type { TLStoreSnapshot } from '@tldraw/tldraw';
import { CANVAS_THROTTLE_MS } from '@/lib/constants';

/**
 * Throttle function to limit canvas updates to target FPS
 */
export function throttleSnapshot(
  func: (snapshot: TLStoreSnapshot) => void,
  limit: number = CANVAS_THROTTLE_MS
): (snapshot: TLStoreSnapshot) => void {
  let inThrottle = false;
  return function (snapshot: TLStoreSnapshot) {
    if (!inThrottle) {
      func(snapshot);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Make tldraw toolbars draggable and save their positions to localStorage
 */
export function makeToolbarsDraggable(): Array<() => void> {
  const cleanupFunctions: Array<() => void> = [];

  // Find all toolbar containers - use specific selectors
  const toolbarSelectors = [
    '.tlui-layout__top',
    '.tlui-layout__top > div',
    '.tlui-layout__top__left',
    '.tlui-layout__top__center',
    '.tlui-layout__top__right',
    '.tlui-layout__bottom',
    '.tlui-layout__bottom > div',
    '.tlui-layout__bottom__left',
    '.tlui-layout__bottom__center',
    '.tlui-layout__bottom__right',
    '.tlui-menu-zone',
    '.tlui-help-menu',
    '.tlui-menu',
  ];

  toolbarSelectors.forEach((selector) => {
    const toolbars = document.querySelectorAll(selector);
    toolbars.forEach((toolbar) => {
      const element = toolbar as HTMLElement;

      // Skip if already made draggable or if element is too small
      if (element.dataset.draggable === 'true' || element.offsetWidth < 20) return;

      // Make it draggable
      element.dataset.draggable = 'true';
      element.style.cursor = 'move';
      element.style.userSelect = 'none';

      // Get stored position
      const elementId = element.className || selector;
      const storageKey = `toolbar-pos-${elementId.replace(/\s+/g, '-')}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const { x, y } = JSON.parse(stored);
          element.style.position = 'absolute';
          element.style.left = `${x}px`;
          element.style.top = `${y}px`;
          element.style.zIndex = '1000';
        } catch {
          // Invalid stored data, ignore
        }
      }

      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initialX = 0;
      let initialY = 0;

      const handleMouseDown = (e: MouseEvent) => {
        // Only start drag on left mouse button
        if (e.button !== 0) return;

        // Don't drag if clicking on interactive elements inside toolbar
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'BUTTON' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.closest('button') ||
          target.closest('input') ||
          target.closest('select') ||
          target.closest('[role="button"]')
        ) {
          return;
        }

        isDragging = true;
        const rect = element.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        initialX = rect.left;
        initialY = rect.top;

        element.style.position = 'absolute';
        element.style.zIndex = '1000';
        element.style.pointerEvents = 'auto';
        element.style.transition = 'none'; // Disable transitions during drag

        e.preventDefault();
        e.stopPropagation();
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const newX = initialX + deltaX;
        const newY = initialY + deltaY;

        // Constrain to viewport
        const maxX = window.innerWidth - element.offsetWidth;
        const maxY = window.innerHeight - element.offsetHeight;

        element.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
        element.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
      };

      const handleMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;

        // Save position
        const rect = element.getBoundingClientRect();
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            x: rect.left,
            y: rect.top,
          })
        );

        // Re-enable transitions
        element.style.transition = '';
      };

      element.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      // Store cleanup function
      cleanupFunctions.push(() => {
        element.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      });
    });
  });

  return cleanupFunctions;
}
