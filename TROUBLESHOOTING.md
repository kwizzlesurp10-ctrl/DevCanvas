# Troubleshooting Guide

## "Failed to create room" Error

If you're getting this error, check the following:

### 1. Database Schema Not Run

**Most Common Issue:** The database tables don't exist yet.

**Solution:**
1. Go to https://supabase.com/dashboard/project/ylccqmleggazinzsbzgb
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `supabase/schema.sql` from your project
5. Copy **ALL** contents
6. Paste into SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. You should see: "Success. No rows returned"

### 2. API Key Format Issue

If you're using the newer `sb_publishable_` key format, make sure it's correct.

**Check:**
- Go to Settings → API → API Keys
- Verify you're using the **anon public** key (not service_role)
- The key should work with Supabase JS client

### 3. RLS Policies

The schema includes RLS policies that allow public access. If you modified them, ensure:
- `rooms` table has policies allowing INSERT
- Check in Supabase: Table Editor → rooms → Policies

### 4. Check Browser Console

Open browser DevTools (F12) and check the Console tab for detailed error messages.

Common errors:
- `relation "rooms" does not exist` → Schema not run
- `permission denied` → RLS policy issue
- `invalid api key` → Wrong key format

### 5. Verify Connection

Test your Supabase connection:

```javascript
// In browser console (F12)
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ylccqmleggazinzsbzgb.supabase.co',
  'sb_publishable_u9c5zQSSICdSyHHAkMaMUg_PmoBw3XO'
);
supabase.from('rooms').select('count').then(console.log);
```

### Quick Fix Checklist

- [ ] Database schema has been run in SQL Editor
- [ ] `.env.local` file exists with correct values
- [ ] Dev server has been restarted after creating `.env.local`
- [ ] Browser console shows no connection errors
- [ ] Supabase project is active (not paused)
