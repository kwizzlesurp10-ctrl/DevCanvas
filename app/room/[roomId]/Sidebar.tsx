'use client';

import { useState } from 'react';
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
import { useAppStore } from '@/lib/store';
import { useChannelManagement } from './hooks/useChannelManagement';

interface SidebarProps {
  roomId: string;
}

export default function Sidebar({ roomId }: SidebarProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const { userId } = useAppStore();

  // Use custom hook for channel management
  const { channels, currentChannelId, setCurrentChannelId, createChannel } = useChannelManagement(roomId);

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error('Please enter a channel name');
      return;
    }

    try {
      const channel = await createChannel(newChannelName, userId || 'anonymous');
      if (channel) {
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
