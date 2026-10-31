import type { Metadata } from "next";
import Link from "next/link";
import type { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCategoryPath, getDescendantCategoryIds, getUniqueCategoryIds } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Furniture catalog",
  description: "Browse ALLEX Furniture products by category or search by product name and model number.",
  alternates: { canonical: "/furniture" },
};

const pageSize = 12;
const batchSize = 500;
type SearchParams = { category?: string | string[]; q?: string | string[]; page?: string | string[] };

function categoryQuery(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from("categories").select("id,name,slug,parent_id,status").eq("status", "active").order("name");
}

function productQuery(supabase: Awaited<ReturnType<typeof createClient>>, page: number, categoryIds?: string[]) {
  let query = supabase
    .from("products")
    .select("id,name,model,category_id,categories(id,name,slug,parent_id,status),product_images(storage_path,alt_text,is_primary)", { count: "exact" })
    .eq("status", "active")
    .order("name")
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (categoryIds) query = query.in("category_id", categoryIds);
  return query;
}

function searchableProductsQuery(supabase: Awaited<ReturnType<typeof createClient>>, search: string, categoryIds?: string[]) {
  let query = supabase
    .from("products")
    .select("id,name,model,category_id,categories(id,name,slug,parent_id,status),product_images(storage_path,alt_text,is_primary)")
    .eq("status", "active")
    .or(`name.ilike.%${search}%,model.ilike.%${search}%`)
    .order("name");
  if (categoryIds) query = query.in("category_id", categoryIds);
  return query;
}

function categoryNameSearchQuery(supabase: Awaited<ReturnType<typeof createClient>>, categoryIds: string[]) {
  return supabase
    .from("products")
    .select("id,name,model,category_id,categories(id,name,slug,parent_id,status),product_images(storage_path,alt_text,is_primary)")
    .eq("status", "active")
    .in("category_id", categoryIds)
    .order("name");
}

type Category = QueryData<ReturnType<typeof categoryQuery>>[number];
type Product = QueryData<ReturnType<typeof productQuery>>[number];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function safeSearch(value: string) {
  return value.replace(/[^a-zA-Z0-9 .-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function categoryLabel(category: Category, categories: Category[]) {
  const byId = new Map(categories.map((item) => [item.id, item]));
  const names: string[] = [];
  const seen = new Set<string>();
  let current: Category | undefined = category;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    names.unshift(current.name);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return names.join(" / ");
}

function pageHref(page: number, category: string, search: string) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (search) params.set("q", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/furniture?${query}` : "/furniture";
}

async function collectInBatches<T>(
  fetchBatch: (offset: number, limit: number) => Promise<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const results: T[] = [];
  for (let offset = 0; offset < 50_000; offset += batchSize) {
    const { data, error } = await fetchBatch(offset, batchSize);
    if (error) throw error;
    const rows = data ?? [];
    results.push(...rows);
    if (rows.length < batchSize) break;
  }
  return results;
}

export default async function FurniturePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const categoryParam = firstParam(params.category).slice(0, 500);
  let categoryKey = categoryParam;
  const search = safeSearch(firstParam(params.q));
  const requestedPage = Math.max(1, Math.min(100000, Number.parseInt(firstParam(params.page), 10) || 1));
  let categories: Category[] = [];
  let products: Product[] = [];
  let total = 0;
  let currentPage = requestedPage;
  let connected = false;

  try {
    const supabase = await createClient();
    const { data: categoryData, error: categoryError } = await categoryQuery(supabase);
    if (categoryError) throw categoryError;
    categories = categoryData ?? [];
    const uniqueCategoryIds = getUniqueCategoryIds(categories);
    const validCategories = categories.filter((item) => uniqueCategoryIds.has(item.id));
    const selectedCategory = categoryParam
      ? validCategories.find((item) => getCategoryPath(item.id, validCategories).join("/") === categoryParam)
        ?? (() => {
          const legacyMatches = validCategories.filter((item) => item.slug === categoryParam);
          return legacyMatches.length === 1 ? legacyMatches[0] : undefined;
        })()
      : undefined;
    categoryKey = selectedCategory ? getCategoryPath(selectedCategory.id, validCategories).join("/") : categoryParam;
    const selectedIds = selectedCategory ? getDescendantCategoryIds(selectedCategory.id, validCategories) : undefined;
    const invalidFilter = Boolean(categoryParam && !selectedCategory);

    if (invalidFilter || (selectedCategory && selectedIds?.length === 0)) {
      products = [];
      total = 0;
    } else if (search) {
      const byId = new Map<string, Product>();
      const nameModelMatches = await collectInBatches<Product>(async (offset, limit) => {
        const result = await searchableProductsQuery(supabase, search, selectedIds).range(offset, offset + limit - 1);
        return { data: result.data as Product[] | null, error: result.error };
      });
      for (const product of nameModelMatches) byId.set(product.id, product);

      const matchingCategoryIds = [...new Set(validCategories
        .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
        .flatMap((item) => getDescendantCategoryIds(item.id, validCategories))
        .filter((id) => !selectedIds || selectedIds.includes(id)))];
      if (matchingCategoryIds.length > 0) {
        const categoryMatches = await collectInBatches<Product>(async (offset, limit) => {
          const result = await categoryNameSearchQuery(supabase, matchingCategoryIds).range(offset, offset + limit - 1);
          return { data: result.data as Product[] | null, error: result.error };
        });
        for (const product of categoryMatches) byId.set(product.id, product);
      }
      const allMatches = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
      total = allMatches.length;
      const lastPage = Math.max(1, Math.ceil(total / pageSize));
      currentPage = Math.min(currentPage, lastPage);
      products = allMatches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    } else {
      let result = await productQuery(supabase, currentPage, selectedIds);
      if (result.error) throw result.error;
      total = result.count ?? 0;
      const lastPage = Math.max(1, Math.ceil(total / pageSize));
      if (currentPage > lastPage) {
        currentPage = lastPage;
        result = await productQuery(supabase, currentPage, selectedIds);
        if (result.error) throw result.error;
      }
      products = result.data ?? [];
    }
    connected = true;
  } catch {
    connected = false;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const uniqueCategoryIds = getUniqueCategoryIds(categories);
  const validCategories = categories.filter((item) => uniqueCategoryIds.has(item.id))
    .sort((a, b) => getCategoryPath(a.id, categories).join("/").localeCompare(getCategoryPath(b.id, categories).join("/")));

  return <main>
    <SiteHeader />
    <section className="page-shell furniture-listing">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Furniture</span></nav>
      <div className="page-heading furniture-heading">
        <p className="eyebrow">ALLEX FURNITURE CATALOG</p>
        <h1>Furniture for <em>your space.</em></h1>
        <p>Browse the published catalog by category, product name, or model number. For product details not shown here, send our team an enquiry.</p>
      </div>
      <form className="catalog-filter" action="/furniture" method="get">
        <label className="field"><span>Search products or categories</span><input name="q" type="search" maxLength={80} defaultValue={search} placeholder="e.g. executive chair or AF-9K" /></label>
        <label className="field"><span>Category</span><select name="category" defaultValue={categoryKey}><option value="">All categories</option>{validCategories.map((item) => <option value={getCategoryPath(item.id, validCategories).join("/")} key={item.id}>{categoryLabel(item, validCategories)}</option>)}</select></label>
        <button className="button button-dark" type="submit">Search catalog <span>↗</span></button>
      </form>
      <div className="catalog-result-summary" aria-live="polite">{connected ? `${total} ${total === 1 ? "product" : "products"}${search || categoryParam ? " found" : " in the catalog"}` : "The catalog is temporarily unavailable."}</div>
      {products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} categories={validCategories} categoryPath={product.categories ? getCategoryPath(product.categories.id, validCategories) : []} />)}</div> : <div className="empty-catalog"><span className="empty-icon" aria-hidden="true">✳</span><h2>{connected ? "No products found." : "The catalog is temporarily unavailable."}</h2><p>{connected ? "Try a different search term or category." : "Please check back shortly or contact our team."}</p>{(search || categoryParam) && <Link className="text-link" href="/furniture">Clear filters ↗</Link>}{connected && <Link className="text-link" href="/contact">Ask our team about furniture ↗</Link>}</div>}
      {connected && totalPages > 1 && <nav className="catalog-pagination" aria-label="Furniture pages">
        {currentPage > 1 ? <Link className="text-link" href={pageHref(currentPage - 1, categoryKey, search)}>← Previous</Link> : <span />}
        <span>Page {currentPage} of {totalPages}</span>
        {currentPage < totalPages ? <Link className="text-link" href={pageHref(currentPage + 1, categoryKey, search)}>Next →</Link> : <span />}
      </nav>}
    </section>
    <SiteFooter />
  </main>;
}
