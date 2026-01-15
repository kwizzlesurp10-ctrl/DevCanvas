# DevCanvas Quick Start Guide

## ✅ Step 1: Dependencies Installed

Dependencies have been installed successfully. The project uses:
- **Node.js** v24.3.0 ✅
- **npm** v11.6.2 ✅
- All packages installed with `--legacy-peer-deps` (React 19 compatibility)

## 📋 Step 2: Set Up Supabase

1. **Create a Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in your project details
   - Wait for the project to be created

2. **Run the database schema:**
   - In your Supabase dashboard, go to **SQL Editor**
   - Click **New Query**
   - Copy and paste the entire contents of `supabase/schema.sql`
   - Click **Run** (or press Ctrl+Enter)
   - You should see "Success. No rows returned"

3. **Get your API credentials:**
   - Go to **Settings** → **API**
   - Copy your **Project URL**
   - Copy your **anon/public** key

## 🔐 Step 3: Configure Environment Variables

Create a file named `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Replace the values with your actual Supabase credentials!

## 🚀 Step 4: Run the Development Server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Step 5: Test the App

1. Enter your name on the home page
2. Click "Create New Room"
3. Share the room URL with a teammate
4. Start collaborating!

## 📝 Notes

- **No login required** - The app uses anonymous authentication
- **Room URLs** - Share the `/room/[roomId]` URL to invite others
- **Voice calls** - Click the microphone icon to connect
- **Screen sharing** - Click the monitor icon to share your screen

## 🐛 Troubleshooting

### Canvas not syncing?
- Check browser console for errors
- Verify Supabase Realtime is enabled in your project settings
- Ensure you're using the correct room ID

### WebRTC not connecting?
- Grant browser permissions for microphone/camera
- Check firewall settings
- Try a different browser (Chrome/Firefox recommended)

### Messages not appearing?
- Verify RLS policies were created correctly
- Check Supabase Realtime subscriptions in the dashboard
- Ensure channel_id matches

## 📚 Next Steps

- Read `README.md` for full documentation
- Check `SETUP.md` for detailed setup instructions
- Customize the UI in `app/` directory
- Modify database schema in `supabase/schema.sql`
