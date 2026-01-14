# DevCanvas Setup Checklist

## ✅ Step 1: Sign in to Supabase
- [ ] Go to https://app.supabase.com
- [ ] Sign in with your account (or create one)
- [ ] You should see your dashboard/organization

## ✅ Step 2: Create or Select Project
- [ ] Click "New Project" (or select existing project)
- [ ] Fill in project details:
  - Project Name: `devcanvas` (or your choice)
  - Database Password: (save this securely!)
  - Region: Choose closest to you
- [ ] Click "Create new project"
- [ ] Wait for provisioning (2-3 minutes)

## ✅ Step 3: Get API Credentials
- [ ] In your project dashboard, click **Settings** (⚙️ icon) in left sidebar
- [ ] Click **API** in the settings menu
- [ ] Find these two values:
  - **Project URL**: `https://xxxxx.supabase.co`
  - **anon public** key: Long string starting with `eyJ...`

## ✅ Step 4: Create .env.local File
- [ ] In your DevCanvas project root, create `.env.local`
- [ ] Add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
- [ ] Save the file

## ✅ Step 5: Run Database Schema
- [ ] In Supabase dashboard, click **SQL Editor** in left sidebar
- [ ] Click **New Query**
- [ ] Open `supabase/schema.sql` from your project
- [ ] Copy ALL contents
- [ ] Paste into SQL Editor
- [ ] Click **Run** (or press Ctrl+Enter)
- [ ] Should see "Success. No rows returned"

## ✅ Step 6: Restart Dev Server
- [ ] Stop current dev server (Ctrl+C in terminal)
- [ ] Run: `npm run dev`
- [ ] Check that no errors appear
- [ ] Visit http://localhost:3000

## ✅ Step 7: Test the App
- [ ] You should see DevCanvas home page (not setup screen)
- [ ] Enter your name
- [ ] Click "Create New Room"
- [ ] Should navigate to room page successfully

## 🐛 Troubleshooting

### Still seeing "Setup Required" screen?
- Verify `.env.local` exists in project root
- Check variable names are exact: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after creating/editing `.env.local`
- Check for typos or extra spaces

### Database errors?
- Verify schema.sql ran successfully
- Check Supabase project is active (not paused)
- Ensure RLS policies were created (check in Table Editor)

### Connection errors?
- Verify Project URL format: `https://xxxxx.supabase.co`
- Check anon key is correct (not service_role key)
- Ensure Supabase project is not paused

## 📝 Quick Reference

**File locations:**
- `.env.local` → Project root (create this)
- `supabase/schema.sql` → Run in SQL Editor
- Settings → API → Get credentials

**Important URLs:**
- Dashboard: https://app.supabase.com
- SQL Editor: Dashboard → SQL Editor
- API Settings: Dashboard → Settings → API
