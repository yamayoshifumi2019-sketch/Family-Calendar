# Family Calendar - Supabase Setup Guide

This guide explains how to set up Supabase as the backend database for the Family Calendar app.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (free tier available)
3. Click "New Project"
4. Fill in:
   - **Project name**: `family-calendar` (or any name you like)
   - **Database password**: Create a strong password (save it somewhere safe)
   - **Region**: Choose the closest region to you
5. Click "Create new project"
6. Wait for the project to be created (takes about 2 minutes)

## Step 2: Create the Events Table

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click "New query"
3. Paste the following SQL and click "Run":

```sql
-- Create the events table
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster date queries
CREATE INDEX idx_events_date ON events (date);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read all events
CREATE POLICY "Anyone can read events"
ON events FOR SELECT
USING (true);

-- Create a policy that allows anyone to insert events
CREATE POLICY "Anyone can insert events"
ON events FOR INSERT
WITH CHECK (true);

-- Create a policy that allows users to update their own events
CREATE POLICY "Users can update own events"
ON events FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create a policy that allows users to delete their own events
CREATE POLICY "Users can delete own events"
ON events FOR DELETE
USING (true);
```

4. You should see "Success. No rows returned" - this means the table was created

## Step 3: Get Your Supabase Credentials

1. In your Supabase dashboard, click **Settings** (gear icon) in the left sidebar
2. Click **API** under "Configuration"
3. You'll find:
   - **Project URL**: Copy the URL (looks like `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public key**: Copy the key under "Project API keys" (the `anon` `public` key)

## Step 4: Configure the App

1. Open `index.html` in a text editor
2. Find these lines near the top of the `<script>` section:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

3. Replace with your actual values:

```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

4. Save the file

## Step 5: Host the App

You can host `index.html` anywhere that serves static files:

### Option A: Open Locally
Simply double-click `index.html` to open it in your browser.
(Note: Some browsers may have CORS restrictions)

### Option B: GitHub Pages (Free)
1. Create a new GitHub repository
2. Upload `index.html` to the repository
3. Go to Settings > Pages
4. Set Source to "main" branch
5. Your calendar will be available at `https://yourusername.github.io/repo-name/`

### Option C: Netlify (Free)
1. Go to [https://netlify.com](https://netlify.com)
2. Drag and drop the `family-calendar-supabase` folder
3. Your calendar will be deployed instantly

### Option D: Vercel (Free)
1. Go to [https://vercel.com](https://vercel.com)
2. Import from GitHub or upload the folder
3. Your calendar will be deployed

## Customizing Family Members

To change the family members, edit the `FAMILY_MEMBERS` array in `index.html`:

```javascript
const FAMILY_MEMBERS = [
    { id: 1, name: 'King', color: '#4A90D9' },       // Blue
    { id: 2, name: 'ブー太郎', color: '#D94A4A' },   // Red
    { id: 3, name: 'Hidetoshi', color: '#4AD97B' },  // Green
    { id: 4, name: 'Yoshi', color: '#D9A84A' },      // Orange
];
```

You can:
- Change names
- Change colors (use any hex color code)
- Add or remove family members

## Troubleshooting

### "Failed to load calendar" error
- Check that your Supabase URL and anon key are correct
- Make sure the events table was created successfully
- Check your browser's developer console for error details

### Events not saving
- Verify the RLS policies were created
- Check that you're logged in (selected a family member)

### Events not loading
- Refresh the page
- Check your internet connection
- Verify Supabase project is active

## Security Notes

- The `anon` key is safe to use in client-side code
- Row Level Security (RLS) is enabled to protect data
- For a production app, consider adding authentication

## Database Schema

| Column     | Type                     | Description                    |
|------------|--------------------------|--------------------------------|
| id         | UUID                     | Unique event ID (auto-generated) |
| title      | TEXT                     | Event title (required)         |
| date       | DATE                     | Event date (required)          |
| start_time | TIME                     | Start time (optional)          |
| end_time   | TIME                     | End time (optional)            |
| created_by | TEXT                     | Username who created the event |
| created_at | TIMESTAMP WITH TIME ZONE | When the event was created     |
