# ✅ Supabase Fixes - Execution Checklist

Use this checklist to ensure all fixes are applied correctly.

---

## 📋 Pre-Execution Checklist

- [ ] I have access to my Supabase Dashboard
- [ ] I know my project name/ID
- [ ] I have the SQL Editor open
- [ ] I have read `QUICK_FIX.md` or `SQL_EXECUTION_GUIDE.md`

---

## 🚀 Execution Steps

### Step 1: Access Supabase
- [ ] Opened https://supabase.com/dashboard
- [ ] Logged in successfully
- [ ] Selected my DevCanvas project
- [ ] Clicked "SQL Editor" in left sidebar

### Step 2: Prepare SQL
- [ ] Clicked "New Query" button
- [ ] Opened `supabase/migration-fix-rls.sql` in my code editor
- [ ] Copied the entire SQL script

### Step 3: Execute SQL
- [ ] Pasted SQL into Supabase SQL Editor
- [ ] Reviewed the SQL (optional but recommended)
- [ ] Clicked "Run" or pressed Ctrl+Enter
- [ ] Saw success message (no errors)

### Step 4: Verify Execution
- [ ] Ran verification query (see below)
- [ ] Confirmed new policies exist
- [ ] Confirmed new indexes exist
- [ ] Confirmed `created_by` column exists on channels

---

## 🔍 Verification Query

Run this in Supabase SQL Editor to verify:

```sql
-- Check policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('messages', 'reactions')
  AND policyname LIKE 'Anyone can%'
ORDER BY tablename, policyname;

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_messages_author_id',
    'idx_reactions_author_id',
    'idx_channels_created_by'
  )
ORDER BY tablename, indexname;

-- Check channel structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'channels'
  AND column_name = 'created_by';
```

**Expected Results:**

Policies:
- `messages` | `Anyone can delete messages` | `DELETE`
- `messages` | `Anyone can update messages` | `UPDATE`
- `reactions` | `Anyone can delete reactions` | `DELETE`

Indexes:
- `messages` | `idx_messages_author_id`
- `reactions` | `idx_reactions_author_id`
- `channels` | `idx_channels_created_by`

Columns:
- `created_by` | `text`

---

## 🧪 Testing Checklist

### Test 1: Message Editing
- [ ] Opened DevCanvas at http://localhost:3000
- [ ] Created or joined a room
- [ ] Sent a test message
- [ ] Hovered over my message
- [ ] Saw edit (pencil) and delete (trash) icons
- [ ] Clicked edit icon
- [ ] Modified the message text
- [ ] Pressed Enter to save
- [ ] Message updated successfully ✅

### Test 2: Message Deletion
- [ ] Hovered over my message
- [ ] Clicked delete (trash) icon
- [ ] Confirmed deletion in prompt
- [ ] Message disappeared ✅

### Test 3: Real-time Sync
- [ ] Opened room in two browser tabs
- [ ] Edited message in first tab
- [ ] Saw update appear in second tab ✅

### Test 4: Performance
- [ ] Sent 10+ messages
- [ ] Edited/deleted messages
- [ ] Operations felt instant (< 1 second) ✅

---

## 🐛 Troubleshooting Checklist

If something doesn't work, check:

### Frontend Issues
- [ ] Cleared browser cache (Ctrl+Shift+R)
- [ ] Checked browser console for errors (F12)
- [ ] Verified dev server is running (`npm run dev`)
- [ ] Confirmed I'm hovering over MY OWN messages (not others')

### Database Issues
- [ ] Verified SQL executed without errors
- [ ] Ran verification queries (see above)
- [ ] Checked Supabase Dashboard → Database → Tables
- [ ] Confirmed RLS is enabled on tables

### Connection Issues
- [ ] Verified `.env.local` exists with correct values
- [ ] Checked `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] Checked `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] Restarted dev server after env changes

---

## 📊 Success Criteria

All of these should be true:

- ✅ SQL executed without errors
- ✅ Verification queries return expected results
- ✅ Edit icons appear when hovering over my messages
- ✅ Delete icons appear when hovering over my messages
- ✅ Clicking edit allows me to modify message text
- ✅ Clicking delete removes the message
- ✅ Changes sync in real-time across tabs
- ✅ No errors in browser console
- ✅ No errors in terminal/dev server logs

---

## 📝 Notes

**Date Executed:** _______________

**Supabase Project ID:** _______________

**Issues Encountered:** 

_______________________________________________________

_______________________________________________________

**Resolution:** 

_______________________________________________________

_______________________________________________________

---

## 🎉 Completion

- [ ] All SQL fixes executed successfully
- [ ] All tests passed
- [ ] Message editing works
- [ ] Message deletion works
- [ ] Performance is good
- [ ] No errors in console
- [ ] Ready to use DevCanvas!

---

## 📚 Reference Documents

If you need more information:

- `QUICK_FIX.md` - Quick reference (1 page)
- `SQL_EXECUTION_GUIDE.md` - Detailed step-by-step guide
- `SUPABASE_FIXES.md` - Technical explanation of all fixes
- `supabase/migration-fix-rls.sql` - The actual SQL to run

---

**Status:** 

- [ ] Not Started
- [ ] In Progress
- [ ] Completed ✅
- [ ] Issues (see notes)

---

**Last Updated:** 2026-01-13
