# 🍄 AFK Tracker

A retro-styled AFK/time-tracking app. Users log AFK sessions; admins see live status, logs, reports, and manage accounts.

## Stack
- **React + Vite** (TypeScript)
- **Supabase** — database + real-time data
- **Vercel** — hosting

---

## Deploy in 5 steps

### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Open **SQL Editor** and paste the contents of `supabase-schema.sql`, then click **Run**
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/YOUR_USER/afk-tracker.git
git push -u origin main
```

### 3. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
2. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
3. Click **Deploy** — done!

### 4. Log in
- **Admin:** username `admin` / password `admin123`
- **Users:** username `luigi` / password `luigi123` (or use invite code `INV-LUIGI`)

> ⚠️ Change the default passwords in Supabase after your first login (or re-run the seed with new values).

---

## Local development

```bash
cp .env.example .env.local
# Fill in your Supabase URL and anon key in .env.local

npm install
npm run dev
```

---

## Changing passwords

Update directly in Supabase's Table Editor, or run:
```sql
update public.users set password = 'newpassword' where username = 'admin';
```
