create extension if not exists pgcrypto;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;
grant select, insert, update, delete on public.trades to authenticated;
grant select, insert, update, delete on public.strategies to authenticated;
grant select, insert, update, delete on public.filter_presets to authenticated;
grant select, insert, update, delete on public.ai_analyses to authenticated;

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.trades enable row level security;
alter table public.strategies enable row level security;
alter table public.filter_presets enable row level security;
alter table public.ai_analyses enable row level security;

create index if not exists user_settings_user_id_idx on public.user_settings (user_id);
create index if not exists trades_user_id_idx on public.trades (user_id);
create index if not exists trades_user_timestamp_idx on public.trades (user_id, timestamp desc);
create index if not exists strategies_user_id_idx on public.strategies (user_id);
create index if not exists filter_presets_user_id_idx on public.filter_presets (user_id);
create index if not exists ai_analyses_user_id_idx on public.ai_analyses (user_id);

drop policy if exists "profiles select own" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles select own" on public.profiles
for select to authenticated
using (id = (select auth.uid()));
create policy "profiles insert own" on public.profiles
for insert to authenticated
with check (id = (select auth.uid()));
create policy "profiles update own" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "user settings select own" on public.user_settings;
drop policy if exists "user settings insert own" on public.user_settings;
drop policy if exists "user settings update own" on public.user_settings;
drop policy if exists "user settings delete own" on public.user_settings;
create policy "user settings select own" on public.user_settings
for select to authenticated
using (user_id = (select auth.uid()));
create policy "user settings insert own" on public.user_settings
for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "user settings update own" on public.user_settings
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy "user settings delete own" on public.user_settings
for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "trades select own" on public.trades;
drop policy if exists "trades insert own" on public.trades;
drop policy if exists "trades update own" on public.trades;
drop policy if exists "trades delete own" on public.trades;
create policy "trades select own" on public.trades
for select to authenticated
using (user_id = (select auth.uid()));
create policy "trades insert own" on public.trades
for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "trades update own" on public.trades
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy "trades delete own" on public.trades
for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "strategies select own" on public.strategies;
drop policy if exists "strategies insert own" on public.strategies;
drop policy if exists "strategies update own" on public.strategies;
drop policy if exists "strategies delete own" on public.strategies;
create policy "strategies select own" on public.strategies
for select to authenticated
using (user_id = (select auth.uid()));
create policy "strategies insert own" on public.strategies
for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "strategies update own" on public.strategies
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy "strategies delete own" on public.strategies
for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "filter presets select own" on public.filter_presets;
drop policy if exists "filter presets insert own" on public.filter_presets;
drop policy if exists "filter presets update own" on public.filter_presets;
drop policy if exists "filter presets delete own" on public.filter_presets;
create policy "filter presets select own" on public.filter_presets
for select to authenticated
using (user_id = (select auth.uid()));
create policy "filter presets insert own" on public.filter_presets
for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "filter presets update own" on public.filter_presets
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy "filter presets delete own" on public.filter_presets
for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "ai analyses select own" on public.ai_analyses;
drop policy if exists "ai analyses insert own" on public.ai_analyses;
drop policy if exists "ai analyses update own" on public.ai_analyses;
drop policy if exists "ai analyses delete own" on public.ai_analyses;
create policy "ai analyses select own" on public.ai_analyses
for select to authenticated
using (user_id = (select auth.uid()));
create policy "ai analyses insert own" on public.ai_analyses
for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "ai analyses update own" on public.ai_analyses
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy "ai analyses delete own" on public.ai_analyses
for delete to authenticated
using (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public)
values
  ('trade-screenshots', 'trade-screenshots', false),
  ('strategy-screenshots', 'strategy-screenshots', false),
  ('backups', 'backups', false)
on conflict (id) do update set public = false;

grant usage on schema storage to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;

drop policy if exists "trade screenshots select own" on storage.objects;
drop policy if exists "trade screenshots insert own" on storage.objects;
drop policy if exists "trade screenshots update own" on storage.objects;
drop policy if exists "trade screenshots delete own" on storage.objects;
create policy "trade screenshots select own" on storage.objects
for select to authenticated
using (
  bucket_id = 'trade-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.filename(name) in ('before.jpg', 'after.jpg')
);
create policy "trade screenshots insert own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'trade-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.filename(name) in ('before.jpg', 'after.jpg')
);
create policy "trade screenshots update own" on storage.objects
for update to authenticated
using (
  bucket_id = 'trade-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.filename(name) in ('before.jpg', 'after.jpg')
)
with check (
  bucket_id = 'trade-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.filename(name) in ('before.jpg', 'after.jpg')
);
create policy "trade screenshots delete own" on storage.objects
for delete to authenticated
using (
  bucket_id = 'trade-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.filename(name) in ('before.jpg', 'after.jpg')
);

drop policy if exists "strategy screenshots select own" on storage.objects;
drop policy if exists "strategy screenshots insert own" on storage.objects;
drop policy if exists "strategy screenshots update own" on storage.objects;
drop policy if exists "strategy screenshots delete own" on storage.objects;
create policy "strategy screenshots select own" on storage.objects
for select to authenticated
using (
  bucket_id = 'strategy-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.filename(name) = 'example.jpg'
);
create policy "strategy screenshots insert own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'strategy-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.filename(name) = 'example.jpg'
);
create policy "strategy screenshots update own" on storage.objects
for update to authenticated
using (
  bucket_id = 'strategy-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.filename(name) = 'example.jpg'
)
with check (
  bucket_id = 'strategy-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.filename(name) = 'example.jpg'
);
create policy "strategy screenshots delete own" on storage.objects
for delete to authenticated
using (
  bucket_id = 'strategy-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.filename(name) = 'example.jpg'
);

drop policy if exists "backups select own" on storage.objects;
drop policy if exists "backups insert own" on storage.objects;
drop policy if exists "backups update own" on storage.objects;
drop policy if exists "backups delete own" on storage.objects;
create policy "backups select own" on storage.objects
for select to authenticated
using (
  bucket_id = 'backups'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "backups insert own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'backups'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.filename(name) like 'backup-%.json'
);
create policy "backups update own" on storage.objects
for update to authenticated
using (
  bucket_id = 'backups'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'backups'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.filename(name) like 'backup-%.json'
);
create policy "backups delete own" on storage.objects
for delete to authenticated
using (
  bucket_id = 'backups'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
