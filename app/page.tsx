'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, getAnonymousUserId, getUserDisplayName, setUserDisplayName, isSupabaseConfigured, requireSupabaseConfig } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function Home() {
  // Show setup message if Supabase is not configured
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Setup Required</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Supabase environment variables are not configured
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h3 className="mb-2 font-semibold">Quick Setup:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Create a <code className="rounded bg-background px-1 py-0.5 text-xs">.env.local</code> file in the project root</li>
                <li>Add your Supabase credentials:
                  <pre className="mt-2 rounded bg-background p-2 text-xs">
{`NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key`}
                  </pre>
                </li>
                <li>Get your credentials from <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">supabase.com</a></li>
                <li>Run the SQL schema from <code className="rounded bg-background px-1 py-0.5 text-xs">supabase/schema.sql</code></li>
                <li>Restart the dev server</li>
              </ol>
            </div>
            <div className="text-xs text-muted-foreground">
              See <code className="rounded bg-background px-1 py-0.5">SETUP.md</code> or <code className="rounded bg-background px-1 py-0.5">QUICKSTART.md</code> for detailed instructions.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState(getUserDisplayName());
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { setUserId, setUserName: setStoreUserName } = useAppStore();

  const handleCreateRoom = async () => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    requireSupabaseConfig();
    setIsCreating(true);
    try {
      // Create room in database FIRST, before setting user info
      const { data: room, error } = await supabase
        .from('rooms')
        .insert({})
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}. Make sure you've run the database schema from supabase/schema.sql`);
      }

      if (!room) {
        throw new Error('Room was created but no data returned');
      }

      // Only set user info AFTER room creation succeeds
      const userId = getAnonymousUserId();
      setUserId(userId);
      setUserDisplayName(userName);
      setStoreUserName(userName);

      // Create default "general" channel with creator tracking
      const { error: channelError } = await supabase
        .from('channels')
        .insert({
          room_id: room.id,
          name: 'general',
          order: 0,
          created_by: userId,
        });

      if (channelError) {
        console.error('Error creating default channel:', channelError);
        // Continue anyway - room was created successfully
      }

      // Reset loading state before navigation
      setIsCreating(false);
      router.push(`/room/${room.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to create room. Please try again.';
      alert(errorMessage);
      setIsCreating(false);
      // User info is NOT set if room creation fails
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }

    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    requireSupabaseConfig();
    setIsJoining(true);
    try {
      // Validate room exists FIRST, before setting user info
      const { data: room, error } = await supabase
        .from('rooms')
        .select('id')
        .eq('id', roomId.trim())
        .single();

      if (error || !room) {
        throw new Error('Room not found');
      }

      // Only set user info AFTER room validation succeeds
      const userId = getAnonymousUserId();
      setUserId(userId);
      setUserDisplayName(userName);
      setStoreUserName(userName);

      // Reset loading state before navigation
      setIsJoining(false);
      router.push(`/room/${room.id}`);
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Room not found. Please check the room ID.');
      setIsJoining(false);
      // User info is NOT set if room join fails
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary animate-bounce-in">
            <Sparkles className="h-8 w-8 text-primary-foreground animate-spin-slow" />
          </div>
          <CardTitle className="text-2xl animate-fade-in">DevCanvas</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Collaborative communication tool for dev teams
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="userName" className="text-sm font-medium">
              Your Name
            </label>
            <Input
              id="userName"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating && !isJoining) {
                  handleCreateRoom();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handleCreateRoom}
              disabled={isCreating || isJoining}
            >
              {isCreating ? 'Creating...' : 'Create New Room'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="roomId" className="text-sm font-medium">
              Room ID
            </label>
            <Input
              id="roomId"
              placeholder="Paste room ID here"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating && !isJoining) {
                  handleJoinRoom();
                }
              }}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={handleJoinRoom}
              disabled={isCreating || isJoining}
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
