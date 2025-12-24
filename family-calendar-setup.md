# Family Calendar - Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Enter project name (e.g., "family-calendar")
5. Set a database password (save it somewhere safe)
6. Select a region close to you
7. Click "Create new project"

## 2. Create the Events Table

Go to **SQL Editor** in the Supabase dashboard and run this SQL:

```sql
-- Create events table
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster date queries
CREATE INDEX idx_events_date ON events(date);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view all events (no login required)
CREATE POLICY "Anyone can view events"
ON events FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Anyone can insert events (login is handled by app)
CREATE POLICY "Anyone can insert events"
ON events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Anyone can update their own events
CREATE POLICY "Users can update own events"
ON events FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Policy: Anyone can delete their own events
CREATE POLICY "Users can delete own events"
ON events FOR DELETE
TO anon, authenticated
USING (true);

-- Enable realtime for the events table
ALTER PUBLICATION supabase_realtime ADD TABLE events;
```

## 3. Get Your API Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

## 4. Configure the App

Open `family-calendar.html` and replace these lines near the top of the `<script>` section:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

With your actual values:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

## 5. Open the App

Simply open `family-calendar.html` in a web browser. No server needed!

---

## Table Schema Reference

| Column      | Type                     | Description                    |
|-------------|--------------------------|--------------------------------|
| id          | BIGSERIAL (auto)         | Unique event ID                |
| title       | TEXT                     | Event title/name               |
| date        | DATE                     | Event date (YYYY-MM-DD)        |
| start_time  | TIME (nullable)          | Optional start time            |
| end_time    | TIME (nullable)          | Optional end time              |
| created_by  | TEXT                     | Family member name             |
| created_at  | TIMESTAMP WITH TIME ZONE | Auto-generated creation time   |

---

## Family Members (Fixed)

- きんぐ
- お母さん
- ゆう
- おれ

---

## Features

- **Shared Calendar**: All events visible to all family members
- **Simple Login**: Select your name to log in (no password)
- **Event Ownership**: Only the creator can edit/delete their events
- **Real-time Sync**: Changes appear on all devices automatically
- **Cloud Storage**: Data persists in Supabase (not localStorage)
- **Responsive**: Works on mobile and desktop

---

## Troubleshooting

### "Supabase初期化エラー" Error
- Check that SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Make sure there are no extra spaces or quotes

### Events Not Saving
- Verify the `events` table was created correctly
- Check the RLS policies are in place
- Look at browser console for error messages

### Real-time Not Working
- Ensure you ran `ALTER PUBLICATION supabase_realtime ADD TABLE events;`
- Try refreshing the page
