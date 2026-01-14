# Fix: "Failed to create room" Error

## Most Likely Cause: Database Schema Not Run

The `rooms` table doesn't exist yet in your Supabase database. Here's how to fix it:

## Step-by-Step Fix

### 1. Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. In the **left sidebar**, click **SQL Editor**
3. Click **New Query** button

### 2. Run the Database Schema

1. Open `supabase/schema.sql` file from your DevCanvas project
2. **Copy ALL** the contents (Ctrl+A, Ctrl+C)
3. **Paste** into the SQL Editor
4. Click **Run** button (or press Ctrl+Enter)
5. You should see: **"Success. No rows returned"**

### 3. Verify Tables Were Created

1. In Supabase dashboard, click **Table Editor** in left sidebar
2. You should see these tables:
   - ✅ `rooms`
   - ✅ `channels`
   - ✅ `messages`
   - ✅ `reactions`
   - ✅ `canvas_snapshots`

### 4. Test Again

1. Go back to http://localhost:3000
2. Enter your name
3. Click "Create New Room"
4. It should work now! 🎉

## Alternative: Quick Test Script

Run this to test your connection:

```bash
node test-connection.js
```

This will tell you exactly what's wrong.

## Still Not Working?

### Check Browser Console

1. Open DevTools (F12)
2. Go to **Console** tab
3. Try creating a room
4. Look for error messages

Common errors:
- `relation "rooms" does not exist` → Schema not run
- `permission denied` → RLS policy issue
- `invalid api key` → Wrong key

### Verify Environment Variables

Make sure `.env.local` exists and has your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
```

Get these from: Supabase Dashboard → Settings → API

Then **restart your dev server**:
```bash
# Stop server (Ctrl+C)
npm run dev
```

## Need Help?

Check `TROUBLESHOOTING.md` for more detailed solutions.
