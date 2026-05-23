-- Trade Compounding Journal AI - Supabase schema
-- Run this in Supabase SQL Editor. The script is safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.filter_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_user_id_idx on public.profiles (user_id);
create index if not exists user_settings_user_id_idx on public.user_settings (user_id);
create index if not exists trades_user_updated_idx on public.trades (user_id, updated_at desc);
create index if not exists ai_analyses_user_updated_idx on public.ai_analyses (user_id, updated_at desc);
create index if not exists strategies_user_updated_idx on public.strategies (user_id, updated_at desc);
create index if not exists filter_presets_user_updated_idx on public.filter_presets (user_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.trades enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.strategies enable row level security;
alter table public.filter_presets enable row level security;

drop policy if exists "profiles owner read write" on public.profiles;
create policy "profiles owner read write"
on public.profiles
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "user settings owner read write" on public.user_settings;
create policy "user settings owner read write"
on public.user_settings
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "trades owner read write" on public.trades;
create policy "trades owner read write"
on public.trades
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "ai analyses owner read write" on public.ai_analyses;
create policy "ai analyses owner read write"
on public.ai_analyses
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "strategies owner read write" on public.strategies;
create policy "strategies owner read write"
on public.strategies
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "filter presets owner read write" on public.filter_presets;
create policy "filter presets owner read write"
on public.filter_presets
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('trade-journal', 'trade-journal', false)
on conflict (id) do update set public = false;

drop policy if exists "trade screenshots owner read" on storage.objects;
create policy "trade screenshots owner read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'trade-journal'
  and (storage.foldername(name))[1] = 'screenshots'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and storage.filename(name) in ('before.jpg', 'after.jpg')
);

drop policy if exists "trade screenshots owner write" on storage.objects;
create policy "trade screenshots owner write"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'trade-journal'
  and (storage.foldername(name))[1] = 'screenshots'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and storage.filename(name) in ('before.jpg', 'after.jpg')
)
with check (
  bucket_id = 'trade-journal'
  and (storage.foldername(name))[1] = 'screenshots'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and storage.filename(name) in ('before.jpg', 'after.jpg')
);

drop policy if exists "strategy screenshots owner read" on storage.objects;
create policy "strategy screenshots owner read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'trade-journal'
  and (storage.foldername(name))[1] = 'strategyScreenshots'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and storage.filename(name) = 'example.jpg'
);

drop policy if exists "strategy screenshots owner write" on storage.objects;
create policy "strategy screenshots owner write"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'trade-journal'
  and (storage.foldername(name))[1] = 'strategyScreenshots'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and storage.filename(name) = 'example.jpg'
)
with check (
  bucket_id = 'trade-journal'
  and (storage.foldername(name))[1] = 'strategyScreenshots'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and storage.filename(name) = 'example.jpg'
);
