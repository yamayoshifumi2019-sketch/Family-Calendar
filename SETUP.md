# Family Calendar - Supabase Setup

## Quick Start

The calendar works immediately! Without Supabase, you can:
- View the calendar
- Add/edit/delete events (but they won't persist after refresh)

To enable cloud sync (events shared across devices), follow the steps below.

---

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up (free) and click "New Project"
3. Set project name: `family-calendar`
4. Choose a region close to you
5. Wait ~2 minutes for setup

---

## Step 2: Create Events Table

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Paste this SQL and click "Run":

```sql
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events (date);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read" ON events FOR SELECT USING (true);
CREATE POLICY "Anyone can insert" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update" ON events FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete" ON events FOR DELETE USING (true);
```

---

## Step 3: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: The long string under "Project API keys"

---

## Step 4: Add Credentials to Code

Open `index.html` and find these lines near the top of the `<script>`:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with your actual values:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6...';
```

---

## Step 5: Deploy

Push to GitHub, Vercel will auto-deploy.

---

## Verify It Works

1. Open browser console (F12)
2. You should see:
   ```
   [Init] Starting...
   [Supabase] Client created, testing connection...
   [Supabase] Connected successfully!
   [Supabase] Loaded 0 events
   [Init] Using Supabase for storage
   [Init] Complete! Calendar is ready.
   ```

If you see `[Supabase] Credentials not configured`, check your URL and key.

---

## Family Members

To customize names/colors, edit this in `index.html`:

```javascript
const FAMILY_MEMBERS = [
    { id: 1, name: 'King', color: '#4A90D9' },
    { id: 2, name: 'ブー太郎', color: '#D94A4A' },
    { id: 3, name: 'Hidetoshi', color: '#4AD97B' },
    { id: 4, name: 'Yoshi', color: '#D9A84A' },
];
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Calendar shows but events don't save | Check console for Supabase errors |
| "relation events does not exist" | Run the SQL in Step 2 |
| Events don't sync across devices | Verify both devices use same Supabase project |
