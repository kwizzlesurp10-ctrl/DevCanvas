'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Hash } from 'lucide-react';
import type { Channel } from '@/types/database';

interface SidebarProps {
  roomId: string;
}

export default function Sidebar({ roomId }: SidebarProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const { currentChannelId, setCurrentChannelId } = useAppStore();
  const currentRoomIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // Track the current roomId for this effect
    currentRoomIdRef.current = roomId;

    // Load initial channels
    const loadChannels = async () => {
      // Capture the roomId at the time this async function is called
      const loadRoomId = currentRoomIdRef.current;
      
      if (!loadRoomId) return;

      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('room_id', loadRoomId)
        .order('order', { ascending: true });

      if (error) {
        console.error('Error loading channels:', error);
        return;
      }

      // Only update channels if this effect is still for the current room
      // This prevents race conditions when rapidly switching rooms
      if (currentRoomIdRef.current !== loadRoomId) {
        return; // Stale response, ignore it
      }

      if (data && data.length > 0) {
        setChannels(data);
        // Get current channel ID from store
        const currentId = useAppStore.getState().currentChannelId;
        
        // Check if current channel exists in this room's channels
        const channelExists = currentId && data.some((ch) => ch.id === currentId);
        
        // Set first channel as active if none selected OR if current channel doesn't exist in this room
        // The room check above ensures we're still viewing the same room
        if (!currentId || !channelExists) {
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
      // Clear the ref when component unmounts or room changes
      currentRoomIdRef.current = null;
    };
  }, [roomId]); // Only depend on roomId to prevent infinite re-subscriptions

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error('Please enter a channel name');
      return;
    }

    const { userId } = useAppStore.getState();

    try {
      const { data, error } = await supabase
        .from('channels')
        .insert({
          room_id: roomId,
          name: newChannelName.trim().toLowerCase(),
          order: channels.length,
          created_by: userId || 'anonymous',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCurrentChannelId(data.id);
        toast.success('Channel created');
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('Failed to create channel');
    } finally {
      // Always close dialog and clear state, regardless of success or failure
      setCreateDialogOpen(false);
      setNewChannelName('');
    }
  };

  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-semibold">Channels</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCreateDialogOpen(true)}
          title="Create channel"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {channels.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              <p>No channels yet.</p>
              <p className="mt-1 text-xs">Click the + button to create one.</p>
            </div>
          ) : (
            <>
              {!currentChannelId && channels.length > 0 && (
                <div className="mb-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                  <p className="font-medium">Select a channel to start chatting</p>
                </div>
              )}
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
                  <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      <Dialog 
        open={createDialogOpen} 
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            // Clear state when dialog closes (e.g., clicking outside or pressing Escape)
            setNewChannelName('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Channel</DialogTitle>
            <DialogDescription>
              Enter a name for the new channel. Channel names will be converted to lowercase.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                placeholder="general"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateChannel();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateDialogOpen(false);
              setNewChannelName('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateChannel}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
