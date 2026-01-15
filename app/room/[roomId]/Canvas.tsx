'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor, Tldraw, TLStoreSnapshot } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { supabase } from '@/lib/supabaseClient';

interface CanvasProps {
  roomId: string;
}

// Throttle function to limit updates to 30fps
function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export default function Canvas({ roomId }: CanvasProps) {
  const editorRef = useRef<Editor | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const unsubscribeStoreRef = useRef<(() => void) | null>(null);
  const isApplyingRemoteChangesRef = useRef(false);
  const [isEditorMounted, setIsEditorMounted] = useState(false);

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
            // Use store.deserialize() instead of loadSnapshot()
            try {
              editor.store.deserialize(payload.snapshot);
            } catch (deserializeError) {
              console.error('Error deserializing snapshot:', deserializeError);
            }
          } else if (payload.changes) {
            // Incremental changes - merge into store
            editor.store.mergeRemoteChanges(() => {
              // Apply incremental updates
              // This is a simplified approach - for production, use proper CRDT/operational transforms
              const changes = payload.changes;
              if (Array.isArray(changes)) {
                changes.forEach((change: unknown) => {
                  // Apply each change to the store
                  // Adjust based on tldraw's actual change format
                });
              }
            });
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
    }, 33); // ~30fps

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
    <div className="h-full w-full">
      <Tldraw
        licenseKey="tldraw-2026-04-25/WyJ3M1ZQMW1lXyIsWyIqIl0sMTYsIjIwMjYtMDQtMjUiXQ.05S0RsR0exqXPYkefqGDaBOgnyzozeUqV45lGemiXe7fKNHGDtJeyCYl/BDui5fx6eibkU3+QlnGXlWnmMX4pA"
        onMount={handleMount}
        persistenceKey={`room-${roomId}`}
      />
    </div>
  );
}
