# Environment Variables Setup

## Quick Setup

1. **Create `.env.local` file** in the project root directory

2. **Add your Supabase credentials:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. **Get your credentials from Supabase:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project (or select existing)
   - Navigate to **Settings** → **API**
   - Copy **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon/public key** → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Run the database schema:**
   - In Supabase dashboard, go to **SQL Editor**
   - Click **New Query**
   - Copy contents of `supabase/schema.sql`
   - Paste and click **Run**

5. **Restart your dev server:**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

## File Location

Create `.env.local` in the root directory:
```
DevCanvas/
├── .env.local          ← Create this file here
├── app/
├── lib/
└── ...
```

## Example `.env.local`

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example_key_here
```

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure `.env.local` exists in the project root
- Check that variable names are exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart the dev server after creating/editing `.env.local`
- Check for typos or extra spaces in the values

### Error persists after setup
- Verify your Supabase project is active
- Check that the URL format is correct (should end with `.supabase.co`)
- Ensure the anon key is the correct one (not the service_role key)

### Variables not loading
- Next.js only loads `.env.local` on server start
- Always restart: `npm run dev` after changing env vars
- Don't use quotes around values in `.env.local`

## Security Notes

- ✅ `.env.local` is gitignored (won't be committed)
- ✅ Never commit your actual keys to git
- ✅ Use `NEXT_PUBLIC_` prefix for client-side variables
- ⚠️ The anon key is safe to expose in the browser (it's public by design)
- ⚠️ Never expose service_role key in client-side code

## Next Steps

After setting up environment variables:
1. Restart the dev server
2. Visit http://localhost:3000
3. You should see the DevCanvas home page (not the setup message)
4. Create a room to test the connection
