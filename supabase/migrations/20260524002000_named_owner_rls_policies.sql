alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.trades enable row level security;
alter table public.strategies enable row level security;
alter table public.filter_presets enable row level security;
alter table public.ai_analyses enable row level security;

drop policy if exists "profiles select own" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "user settings select own" on public.user_settings;
drop policy if exists "user settings insert own" on public.user_settings;
drop policy if exists "user settings update own" on public.user_settings;
drop policy if exists "user settings delete own" on public.user_settings;
drop policy if exists "Users can view own settings" on public.user_settings;
create policy "Users can view own settings"
on public.user_settings for select
to authenticated
using (user_id = (select auth.uid()));
drop policy if exists "Users can insert own settings" on public.user_settings;
create policy "Users can insert own settings"
on public.user_settings for insert
to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings"
on public.user_settings for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete own settings" on public.user_settings;
create policy "Users can delete own settings"
on public.user_settings for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "trades select own" on public.trades;
drop policy if exists "trades insert own" on public.trades;
drop policy if exists "trades update own" on public.trades;
drop policy if exists "trades delete own" on public.trades;
drop policy if exists "Users can view own trades" on public.trades;
create policy "Users can view own trades"
on public.trades for select
to authenticated
using (user_id = (select auth.uid()));
drop policy if exists "Users can insert own trades" on public.trades;
create policy "Users can insert own trades"
on public.trades for insert
to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists "Users can update own trades" on public.trades;
create policy "Users can update own trades"
on public.trades for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete own trades" on public.trades;
create policy "Users can delete own trades"
on public.trades for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "strategies select own" on public.strategies;
drop policy if exists "strategies insert own" on public.strategies;
drop policy if exists "strategies update own" on public.strategies;
drop policy if exists "strategies delete own" on public.strategies;
drop policy if exists "Users can view own strategies" on public.strategies;
create policy "Users can view own strategies"
on public.strategies for select
to authenticated
using (user_id = (select auth.uid()));
drop policy if exists "Users can insert own strategies" on public.strategies;
create policy "Users can insert own strategies"
on public.strategies for insert
to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists "Users can update own strategies" on public.strategies;
create policy "Users can update own strategies"
on public.strategies for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete own strategies" on public.strategies;
create policy "Users can delete own strategies"
on public.strategies for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "filter presets select own" on public.filter_presets;
drop policy if exists "filter presets insert own" on public.filter_presets;
drop policy if exists "filter presets update own" on public.filter_presets;
drop policy if exists "filter presets delete own" on public.filter_presets;
drop policy if exists "Users can view own filter presets" on public.filter_presets;
create policy "Users can view own filter presets"
on public.filter_presets for select
to authenticated
using (user_id = (select auth.uid()));
drop policy if exists "Users can insert own filter presets" on public.filter_presets;
create policy "Users can insert own filter presets"
on public.filter_presets for insert
to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists "Users can update own filter presets" on public.filter_presets;
create policy "Users can update own filter presets"
on public.filter_presets for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete own filter presets" on public.filter_presets;
create policy "Users can delete own filter presets"
on public.filter_presets for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "ai analyses select own" on public.ai_analyses;
drop policy if exists "ai analyses insert own" on public.ai_analyses;
drop policy if exists "ai analyses update own" on public.ai_analyses;
drop policy if exists "ai analyses delete own" on public.ai_analyses;
drop policy if exists "Users can view own ai analyses" on public.ai_analyses;
create policy "Users can view own ai analyses"
on public.ai_analyses for select
to authenticated
using (user_id = (select auth.uid()));
drop policy if exists "Users can insert own ai analyses" on public.ai_analyses;
create policy "Users can insert own ai analyses"
on public.ai_analyses for insert
to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists "Users can update own ai analyses" on public.ai_analyses;
create policy "Users can update own ai analyses"
on public.ai_analyses for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete own ai analyses" on public.ai_analyses;
create policy "Users can delete own ai analyses"
on public.ai_analyses for delete
to authenticated
using (user_id = (select auth.uid()));
