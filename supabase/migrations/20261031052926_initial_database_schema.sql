-- Allex Furniture: initial production schema
-- Target: Supabase PostgreSQL 17+
-- Admin authorization is controlled only by trusted Supabase Auth app_metadata:
-- {"is_admin": true}. Never use user_metadata for authorization.
-- This migration creates application tables and RLS; it does not create Auth users
-- or configure Storage buckets.

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Categories: maximum depth of three levels, slug unique within each parent
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  parent_id uuid references public.categories(id) on delete restrict,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint categories_name_length check (length(btrim(name)) between 1 and 150 and name = btrim(name)),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint categories_status_check check (status in ('active', 'inactive')),
  constraint categories_description_length check (description is null or length(description) <= 10000),
  constraint categories_not_own_parent check (parent_id is null or parent_id <> id)
);

create unique index categories_top_level_slug_uidx
  on public.categories (slug)
  where parent_id is null;

create unique index categories_parent_slug_uidx
  on public.categories (parent_id, slug)
  where parent_id is not null;


-- Enforces no cycles and no more than three levels, including when moving
-- an existing category that already has descendants.
create or replace function public.validate_category_hierarchy()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  ancestor_depth integer := 0;
  creates_cycle boolean := false;
  subtree_depth integer := 0;
begin
  -- Serialize hierarchy mutations to prevent concurrent cycle/depth races.
  perform pg_catalog.pg_advisory_xact_lock(721045, 1);

  if new.parent_id is not null then
    with recursive ancestors(id, parent_id, depth, path) as (
      select c.id, c.parent_id, 1, array[c.id]
      from public.categories as c
      where c.id = new.parent_id

      union all

      select parent.id, parent.parent_id, a.depth + 1, a.path || parent.id
      from public.categories as parent
      join ancestors as a on parent.id = a.parent_id
      where not parent.id = any(a.path)
    )
    select coalesce(max(a.depth), 0), coalesce(bool_or(a.id = new.id), false)
      into ancestor_depth, creates_cycle
    from ancestors;

    if creates_cycle then
      raise exception 'Category hierarchy cannot contain a cycle'
        using errcode = '23514';
    end if;

    if ancestor_depth >= 3 then
      raise exception 'Category hierarchy cannot exceed three levels'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    with recursive descendants(id, depth, path) as (
      select c.id, 0, array[c.id]
      from public.categories as c
      where c.id = new.id

      union all

      select child.id, d.depth + 1, d.path || child.id
      from public.categories as child
      join descendants as d on child.parent_id = d.id
      where not child.id = any(d.path)
    )
    select coalesce(max(depth), 0)
      into subtree_depth
    from descendants;

    if ancestor_depth + 1 + subtree_depth > 3 then
      raise exception 'Moving this category would exceed the three-level hierarchy limit'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_category_hierarchy() from public, anon, authenticated;

create trigger categories_validate_hierarchy
before insert or update of parent_id
on public.categories
for each row execute function public.validate_category_hierarchy();

-- ---------------------------------------------------------------------------
-- Category images: optional one-to-one image record per category
-- No row means the category has no image; storage_path is never nullable.
-- ---------------------------------------------------------------------------

create table public.category_images (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null unique references public.categories(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint category_images_storage_path_length check (length(btrim(storage_path)) between 1 and 1024),
  constraint category_images_alt_text_length check (alt_text is null or length(alt_text) <= 1000)
);

-- ---------------------------------------------------------------------------
-- Products: one category per product; model is globally unique, case-insensitive
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  model text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint products_name_length check (length(btrim(name)) between 1 and 300 and name = btrim(name)),
  constraint products_model_length check (length(btrim(model)) between 1 and 100 and model = btrim(model)),
  constraint products_status_check check (status in ('active', 'inactive')),
  constraint products_description_length check (description is null or length(description) <= 50000)
);

create unique index products_model_ci_uidx on public.products (lower(model));
create index products_category_id_idx on public.products (category_id);
create index products_status_category_idx on public.products (status, category_id);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint projects_name_length check (length(btrim(name)) between 1 and 200 and name = btrim(name)),
  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint projects_status_check check (status in ('active', 'inactive')),
  constraint projects_description_length check (description is null or length(description) <= 50000)
);


-- ---------------------------------------------------------------------------
-- Product images and project images
-- Storage files live in Supabase Storage; these columns store object paths,
-- not public URLs. A product/project may have no primary image, but at most one.
-- ---------------------------------------------------------------------------

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint product_images_storage_path_length check (length(btrim(storage_path)) between 1 and 1024),
  constraint product_images_alt_text_length check (alt_text is null or length(alt_text) <= 1000)
);

create index product_images_product_id_idx on public.product_images (product_id);
create unique index product_images_storage_path_uidx on public.product_images (storage_path);
create unique index product_images_one_primary_uidx
  on public.product_images (product_id)
  where is_primary;

create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint project_images_storage_path_length check (length(btrim(storage_path)) between 1 and 1024),
  constraint project_images_alt_text_length check (alt_text is null or length(alt_text) <= 1000)
);

create index project_images_project_id_idx on public.project_images (project_id);
create unique index project_images_storage_path_uidx on public.project_images (storage_path);
create unique index project_images_one_primary_uidx
  on public.project_images (project_id)
  where is_primary;

-- ---------------------------------------------------------------------------
-- Contact inquiries: public visitors may submit, but never read submissions
-- ---------------------------------------------------------------------------

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint contacts_name_length check (length(btrim(name)) between 1 and 200 and name = btrim(name)),
  constraint contacts_email_format check (
    length(btrim(email)) between 3 and 320
    and btrim(email) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint contacts_phone_length check (phone is null or length(phone) <= 50),
  constraint contacts_subject_length check (length(btrim(subject)) between 1 and 300 and subject = btrim(subject)),
  constraint contacts_message_not_blank check (length(btrim(message)) > 0),
  constraint contacts_message_length check (length(message) <= 20000),
  constraint contacts_status_check check (status in ('new', 'in_progress', 'resolved', 'spam'))
);

create index contacts_status_created_at_idx on public.contacts (status, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();

create trigger category_images_set_updated_at before update on public.category_images
for each row execute function public.set_updated_at();

create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

create trigger product_images_set_updated_at before update on public.product_images
for each row execute function public.set_updated_at();

create trigger project_images_set_updated_at before update on public.project_images
for each row execute function public.set_updated_at();

create trigger contacts_set_updated_at before update on public.contacts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Admin flag must be set by a trusted server/Admin API in app_metadata.
-- JWT claims can be stale until the administrator refreshes their session.
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.category_images enable row level security;
alter table public.products enable row level security;
alter table public.projects enable row level security;
alter table public.product_images enable row level security;
alter table public.project_images enable row level security;
alter table public.contacts enable row level security;

-- Public catalog reads. Inactive products and projects are never public.
create policy "Public can read active categories"
on public.categories for select
to anon, authenticated
using (status = 'active');

create policy "Public can read images of active categories"
on public.category_images for select
to anon, authenticated
using (
  exists (
    select 1
    from public.categories as c
    where c.id = category_images.category_id
      and c.status = 'active'
  )
);

create policy "Public can read active products in active categories"
on public.products for select
to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1
    from public.categories as c
    where c.id = products.category_id
      and c.status = 'active'
  )
);

create policy "Public can read active projects"
on public.projects for select
to anon, authenticated
using (status = 'active');

create policy "Public can read images of active products"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products as p
    join public.categories as c on c.id = p.category_id
    where p.id = product_images.product_id
      and p.status = 'active'
      and c.status = 'active'
  )
);

create policy "Public can read images of active projects"
on public.project_images for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects as p
    where p.id = project_images.project_id
      and p.status = 'active'
  )
);

-- Admins can manage all catalog entities. Each write policy checks both
-- the existing row (USING) and the resulting row (WITH CHECK) where applicable.
create policy "Admins manage categories"
on public.categories for all
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true');

create policy "Admins manage category images"
on public.category_images for all
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true');

create policy "Admins manage products"
on public.products for all
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true');

create policy "Admins manage projects"
on public.projects for all
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true');

create policy "Admins manage product images"
on public.product_images for all
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true');

create policy "Admins manage project images"
on public.project_images for all
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true');

-- Public form submission only. The column-level INSERT grant below prevents
-- clients from choosing id, status, or timestamps.
create policy "Visitors can submit contact inquiries"
on public.contacts for insert
to anon, authenticated
with check (status = 'new');

create policy "Admins can read contact inquiries"
on public.contacts for select
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true');

create policy "Admins can update contact inquiries"
on public.contacts for update
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true');

create policy "Admins can delete contact inquiries"
on public.contacts for delete
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true');

-- ---------------------------------------------------------------------------
-- Explicit table privileges. RLS remains the row-level authorization boundary.
-- ---------------------------------------------------------------------------

-- Remove role-specific and inherited table privileges before granting the
-- minimum required permissions. RLS then governs which rows are accessible.
revoke all on public.categories, public.category_images, public.products, public.projects,
  public.product_images, public.project_images, public.contacts
  from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.categories, public.category_images, public.products, public.projects,
  public.product_images, public.project_images to anon, authenticated;

grant insert, update, delete on public.categories, public.category_images, public.products, public.projects,
  public.product_images, public.project_images to authenticated;

-- Visitors can submit only the user-supplied fields. Identity, status, and
-- timestamps are database-controlled defaults and cannot be forged by clients.
grant insert (name, email, phone, subject, message)
  on public.contacts to anon, authenticated;

grant select, update, delete on public.contacts to authenticated;

comment on table public.categories is 'Public catalog categories; hierarchy limited to three levels.';
comment on table public.category_images is 'Optional one-to-one category image metadata; no row means the category has no image. Files are managed separately in Supabase Storage.';
comment on table public.products is 'Catalog products; no pricing, inventory, cart, or order data.';
comment on table public.product_images is 'Unique Supabase Storage object paths for product images; files are managed separately in Storage.';
comment on table public.projects is 'Showcase projects displayed on the public website.';
comment on table public.project_images is 'Unique Supabase Storage object paths for project images; files are managed separately in Storage.';
comment on table public.contacts is 'Public contact-form submissions; readable only by administrators.';
