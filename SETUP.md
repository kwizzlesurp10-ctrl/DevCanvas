# DevCanvas Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - In the SQL Editor, run the contents of `supabase/schema.sql`
   - Go to Settings > API and copy your project URL and anon key

3. **Create `.env.local` file:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file in the root directory with:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

Optional (for admin operations):
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

## Database Setup

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Run the query

This will create:
- `rooms` table
- `channels` table
- `messages` table
- `reactions` table
- `canvas_snapshots` table
- All necessary indexes and RLS policies

## Features

### Canvas
- Real-time collaborative whiteboard using tldraw
- Changes sync automatically via Supabase Realtime
- Throttled to 30fps for performance

### Channels & Chat
- Create multiple channels per room
- Markdown support with code syntax highlighting
- Threaded replies (parent_id support)
- Real-time message updates

### Voice & Screen Sharing
- WebRTC peer-to-peer connection
- Auto-connects when joining a room
- Mute/unmute controls
- Screen sharing with toggle

## Troubleshooting

### Canvas not syncing
- Check browser console for WebSocket errors
- Verify Supabase Realtime is enabled in your project
- Ensure you're subscribed to the correct channel

### WebRTC not connecting
- Check browser permissions for microphone/camera
- Verify STUN servers are accessible
- Check browser console for WebRTC errors

### Messages not appearing
- Verify RLS policies are set correctly
- Check Supabase Realtime subscriptions
- Ensure channel_id matches between sidebar and chat

## Production Deployment

1. Set environment variables in your hosting platform
2. Build the project: `npm run build`
3. Deploy to Vercel, Netlify, or your preferred platform

## Notes

- The app uses anonymous authentication by default (no login required)
- User IDs are stored in localStorage
- Canvas state can be optionally persisted to database (see `canvas_snapshots` table)
- Designed for exactly 2 users per room (can be extended)
