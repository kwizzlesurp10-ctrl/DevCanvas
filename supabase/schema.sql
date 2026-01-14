-- DevCanvas Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table: Each room is a collaboration space
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Channels table: Discord-style channels within rooms
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, name)
);

-- Messages table: Chat messages with threading support
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL, -- Can be anonymous ID or user ID
  author_name TEXT, -- Optional display name
  parent_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- For threaded replies
  file_url TEXT, -- Supabase storage URL for file attachments
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reactions table: Emoji reactions on messages
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  author_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, emoji, author_id)
);

-- Canvas snapshots table: Optional periodic saves of canvas state
CREATE TABLE canvas_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL, -- tldraw store snapshot
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_channels_room_id ON channels(room_id);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_parent_id ON messages(parent_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_reactions_message_id ON reactions(message_id);
CREATE INDEX idx_canvas_snapshots_room_id ON canvas_snapshots(room_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_snapshots ENABLE ROW LEVEL SECURITY;

-- Rooms: Anyone can read/write (public rooms by URL)
CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create rooms" ON rooms
  FOR INSERT WITH CHECK (true);

-- Channels: Anyone can read/write channels in a room
CREATE POLICY "Anyone can read channels" ON channels
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create channels" ON channels
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update channels" ON channels
  FOR UPDATE USING (true);

-- Messages: Anyone can read/write messages
CREATE POLICY "Anyone can read messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update own messages" ON messages
  FOR UPDATE USING (author_id = current_setting('app.author_id', true));

CREATE POLICY "Anyone can delete own messages" ON messages
  FOR DELETE USING (author_id = current_setting('app.author_id', true));

-- Reactions: Anyone can read/write reactions
CREATE POLICY "Anyone can read reactions" ON reactions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create reactions" ON reactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete own reactions" ON reactions
  FOR DELETE USING (author_id = current_setting('app.author_id', true));

-- Canvas snapshots: Anyone can read/write snapshots
CREATE POLICY "Anyone can read canvas snapshots" ON canvas_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create canvas snapshots" ON canvas_snapshots
  FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
