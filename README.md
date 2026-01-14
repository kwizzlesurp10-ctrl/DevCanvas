# DevCanvas

A lightweight, canvas-first real-time collaboration tool for two-person dev teams. Combines infinite collaborative whiteboard (tldraw), Discord-style text channels, voice calls, and screen sharing.

## Features

- 🎨 **Infinite Collaborative Canvas** - Real-time whiteboard powered by tldraw
- 💬 **Discord-style Channels** - Persistent, threaded chat with markdown support
- 🎤 **Voice & Screen Sharing** - Native WebRTC peer-to-peer communication
- 📎 **File Sharing** - Upload and share files via Supabase storage
- 🌙 **Dark Mode** - Beautiful dark theme by default
- ⚡ **Low Latency** - Optimized for real-time collaboration

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** (strict mode)
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (PostgreSQL, Realtime, Storage, Auth)
- **tldraw** - Collaborative canvas
- **WebRTC** - Peer-to-peer voice/video
- **Zustand** - State management

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Get your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Usage

1. **Create or Join Room** - Enter your name and create a new room or join an existing one via room ID
2. **Collaborate on Canvas** - Draw, write, and plan together in real-time
3. **Chat in Channels** - Create channels and have threaded conversations
4. **Voice & Screen Share** - Click the voice controls to connect and share your screen

## Project Structure

```
/app
  /room/[roomId]
    Canvas.tsx      # tldraw canvas with realtime sync
    Sidebar.tsx     # Channel list
    Chat.tsx        # Message thread
    VoiceDock.tsx   # WebRTC controls
    webrtc.ts       # Peer connection logic
/lib
  supabaseClient.ts # Supabase client
  store.ts          # Zustand state
/types
  database.ts       # DB types
  app.ts            # App state types
/supabase
  schema.sql        # Database schema
```

## Database Schema

- **rooms** - Collaboration spaces
- **channels** - Chat channels within rooms
- **messages** - Chat messages with threading
- **reactions** - Emoji reactions
- **canvas_snapshots** - Optional canvas state backups

## Realtime Architecture

- **Canvas Sync**: Broadcasts store snapshots via Supabase Realtime (throttled to 30fps)
- **Chat**: Postgres change subscriptions for instant message updates
- **WebRTC**: Signaling via Supabase Realtime, peer-to-peer media streaming

## License

MIT
