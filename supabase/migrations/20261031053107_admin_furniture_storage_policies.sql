-- Migration: Admin-only Storage policies for furniture image management.
-- Authorization uses the trusted, server-managed Supabase Auth app_metadata.is_admin claim.
-- The bucket remains public so public object URLs continue to render on the storefront.
-- Authenticated Storage API list/read/insert/update/delete operations are restricted to admins.

create policy "Admins can upload furniture images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'furniture-images'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true'
);

create policy "Admins can read furniture image objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'furniture-images'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true'
);

create policy "Admins can update furniture image objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'furniture-images'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true'
)
with check (
  bucket_id = 'furniture-images'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true'
);

create policy "Admins can delete furniture image objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'furniture-images'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true'
);
