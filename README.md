# Allex Furniture

A catalog-only furniture website built with Next.js App Router, TypeScript, and Supabase. The site has a public furniture showcase, product detail pages, a contact form, and an administrator workspace. There is no customer checkout or customer signup.

## Stack
- Next.js App Router and React
- Supabase Postgres, Auth, and Storage
- `@supabase/ssr` for cookie-based server-side auth

## Local setup
1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. In Supabase Dashboard → Project Settings → API, copy the project URL and publishable key into `.env.local`.
4. Run `npm run dev`.

After applying database migrations, regenerate the typed schema with `npm run db:types` while linked to the intended Supabase project.

## Administrator access
1. Create an administrator account in Supabase Authentication.
2. Set trusted `app_metadata.is_admin = true` for that user through a trusted server/Admin API workflow. Never set this flag in user-editable metadata or expose the service-role key to the browser.
3. Sign in at `/admin/login`. The dashboard verifies the authenticated user's trusted app metadata and the database RLS policies enforce admin access.

## Features
- Responsive catalog landing page, searchable and paginated furniture listing, and product details by category slug and model number.
- Public project listing and detail pages backed by active Supabase project records.
- Category, product, project and enquiry overview in `/admin/dashboard`.
- Admin forms to create categories, products and projects, and update catalog/enquiry statuses.
- Public contact form with server-side validation; submissions are stored in the `contacts` table.
- Supabase SSR client uses HttpOnly session cookies managed by `@supabase/ssr`.

## Storage
The database stores object paths, not public URLs. Create a public Storage bucket named `furniture-images` before uploading product images; the application and admin dashboard support product image upload, primary-image selection, and deletion. The Storage migration restricts authenticated Storage API operations to admins. Category and project image upload controls are not implemented.

The contact form includes a honeypot and the database limits each email address to three submissions per ten minutes. Apply new database migrations with `npx supabase db push` after reviewing them.

## Checks
Run `npm run lint` and `npm run build` before deployment. Configure the same Supabase public environment variables in your hosting provider. Do not commit `.env.local` or any service-role/secret key.
