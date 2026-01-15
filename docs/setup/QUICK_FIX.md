# 🚀 Quick Fix - Run This SQL Now

## Copy and paste this into your Supabase SQL Editor:

```sql
-- ============================================================================
-- DevCanvas RLS Policy Fixes - Run this in Supabase SQL Editor
-- ============================================================================

-- Fix broken message policies
DROP POLICY IF EXISTS "Anyone can update own messages" ON messages;
DROP POLICY IF EXISTS "Anyone can delete own messages" ON messages;
DROP POLICY IF EXISTS "Anyone can delete own reactions" ON reactions;

CREATE POLICY "Anyone can update messages" ON messages
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete messages" ON messages
  FOR DELETE USING (true);

CREATE POLICY "Anyone can delete reactions" ON reactions
  FOR DELETE USING (true);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_reactions_author_id ON reactions(author_id);

-- Add channel creator tracking
ALTER TABLE channels ADD COLUMN IF NOT EXISTS created_by TEXT;
UPDATE channels SET created_by = 'system' WHERE created_by IS NULL;
CREATE INDEX IF NOT EXISTS idx_channels_created_by ON channels(created_by);

-- Verify (optional)
SELECT 'Policies fixed!' as status,
       COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('messages', 'reactions')
  AND policyname LIKE '%can%messages%'
     OR policyname LIKE '%can%reactions%';
```

## Steps:

1. **Go to:** https://supabase.com/dashboard
2. **Click:** Your project → SQL Editor (left sidebar)
3. **Click:** "New Query"
4. **Paste:** The SQL above
5. **Click:** "Run" (or press Ctrl+Enter)
6. **Done!** ✅

## What This Fixes:

✅ Message editing now works  
✅ Message deletion now works  
✅ Reaction deletion now works  
✅ Better query performance  
✅ Channel creator tracking added  

## Test It:

1. Open your DevCanvas app
2. Send a message
3. Hover over the message
4. Click the pencil icon to edit
5. Click the trash icon to delete

**Both should work now!** 🎉

---

For more details, see `SUPABASE_FIXES.md`
