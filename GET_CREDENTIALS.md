# How to Get Your Supabase Credentials

## Step 1: Access Your Project

1. Go to https://app.supabase.com
2. Sign in if needed
3. Select your organization
4. Click on your **devcanvas** project (or the project you just created)

## Step 2: Navigate to API Settings

Once in your project dashboard:

1. Look at the **left sidebar**
2. Click on **Settings** (⚙️ icon) at the bottom
3. Click on **API** in the settings menu

## Step 3: Copy Your Credentials

You'll see two important values:

### Project URL
- Located under **"Project URL"** section
- Format: `https://xxxxxxxxxxxxx.supabase.co`
- **Copy this entire URL**

### API Keys
- Scroll down to **"Project API keys"** section
- Find the **"anon public"** key (NOT the service_role key)
- It's a long string starting with `eyJ...`
- Click the **copy icon** or **"Reveal"** button to see it
- **Copy this key**

## Step 4: Create .env.local File

In your DevCanvas project root directory, create a file named `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace the values with your actual credentials!**

## Step 5: Run Database Schema

1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open `supabase/schema.sql` from your DevCanvas project
4. Copy ALL the contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see: "Success. No rows returned"

## Step 6: Restart Dev Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

## Step 7: Verify Setup

1. Visit http://localhost:3000
2. You should see the DevCanvas home page (NOT the setup screen)
3. Try creating a room to test the connection

## Troubleshooting

### Can't find API settings?
- Make sure you're IN a project (not just the organization page)
- Look for the ⚙️ Settings icon in the left sidebar
- It's usually at the bottom of the sidebar

### Project still provisioning?
- Wait 2-3 minutes after creating
- Refresh the page
- Look for a "Project is ready" message

### Wrong key?
- Use the **anon public** key, NOT service_role
- The anon key is safe to use in client-side code
- Service role key should NEVER be exposed
