import type { Metadata } from "next";
import Link from "next/link";
import type { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Furniture collection",
  description: "Browse the Allex Furniture collection by category or search by name and model.",
  alternates: { canonical: "/furniture" },
};

const pageSize = 12;

type SearchParams = { category?: string | string[]; q?: string | string[]; page?: string | string[] };

function categoryQuery(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from("categories").select("id,name,slug").eq("status", "active").order("name");
}

function productQuery(supabase: Awaited<ReturnType<typeof createClient>>, page: number, category: string, search: string) {
  let query = supabase
    .from("products")
    .select("id,name,model,categories!inner(name,slug),product_images(storage_path,alt_text,is_primary)", { count: "exact" })
    .eq("status", "active")
    .order("name")
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (category) query = query.eq("categories.slug", category);
  if (search) query = query.or(`name.ilike.%${search}%,model.ilike.%${search}%`);
  return query;
}

type Category = QueryData<ReturnType<typeof categoryQuery>>[number];
type Product = QueryData<ReturnType<typeof productQuery>>[number];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function pageHref(page: number, category: string, search: string) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (search) params.set("q", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/furniture?${query}` : "/furniture";
}

export default async function FurniturePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const category = firstParam(params.category).slice(0, 100);
  const search = firstParam(params.q).replace(/[^a-zA-Z0-9 -]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  const requestedPage = Math.max(1, Number.parseInt(firstParam(params.page), 10) || 1);
  let categories: Category[] = [];
  let products: Product[] = [];
  let total = 0;
  let currentPage = requestedPage;
  let connected = false;

  try {
    const supabase = await createClient();
    const { data: categoryData } = await categoryQuery(supabase);
    categories = categoryData ?? [];

    let result = await productQuery(supabase, currentPage, category, search);
    if (result.error) throw result.error;
    total = result.count ?? 0;
    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > lastPage) {
      currentPage = lastPage;
      result = await productQuery(supabase, currentPage, category, search);
      if (result.error) throw result.error;
    }
    products = result.data ?? [];
    connected = true;
  } catch {
    connected = false;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return <main>
    <SiteHeader />
    <section className="page-shell furniture-listing">
      <Link href="/" className="text-link">← Back to home</Link>
      <div className="page-heading furniture-heading">
        <p className="eyebrow">THE ALLEX EDIT</p>
        <h1>Furniture to <em>live with.</em></h1>
        <p>Browse the collection by category or search for a particular piece.</p>
      </div>
      <form className="catalog-filter" action="/furniture" method="get">
        <label className="field"><span>Search name or model</span><input name="q" type="search" maxLength={80} defaultValue={search} placeholder="e.g. sofa or ALX-101" /></label>
        <label className="field"><span>Category</span><select name="category" defaultValue={category}><option value="">All categories</option>{categories.map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}</select></label>
        <button className="button button-dark" type="submit">Find furniture <span>↗</span></button>
      </form>
      <div className="catalog-result-summary" aria-live="polite">{connected ? `${total} ${total === 1 ? "piece" : "pieces"}${search || category ? " found" : " in the collection"}` : "The catalog is temporarily unavailable."}</div>
      {products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-catalog"><span className="empty-icon">✳</span><h2>{connected ? "No pieces found." : "The catalog is taking a moment."}</h2><p>{connected ? "Try a different search or category." : "Please check back shortly."}</p>{(search || category) && <Link className="text-link" href="/furniture">Clear filters <span>↗</span></Link>}</div>}
      {connected && totalPages > 1 && <nav className="catalog-pagination" aria-label="Furniture pages">
        {currentPage > 1 ? <Link className="text-link" href={pageHref(currentPage - 1, category, search)}>← Previous</Link> : <span />}
        <span>Page {currentPage} of {totalPages}</span>
        {currentPage < totalPages ? <Link className="text-link" href={pageHref(currentPage + 1, category, search)}>Next →</Link> : <span />}
      </nav>}
    </section>
    <SiteFooter />
  </main>;
}