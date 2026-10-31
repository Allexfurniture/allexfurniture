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

## Administrator access
1. Create an administrator account in Supabase Authentication.
2. Set trusted `app_metadata.is_admin = true` for that user through a trusted server/Admin API workflow. Never set this flag in user-editable metadata or expose the service-role key to the browser.
3. Sign in at `/admin/login`. The dashboard verifies the authenticated user's trusted app metadata and the database RLS policies enforce admin access.

## Features
- Responsive catalog landing page and product details by category slug and model number.
- Category, product, project and enquiry overview in `/admin/dashboard`.
- Admin forms to create categories, products and projects, and update catalog/enquiry statuses.
- Public contact form with server-side validation; submissions are stored in the `contacts` table.
- Supabase SSR client uses HttpOnly session cookies managed by `@supabase/ssr`.

## Storage
The database stores object paths, not public URLs. Before adding image uploads, create a Storage bucket named `furniture-images` and define policies for public reads of published catalog images and admin-only uploads/changes. The current application displays product images from that bucket when image metadata is present. Category and project image upload controls are not yet implemented.

## Checks
Run `npm run lint` and `npm run build` before deployment. Configure the same Supabase public environment variables in your hosting provider. Do not commit `.env.local` or any service-role/secret key.
