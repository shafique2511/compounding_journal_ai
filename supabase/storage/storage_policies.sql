insert into storage.buckets (id, name, public)
values
  ('trade-screenshots', 'trade-screenshots', false),
  ('strategy-screenshots', 'strategy-screenshots', false),
  ('backups', 'backups', false)
on conflict (id) do update set public = false;

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
