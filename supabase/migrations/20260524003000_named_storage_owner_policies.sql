insert into storage.buckets (id, name, public)
values
  ('trade-screenshots', 'trade-screenshots', false),
  ('strategy-screenshots', 'strategy-screenshots', false)
on conflict (id) do update set public = false;

drop policy if exists "trade screenshots select own" on storage.objects;
drop policy if exists "trade screenshots insert own" on storage.objects;
drop policy if exists "trade screenshots update own" on storage.objects;
drop policy if exists "trade screenshots delete own" on storage.objects;
drop policy if exists "Users can view own trade screenshots" on storage.objects;
create policy "Users can view own trade screenshots"
on storage.objects for select
to authenticated
using (
  bucket_id = 'trade-screenshots'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
drop policy if exists "Users can upload own trade screenshots" on storage.objects;
create policy "Users can upload own trade screenshots"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'trade-screenshots'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
drop policy if exists "Users can update own trade screenshots" on storage.objects;
create policy "Users can update own trade screenshots"
on storage.objects for update
to authenticated
using (
  bucket_id = 'trade-screenshots'
  and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'trade-screenshots'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
drop policy if exists "Users can delete own trade screenshots" on storage.objects;
create policy "Users can delete own trade screenshots"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'trade-screenshots'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "strategy screenshots select own" on storage.objects;
drop policy if exists "strategy screenshots insert own" on storage.objects;
drop policy if exists "strategy screenshots update own" on storage.objects;
drop policy if exists "strategy screenshots delete own" on storage.objects;
drop policy if exists "Users can view own strategy screenshots" on storage.objects;
create policy "Users can view own strategy screenshots"
on storage.objects for select
to authenticated
using (
  bucket_id = 'strategy-screenshots'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
drop policy if exists "Users can upload own strategy screenshots" on storage.objects;
create policy "Users can upload own strategy screenshots"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'strategy-screenshots'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
drop policy if exists "Users can update own strategy screenshots" on storage.objects;
create policy "Users can update own strategy screenshots"
on storage.objects for update
to authenticated
using (
  bucket_id = 'strategy-screenshots'
  and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'strategy-screenshots'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
drop policy if exists "Users can delete own strategy screenshots" on storage.objects;
create policy "Users can delete own strategy screenshots"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'strategy-screenshots'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
