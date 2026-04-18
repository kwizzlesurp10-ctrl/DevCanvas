import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SEARCH_DEBOUNCE_MS, SEARCH_PAGE_SIZE } from '@/lib/constants';
import type { Message } from '@/types/database';

export interface SearchResult extends Message {
  channel_name: string;
}

interface UseSearchResult {
  results: SearchResult[];
  isSearching: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  clearSearch: () => void;
}

export function useSearch(roomId: string): UseSearchResult {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQueryState] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQueryRef = useRef('');

  const searchMessages = useCallback(
    async (query: string, startOffset: number): Promise<{ data: SearchResult[]; hasMore: boolean }> => {
      if (!query.trim()) {
        return { data: [], hasMore: false };
      }

      // First, get all channel IDs in this room
      const { data: channels, error: channelsError } = await supabase
        .from('channels')
        .select('id, name')
        .eq('room_id', roomId);

      if (channelsError || !channels || channels.length === 0) {
        return { data: [], hasMore: false };
      }

      const channelIds = channels.map((c) => c.id);
      const channelNameMap = new Map(channels.map((c) => [c.id, c.name]));

      const pattern = `%${query}%`;

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .in('channel_id', channelIds)
        .or(`content.ilike.${pattern},author_name.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .range(startOffset, startOffset + SEARCH_PAGE_SIZE - 1);

      if (error) {
        console.error('Search error:', error);
        return { data: [], hasMore: false };
      }

      const searchResults: SearchResult[] = (messages || []).map((msg) => ({
        ...msg,
        channel_name: channelNameMap.get(msg.channel_id) || 'unknown',
      }));

      return {
        data: searchResults,
        hasMore: (messages || []).length === SEARCH_PAGE_SIZE,
      };
    },
    [roomId]
  );

  const executeSearch = useCallback(
    async (query: string) => {
      currentQueryRef.current = query;

      if (!query.trim()) {
        setResults([]);
        setHasMore(false);
        setOffset(0);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setOffset(0);

      const { data, hasMore: more } = await searchMessages(query, 0);

      // Only update if this is still the current query
      if (currentQueryRef.current === query) {
        setResults(data);
        setHasMore(more);
        setOffset(data.length);
        setIsSearching(false);
      }
    },
    [searchMessages]
  );

  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (!query.trim()) {
        setResults([]);
        setHasMore(false);
        setOffset(0);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      debounceTimerRef.current = setTimeout(() => {
        executeSearch(query);
      }, SEARCH_DEBOUNCE_MS);
    },
    [executeSearch]
  );

  const loadMore = useCallback(async () => {
    if (!searchQuery.trim() || isSearching || !hasMore) return;

    setIsSearching(true);
    const { data, hasMore: more } = await searchMessages(searchQuery, offset);

    if (currentQueryRef.current === searchQuery) {
      setResults((prev) => [...prev, ...data]);
      setHasMore(more);
      setOffset((prev) => prev + data.length);
      setIsSearching(false);
    }
  }, [searchQuery, isSearching, hasMore, offset, searchMessages]);

  const clearSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    currentQueryRef.current = '';
    setSearchQueryState('');
    setResults([]);
    setHasMore(false);
    setOffset(0);
    setIsSearching(false);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    results,
    isSearching,
    searchQuery,
    setSearchQuery,
    loadMore,
    hasMore,
    clearSearch,
  };
}
