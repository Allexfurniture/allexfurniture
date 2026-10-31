# ALLEX Furniture Public Website QA Checklist

This checklist applies only to the public website. It does not authorize admin workflow changes or database changes.

## Non-negotiable safeguards
- [ ] No database migrations were added or run.
- [ ] No tables, columns, constraints, indexes, policies, functions, triggers, or database data were changed.
- [ ] Public Supabase access continues to rely on existing RLS policies.
- [ ] No service-role secret is present in client code or repository files.
- [ ] No production deployment or merge to `main` occurred without approval.

## Public routes
- [ ] Home page renders with catalog data and with the database unavailable.
- [ ] About, group, contact, furniture, privacy, terms, and projects pages render.
- [ ] Unknown routes render the branded 404 page.
- [ ] Navigation works with keyboard, touch, and desktop pointer.
- [ ] Mobile navigation is visible and usable at narrow viewports.

## Catalog and category hierarchy
- [ ] Only active products and active categories are publicly displayed.
- [ ] Category routes match the full active ancestor path.
- [ ] Parent category pages show active child categories and descendant products.
- [ ] Category hierarchy traversal handles missing parents and cycles safely.
- [ ] Product routes match both the model and the full category path.
- [ ] Ambiguous duplicate model/path combinations are not indexed.
- [ ] Product cards use the same canonical route builder.
- [ ] Missing images have accessible fallbacks.
- [ ] No prices, stock counts, ratings, warranties, or specifications are invented.

## Search and pagination
- [ ] Search matches product name, model, description, and category name.
- [ ] Category filtering includes descendant categories.
- [ ] Search and category filters combine correctly.
- [ ] Pagination retains active filters.
- [ ] Invalid page numbers are clamped safely.
- [ ] Empty results and query failures are clearly distinguished.

## Contact and privacy
- [ ] Required fields are validated server-side.
- [ ] Honeypot behavior remains intact.
- [ ] Successful submissions are only reported after database insert success.
- [ ] Existing contact table and RLS behavior are unchanged.
- [ ] Privacy notice describes the actual fields collected.

## SEO
- [ ] Titles and descriptions are appropriate to each page.
- [ ] Canonical URLs match generated routes.
- [ ] Sitemap includes only canonical active category/product/project URLs.
- [ ] Sitemap excludes admin, query-filter variants, inactive records, and duplicate product URLs.
- [ ] Robots rules do not claim to secure private data.
- [ ] WebSite, Organization, Product, and BreadcrumbList structured data are valid and match visible content.
- [ ] Product structured data contains no invented offers or pricing.
- [ ] Redirects are checked if any old URL patterns are retired.

## Quality gates
- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] CI HTTP smoke test returns 200 for public static routes and 404 for an unknown static route; when Supabase is not configured, the database-backed category route shows the catalog-unavailable state rather than a false 404
- [ ] Responsive checks at 320, 360/390, 768, 1024, 1280, and 1440+ pixels.
- [ ] Keyboard and screen-reader spot checks.
- [ ] Lighthouse / Core Web Vitals checks on representative pages.
- [ ] Production-domain and environment configuration verified before release.

## Evidence to attach to release report
- Commit and branch references.
- Changed-file summary.
- Lint, typecheck, build, and test results.
- Database schema and row-count comparison from read-only inspection.
- Known limitations and unresolved blockers.
- Deployment and rollback status.
