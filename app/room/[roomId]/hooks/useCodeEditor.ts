'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';
import { CODE_EDITOR_SYNC_DEBOUNCE, type SupportedLanguage } from '@/lib/constants';

export interface CodeSnippet {
  id: string;
  title: string;
  language: SupportedLanguage;
  content: string;
  author_id: string;
  updated_at: number;
}

type BroadcastPayload =
  | { type: 'snippet_create'; snippet: CodeSnippet }
  | { type: 'snippet_update'; id: string; content: string; updated_at: number }
  | { type: 'snippet_delete'; id: string }
  | { type: 'presence'; user_id: string; user_name: string; snippet_id: string | null };

function getStorageKey(roomId: string) {
  return `devcanvas-code-snippets-${roomId}`;
}

function loadSnippets(roomId: string): CodeSnippet[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(getStorageKey(roomId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSnippets(roomId: string, snippets: CodeSnippet[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(roomId), JSON.stringify(snippets));
  } catch {
    // Silently fail on storage errors
  }
}

export function useCodeEditor(roomId: string) {
  const { userId, userName } = useAppStore();
  const [snippets, setSnippets] = useState<CodeSnippet[]>(() => loadSnippets(roomId));
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [editingUsers, setEditingUsers] = useState<Map<string, { user_name: string; snippet_id: string | null }>>(
    new Map()
  );
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist snippets to localStorage whenever they change
  useEffect(() => {
    saveSnippets(roomId, snippets);
  }, [roomId, snippets]);

  // Set initial active snippet
  useEffect(() => {
    if (snippets.length > 0 && !activeSnippetId) {
      setActiveSnippetId(snippets[0].id);
    } else if (snippets.length === 0) {
      setActiveSnippetId(null);
    }
  }, [snippets, activeSnippetId]);

  // Setup Supabase realtime channel
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`room:${roomId}:code`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'code_sync' }, ({ payload }: { payload: BroadcastPayload }) => {
        if (payload.type === 'snippet_create') {
          setSnippets((prev) => {
            if (prev.find((s) => s.id === payload.snippet.id)) return prev;
            return [...prev, payload.snippet];
          });
        } else if (payload.type === 'snippet_update') {
          setSnippets((prev) =>
            prev.map((s) =>
              s.id === payload.id ? { ...s, content: payload.content, updated_at: payload.updated_at } : s
            )
          );
        } else if (payload.type === 'snippet_delete') {
          setSnippets((prev) => prev.filter((s) => s.id !== payload.id));
          setActiveSnippetId((prev) => (prev === payload.id ? null : prev));
        } else if (payload.type === 'presence') {
          setEditingUsers((prev) => {
            const next = new Map(prev);
            if (payload.snippet_id) {
              next.set(payload.user_id, {
                user_name: payload.user_name,
                snippet_id: payload.snippet_id,
              });
            } else {
              next.delete(payload.user_id);
            }
            return next;
          });
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId]);

  const broadcast = useCallback(
    (payload: BroadcastPayload) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'code_sync',
        payload,
      });
    },
    []
  );

  const createSnippet = useCallback(
    (title: string, language: SupportedLanguage) => {
      const snippet: CodeSnippet = {
        id: crypto.randomUUID(),
        title,
        language,
        content: '',
        author_id: userId || 'anonymous',
        updated_at: Date.now(),
      };
      setSnippets((prev) => [...prev, snippet]);
      setActiveSnippetId(snippet.id);
      broadcast({ type: 'snippet_create', snippet });
      return snippet;
    },
    [userId, broadcast]
  );

  const updateSnippet = useCallback(
    (id: string, content: string) => {
      const now = Date.now();
      setSnippets((prev) => prev.map((s) => (s.id === id ? { ...s, content, updated_at: now } : s)));

      // Broadcast presence immediately
      broadcast({
        type: 'presence',
        user_id: userId || 'anonymous',
        user_name: userName || 'Anonymous',
        snippet_id: id,
      });

      // Debounce the content broadcast
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        broadcast({ type: 'snippet_update', id, content, updated_at: now });
      }, CODE_EDITOR_SYNC_DEBOUNCE);
    },
    [userId, userName, broadcast]
  );

  const deleteSnippet = useCallback(
    (id: string) => {
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      setActiveSnippetId((prev) => (prev === id ? null : prev));
      broadcast({ type: 'snippet_delete', id });
    },
    [broadcast]
  );

  const broadcastPresence = useCallback(
    (snippetId: string | null) => {
      broadcast({
        type: 'presence',
        user_id: userId || 'anonymous',
        user_name: userName || 'Anonymous',
        snippet_id: snippetId,
      });
    },
    [userId, userName, broadcast]
  );

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const activeSnippet = snippets.find((s) => s.id === activeSnippetId) ?? null;

  return {
    snippets,
    activeSnippetId,
    activeSnippet,
    setActiveSnippetId,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    editingUsers,
    broadcastPresence,
  };
}
