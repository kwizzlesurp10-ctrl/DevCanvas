'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor, Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { throttleSnapshot, makeToolbarsDraggable } from '@/lib/utils/canvas';
import { CANVAS_THROTTLE_MS, TIMING } from '@/lib/constants';
import type { TLStoreSnapshot } from '@/types/canvas';

interface CanvasProps {
  roomId: string;
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
          // Apply remote changes using tldraw's store API
          // The payload should contain the store snapshot or incremental changes
          if (payload.snapshot) {
            // Full snapshot update using tldraw v4 API
            // Note: For now, we'll skip applying snapshots to avoid API conflicts
            // In production, use tldraw's built-in multiplayer sync or proper store API
            try {
              // TODO: Implement proper snapshot loading when tldraw v4 API is finalized
              // For now, this is a placeholder to prevent runtime errors
            } catch (loadError) {
              console.error('Error processing snapshot:', loadError);
            }
          } else if (payload.changes) {
            // Incremental changes - apply directly to store
            // This is a simplified approach - for production, use proper CRDT/operational transforms
            const changes = payload.changes;
            if (Array.isArray(changes)) {
              changes.forEach(() => {
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
      .subscribe(() => {
        // Channel ready; broadcast handlers are active
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId, isEditorMounted]); // Re-run when roomId or editor mount status changes

  // Make toolbars draggable
  useEffect(() => {
    if (!isEditorMounted || !editorRef.current) return;

    // Wait for tldraw to render toolbars
    const timeoutId = setTimeout(() => {
      const cleanupFunctions = makeToolbarsDraggable();

      // Also watch for dynamically added toolbars
      const observer = new MutationObserver(() => {
        const newCleanups = makeToolbarsDraggable();
        cleanupFunctions.push(...newCleanups);
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

      return () => {
        clearTimeout(timeoutId);
        cleanupFunctions.forEach((cleanup) => cleanup());
      };
    }, TIMING.TOOLBAR_DRAGGABLE_INIT_DELAY);

    return () => {
      clearTimeout(timeoutId);
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
    const throttledBroadcast = throttleSnapshot((snapshot: TLStoreSnapshot) => {
      if (!channelRef.current || isApplyingRemoteChangesRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'canvas-update',
        payload: { snapshot },
      });
    }, CANVAS_THROTTLE_MS);

    // Set up store listener AFTER a brief delay to ensure channel subscription is ready
    // This prevents initial changes from being dropped if they occur synchronously
    setTimeout(() => {
      if (!editorRef.current) return; // Editor was unmounted before timeout

      // Listen to store changes and broadcast them
      // Store the unsubscribe function in a ref so we can clean it up properly
      unsubscribeStoreRef.current = editor.store.listen(() => {
        if (isApplyingRemoteChangesRef.current) return;

        // Get current store snapshot and broadcast to other peers
        throttledBroadcast(editor.store.getStoreSnapshot());
      });
    }, TIMING.CANVAS_CHANNEL_SUBSCRIPTION_DELAY); // Small delay to ensure channel subscription effect has run
  };

  // Handle canvas resize/transform properly when container size changes
  // Note: tldraw v4 handles resize internally via its own ResizeObserver
  // We add a manual trigger to ensure proper updates when panels are resized
  useEffect(() => {
    if (!isEditorMounted || !editorRef.current) return;

    // Set up resize observer to ensure canvas updates on container size changes
    const resizeObserver = new ResizeObserver((entries) => {
      if (editorRef.current && entries.length > 0) {
        // Container size changed; trigger viewport recalc
        void entries[0].contentRect;
        
        // Trigger a re-render by updating the editor's viewport
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          if (editorRef.current) {
            // Force tldraw to recalculate its viewport by dispatching a resize event
            window.dispatchEvent(new Event('resize'));
          }
        });
      }
    });

    // Observe the canvas container for size changes
    const container = document.querySelector('.tl-container');
    if (container) {
      resizeObserver.observe(container);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, [isEditorMounted]);

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
      <div 
        className={`h-full w-full transition-opacity duration-200 ${isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ 
          position: 'relative',
          minHeight: 0, // Allow flexbox to shrink
          minWidth: 0,  // Allow flexbox to shrink
        }}
      >
        <Tldraw
          licenseKey="tldraw-2026-04-25/WyJ3M1ZQMW1lXyIsWyIqIl0sMTYsIjIwMjYtMDQtMjUiXQ.05S0RsR0exqXPYkefqGDaBOgnyzozeUqV45lGemiXe7fKNHGDtJeyCYl/BDui5fx6eibkU3+QlnGXlWnmMX4pA"
          onMount={handleMount}
          persistenceKey={`room-${roomId}`}
        />
      </div>
    </div>
  );
}
