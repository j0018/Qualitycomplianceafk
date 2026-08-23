-- ============================================================
-- AFK Tracker — Supabase Schema
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- Users table (custom auth, not Supabase Auth)
create table if not exists public.users (
  id           text primary key default gen_random_uuid()::text,
  name         text not null,
  username     text not null unique,
  password     text not null,
  role         text not null check (role in ('user', 'admin')) default 'user',
  invite_code  text unique,
  avatar_color text not null default '#5bba47',
  created_at   timestamptz not null default now()
);

-- Sessions table
create table if not exists public.sessions (
  id          text primary key default gen_random_uuid()::text,
  user_id     text not null references public.users(id) on delete cascade,
  afk_at      timestamptz not null,
  back_at     timestamptz,
  duration_ms bigint,
  created_at  timestamptz not null default now()
);

-- Indexes
create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists sessions_afk_at_idx on public.sessions(afk_at desc);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.users enable row level security;
alter table public.sessions enable row level security;

-- Allow full public access (app uses its own username/password auth)
-- The anon key can read/write — tighten this later if needed
create policy "public read users"   on public.users   for select using (true);
create policy "public insert users" on public.users   for insert with check (true);
create policy "public update users" on public.users   for update using (true);
create policy "public delete users" on public.users   for delete using (true);

create policy "public read sessions"   on public.sessions   for select using (true);
create policy "public insert sessions" on public.sessions   for insert with check (true);
create policy "public update sessions" on public.sessions   for update using (true);
create policy "public delete sessions" on public.sessions   for delete using (true);
