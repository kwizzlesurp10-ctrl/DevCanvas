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
            // Full snapshot update
            editor.store.loadSnapshot(payload.snapshot as TLStoreSnapshot);
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

    // Listen to store changes and broadcast them
    // Store the unsubscribe function in a ref so we can clean it up properly
    unsubscribeStoreRef.current = editor.store.listen(() => {
      if (isApplyingRemoteChangesRef.current) return;
      
      // Get current snapshot and broadcast it
      const snapshot = editor.store.getSnapshot();
      throttledBroadcast(snapshot);
    });
  };

  return (
    <div className="h-full w-full">
      <Tldraw
        onMount={handleMount}
        persistenceKey={`room-${roomId}`}
      />
    </div>
  );
}
