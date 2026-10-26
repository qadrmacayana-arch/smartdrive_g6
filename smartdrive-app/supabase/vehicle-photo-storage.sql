-- Run after admin-authorization.sql to allow admins to manage fleet photos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-photos',
  'vehicle-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Vehicle photos are publicly readable" on storage.objects;
create policy "Vehicle photos are publicly readable"
on storage.objects for select
using (bucket_id = 'vehicle-photos');

drop policy if exists "Admins can upload vehicle photos" on storage.objects;
create policy "Admins can upload vehicle photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'vehicle-photos'
  and public.has_admin_access()
);

drop policy if exists "Admins can update vehicle photos" on storage.objects;
create policy "Admins can update vehicle photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'vehicle-photos'
  and public.has_admin_access()
)
with check (
  bucket_id = 'vehicle-photos'
  and public.has_admin_access()
);

drop policy if exists "Admins can delete vehicle photos" on storage.objects;
create policy "Admins can delete vehicle photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'vehicle-photos'
  and public.has_admin_access()
);
