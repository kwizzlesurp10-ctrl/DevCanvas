'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor, Tldraw, TLStoreSnapshot } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface CanvasProps {
  roomId: string;
}

// Throttle function to limit updates to 30fps
function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  } as T;
}

export default function Canvas({ roomId }: CanvasProps) {
  const editorRef = useRef<Editor | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const unsubscribeStoreRef = useRef<(() => void) | null>(null);
  const isApplyingRemoteChangesRef = useRef(false);
  const [isEditorMounted, setIsEditorMounted] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Cleanup store listener when component unmounts
  useEffect(() => {
    return () => {
      if (unsubscribeStoreRef.current) {
        unsubscribeStoreRef.current();
        unsubscribeStoreRef.current = null;
      }
    };
  }, []);

  // Set up Supabase channel subscription when both roomId and editor are available
  useEffect(() => {
    if (!roomId || !isEditorMounted || !editorRef.current) return;

    // Cleanup existing channel if roomId changes
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Create Supabase realtime channel for canvas updates
    const channel = supabase.channel(`room:${roomId}:canvas`, {
      config: {
        broadcast: { self: false }, // Don't echo our own messages
      },
    });

    channelRef.current = channel;

    // Subscribe to remote canvas updates
    channel
      .on('broadcast', { event: 'canvas-update' }, ({ payload }) => {
        if (!editorRef.current || isApplyingRemoteChangesRef.current) return;

        try {
          isApplyingRemoteChangesRef.current = true;
          const editor = editorRef.current;
          
          // Apply remote changes using tldraw's store API
          // The payload should contain the store snapshot or incremental changes
          if (payload.snapshot) {
            // Full snapshot update using tldraw v4 API
            // Note: For now, we'll skip applying snapshots to avoid API conflicts
            // In production, use tldraw's built-in multiplayer sync or proper store API
            try {
              // TODO: Implement proper snapshot loading when tldraw v4 API is finalized
              // For now, this is a placeholder to prevent runtime errors
              console.log('Received snapshot update (not applied - API pending)');
            } catch (loadError) {
              console.error('Error processing snapshot:', loadError);
            }
          } else if (payload.changes) {
            // Incremental changes - apply directly to store
            // This is a simplified approach - for production, use proper CRDT/operational transforms
            const changes = payload.changes;
            if (Array.isArray(changes)) {
              changes.forEach((change: unknown) => {
                // Apply each change to the store
                // Adjust based on tldraw's actual change format
                // For now, this is a placeholder - implement proper change application
              });
            }
          }
        } catch (error) {
          console.error('Error applying remote canvas changes:', error);
        } finally {
          isApplyingRemoteChangesRef.current = false;
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Canvas channel subscribed');
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId, isEditorMounted]); // Re-run when roomId or editor mount status changes

  // Make toolbars draggable
  useEffect(() => {
    if (!isEditorMounted || !editorRef.current) return;

    const cleanupFunctions: Array<() => void> = [];

    const makeToolbarsDraggable = () => {
      // Find all toolbar containers - use more specific selectors
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
            } catch (e) {
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
            localStorage.setItem(storageKey, JSON.stringify({
              x: rect.left,
              y: rect.top,
            }));

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
    };

    // Wait for tldraw to render toolbars
    const timeoutId = setTimeout(() => {
      makeToolbarsDraggable();
      
      // Also watch for dynamically added toolbars
      const observer = new MutationObserver(() => {
        makeToolbarsDraggable();
      });

      const container = document.querySelector('.tl-container');
      if (container) {
        observer.observe(container, {
          childList: true,
          subtree: true,
        });

        cleanupFunctions.push(() => {
          observer.disconnect();
        });
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [isEditorMounted]);

  const handleMount = (editor: Editor) => {
    // Cleanup previous subscription if editor is remounted
    if (unsubscribeStoreRef.current) {
      unsubscribeStoreRef.current();
      unsubscribeStoreRef.current = null;
    }

    editorRef.current = editor;
    setIsEditorMounted(true); // Trigger channel subscription effect

    // Throttle local changes and broadcast them (max 30fps = ~33ms)
    const throttledBroadcast = throttle((snapshot: TLStoreSnapshot) => {
      if (!channelRef.current || isApplyingRemoteChangesRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'canvas-update',
        payload: { snapshot },
      });
    }, 33) as (snapshot: TLStoreSnapshot) => void; // ~30fps

    // Set up store listener AFTER a brief delay to ensure channel subscription is ready
    // This prevents initial changes from being dropped if they occur synchronously
    setTimeout(() => {
      if (!editorRef.current) return; // Editor was unmounted before timeout

      // Listen to store changes and broadcast them
      // Store the unsubscribe function in a ref so we can clean it up properly
      unsubscribeStoreRef.current = editor.store.listen(() => {
        if (isApplyingRemoteChangesRef.current) return;
        
        // Get current store state and broadcast it
        // Note: Actual sync implementation depends on tldraw v4 API
        // For now, using simplified approach - broadcast changes indicator
        const changes = { updated: Date.now() };
        
        // TODO: Use proper tldraw v4 store API when available
        // For full collaboration, consider using tldraw's built-in multiplayer sync
        // throttledBroadcast(changes);
      });
    }, 100); // Small delay to ensure channel subscription effect has run
  };

  return (
    <div 
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Hide/Show Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsHidden(!isHidden)}
        className={`absolute top-2 left-2 z-50 transition-opacity duration-300 bg-background/80 backdrop-blur-sm border border-border/50 ${
          isHovering ? 'opacity-100' : 'opacity-5'
        } hover:opacity-100 hover:bg-background`}
        title={isHidden ? 'Show Canvas' : 'Hide Canvas'}
        onMouseEnter={(e) => {
          e.stopPropagation();
          setIsHovering(true);
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          setIsHovering(false);
        }}
      >
        {isHidden ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>

      {/* Canvas Container */}
      <div className={`h-full w-full transition-opacity duration-200 ${isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Tldraw
          licenseKey="tldraw-2026-04-25/WyJ3M1ZQMW1lXyIsWyIqIl0sMTYsIjIwMjYtMDQtMjUiXQ.05S0RsR0exqXPYkefqGDaBOgnyzozeUqV45lGemiXe7fKNHGDtJeyCYl/BDui5fx6eibkU3+QlnGXlWnmMX4pA"
          onMount={handleMount}
          persistenceKey={`room-${roomId}`}
        />
      </div>
    </div>
  );
}
