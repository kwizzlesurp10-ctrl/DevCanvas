'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Hash } from 'lucide-react';
import type { Channel } from '@/types/database';

interface SidebarProps {
  roomId: string;
}

export default function Sidebar({ roomId }: SidebarProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const { currentChannelId, setCurrentChannelId } = useAppStore();

  useEffect(() => {
    if (!roomId) return;

    // Load initial channels
    const loadChannels = async () => {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('room_id', roomId)
        .order('order', { ascending: true });

      if (error) {
        console.error('Error loading channels:', error);
        return;
      }

      if (data && data.length > 0) {
        setChannels(data);
        // Set first channel as active if none selected
        if (!currentChannelId) {
          setCurrentChannelId(data[0].id);
        }
      }
    };

    loadChannels();

    // Subscribe to channel changes
    const channel = supabase
      .channel(`room:${roomId}:channels`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadChannels();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, currentChannelId, setCurrentChannelId]);

  const handleCreateChannel = async () => {
    const name = prompt('Enter channel name:');
    if (!name || !name.trim()) return;

    const { data, error } = await supabase
      .from('channels')
      .insert({
        room_id: roomId,
        name: name.trim().toLowerCase(),
        order: channels.length,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating channel:', error);
      alert('Failed to create channel');
    } else if (data) {
      setCurrentChannelId(data.id);
    }
  };

  return (
    <div className="flex w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-semibold">Channels</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCreateChannel}
          title="Create channel"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setCurrentChannelId(channel.id)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                currentChannelId === channel.id
                  ? 'bg-accent font-medium'
                  : ''
              }`}
            >
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span>{channel.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
