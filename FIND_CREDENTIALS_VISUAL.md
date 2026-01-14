# Visual Guide: Finding Supabase Credentials

## Step 1: Access Your Project

1. Go to **https://app.supabase.com**
2. Sign in if needed
3. You'll see your **Organization** page with a list of projects
4. **Click on an active project** (or create a new one if all are paused)

## Step 2: Navigate to Settings

Once inside your project dashboard:

1. Look at the **left sidebar** (vertical menu on the left)
2. Scroll down to find **Settings** (⚙️ gear icon)
3. Click on **Settings**

## Step 3: Go to API Section

In the Settings menu:

1. You'll see several options:
   - General
   - **API** ← Click this one!
   - Database
   - Auth
   - Storage
   - etc.
2. Click on **API**

## Step 4: Find Your Credentials

On the API page, you'll see two sections:

### 📍 Project URL

Look for a section labeled **"Project URL"** or **"Configuration"**

You'll see something like:
```
Project URL
https://abcdefghijklmnop.supabase.co
```

**Copy this entire URL** - this is your `NEXT_PUBLIC_SUPABASE_URL`

### 🔑 API Keys

Scroll down to find **"Project API keys"** section

You'll see a table with different keys:
- **anon public** ← This is what you need!
- service_role (DO NOT use this one)

The anon public key will look like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example_signature_here
```

**Click "Reveal"** if the key is hidden, then **copy it** - this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 5: Create .env.local File

In your DevCanvas project root directory (`C:\Users\Keith\DevCanvas`), create a file named `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace the placeholder values with your actual credentials!**

## Quick URL Shortcut

If you know your project reference ID, you can go directly to:
```
https://app.supabase.com/dashboard/project/[your-project-ref]/settings/api
```

Replace `[your-project-ref]` with your actual project reference ID.

## Troubleshooting

**Can't find Settings?**
- Make sure you're INSIDE a project (not on the organization page)
- Look for the ⚙️ icon in the left sidebar
- It's usually near the bottom of the sidebar

**Key is hidden?**
- Click the "Reveal" or "Show" button next to the anon public key
- Some browsers may require you to click twice

**Wrong key?**
- Make sure you're copying the **anon public** key
- NOT the service_role key (that one is secret and should never be exposed)
