create index contacts_email_created_at_idx
  on public.contacts (lower(email), created_at desc);

create or replace function public.limit_contact_submissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_submissions integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(pg_catalog.lower(pg_catalog.btrim(new.email)), 0)
  );

  select count(*)::integer
    into recent_submissions
  from public.contacts as c
  where pg_catalog.lower(pg_catalog.btrim(c.email)) = pg_catalog.lower(pg_catalog.btrim(new.email))
    and c.created_at > pg_catalog.now() - interval '10 minutes';

  if recent_submissions >= 3 then
    raise exception 'Contact submission limit reached'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.limit_contact_submissions() from public, anon, authenticated;

create trigger contacts_limit_submissions
before insert on public.contacts
for each row execute function public.limit_contact_submissions();

create or replace function public.set_primary_product_image(
  target_product_id uuid,
  target_image_id uuid
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.product_images as image
    where image.id = target_image_id
      and image.product_id = target_product_id
  ) then
    raise exception 'Image does not belong to product'
      using errcode = '23514';
  end if;

  update public.product_images
  set is_primary = false
  where product_id = target_product_id
    and is_primary;

  update public.product_images
  set is_primary = true
  where id = target_image_id;
end;
$$;

revoke all on function public.set_primary_product_image(uuid, uuid) from public, anon;
grant execute on function public.set_primary_product_image(uuid, uuid) to authenticated;