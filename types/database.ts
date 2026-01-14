// Database types matching Supabase schema

export interface Room {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  room_id: string;
  name: string;
  order: number;
  created_by: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  content: string;
  author_id: string;
  author_name: string | null;
  parent_id: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reaction {
  id: string;
  message_id: string;
  emoji: string;
  author_id: string;
  created_at: string;
}

export interface CanvasSnapshot {
  id: string;
  room_id: string;
  snapshot: Record<string, unknown>;
  created_at: string;
}
