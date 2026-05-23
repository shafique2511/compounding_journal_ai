alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.trades enable row level security;
alter table public.strategies enable row level security;
alter table public.filter_presets enable row level security;
alter table public.ai_analyses enable row level security;

drop policy if exists "profiles select own" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles select own" on public.profiles
for select to authenticated
using ((select auth.uid()) = id);
create policy "profiles insert own" on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id);
create policy "profiles update own" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "user settings select own" on public.user_settings;
drop policy if exists "user settings insert own" on public.user_settings;
drop policy if exists "user settings update own" on public.user_settings;
drop policy if exists "user settings delete own" on public.user_settings;
create policy "user settings select own" on public.user_settings
for select to authenticated
using ((select auth.uid()) = user_id);
create policy "user settings insert own" on public.user_settings
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "user settings update own" on public.user_settings
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "user settings delete own" on public.user_settings
for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "trades select own" on public.trades;
drop policy if exists "trades insert own" on public.trades;
drop policy if exists "trades update own" on public.trades;
drop policy if exists "trades delete own" on public.trades;
create policy "trades select own" on public.trades
for select to authenticated
using ((select auth.uid()) = user_id);
create policy "trades insert own" on public.trades
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "trades update own" on public.trades
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "trades delete own" on public.trades
for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "strategies select own" on public.strategies;
drop policy if exists "strategies insert own" on public.strategies;
drop policy if exists "strategies update own" on public.strategies;
drop policy if exists "strategies delete own" on public.strategies;
create policy "strategies select own" on public.strategies
for select to authenticated
using ((select auth.uid()) = user_id);
create policy "strategies insert own" on public.strategies
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "strategies update own" on public.strategies
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "strategies delete own" on public.strategies
for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "filter presets select own" on public.filter_presets;
drop policy if exists "filter presets insert own" on public.filter_presets;
drop policy if exists "filter presets update own" on public.filter_presets;
drop policy if exists "filter presets delete own" on public.filter_presets;
create policy "filter presets select own" on public.filter_presets
for select to authenticated
using ((select auth.uid()) = user_id);
create policy "filter presets insert own" on public.filter_presets
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "filter presets update own" on public.filter_presets
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "filter presets delete own" on public.filter_presets
for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "ai analyses select own" on public.ai_analyses;
drop policy if exists "ai analyses insert own" on public.ai_analyses;
drop policy if exists "ai analyses update own" on public.ai_analyses;
drop policy if exists "ai analyses delete own" on public.ai_analyses;
create policy "ai analyses select own" on public.ai_analyses
for select to authenticated
using ((select auth.uid()) = user_id);
create policy "ai analyses insert own" on public.ai_analyses
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "ai analyses update own" on public.ai_analyses
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "ai analyses delete own" on public.ai_analyses
for delete to authenticated
using ((select auth.uid()) = user_id);
