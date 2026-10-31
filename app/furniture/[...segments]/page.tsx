import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/button-link";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_URL, getCategoryPath, getDescendantCategoryIds, getUniqueCategoryIds, isSafeModelSegment, productPath } from "@/lib/public-site";

type Props = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

function categoriesQuery(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from("categories")
    .select("id,name,slug,parent_id,description,status,updated_at,category_images(storage_path,alt_text)")
    .eq("status", "active")
    .order("name");
}

function productsByModelQuery(supabase: Awaited<ReturnType<typeof createClient>>, model: string) {
  return supabase.from("products")
    .select("id,name,model,description,category_id,updated_at,categories(id,name,slug,parent_id,status),product_images(id,storage_path,alt_text,is_primary)")
    .eq("status", "active")
    .eq("model", model)
    .limit(20);
}

function categoryProductsQuery(supabase: Awaited<ReturnType<typeof createClient>>, categoryIds: string[], page: number) {
  return supabase.from("products")
    .select("id,name,model,description,category_id,updated_at,categories(id,name,slug,parent_id,status),product_images(storage_path,alt_text,is_primary)", { count: "exact" })
    .eq("status", "active")
    .in("category_id", categoryIds)
    .order("name")
    .range((page - 1) * 12, page * 12 - 1);
}

type Category = QueryData<ReturnType<typeof categoriesQuery>>[number];
type Product = QueryData<ReturnType<typeof productsByModelQuery>>[number];
type CategoryProduct = QueryData<ReturnType<typeof categoryProductsQuery>>[number];

function relatedProductsQuery(supabase: Awaited<ReturnType<typeof createClient>>, categoryId: string, productId: string) {
  return supabase.from("products")
    .select("id,name,model,categories(id,name,slug,parent_id,status),product_images(storage_path,alt_text,is_primary)")
    .eq("status", "active")
    .eq("category_id", categoryId)
    .neq("id", productId)
    .order("name")
    .limit(4);
}

type RelatedProduct = QueryData<ReturnType<typeof relatedProductsQuery>>[number];

function safePage(value: string | string[] | undefined): number {
  const first = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(first ?? "1", 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 100000)) : 1;
}

function findCategory(segments: string[], categories: Category[]) {
  const requested = segments.join("/");
  const uniqueCategoryIds = getUniqueCategoryIds(categories);
  const matches = categories.filter((category) => uniqueCategoryIds.has(category.id) && getCategoryPath(category.id, categories).join("/") === requested);
  return matches.length === 1 ? matches[0] : null;
}

function productMatchesPath(product: Product, categorySegments: string[], categories: Category[]): boolean {
  if (!product.categories || product.categories.status !== "active") return false;
  if (!getUniqueCategoryIds(categories).has(product.categories.id)) return false;
  const path = getCategoryPath(product.categories.id, categories);
  return path.length > 0 && path.join("/") === categorySegments.join("/");
}

async function loadPageData() {
  const supabase = await createClient();
  const { data, error } = await categoriesQuery(supabase);
  if (error) throw error;
  return { supabase, categories: data ?? [] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;
  if (!segments.length || segments.length > 4) return { title: "Furniture", robots: { index: false, follow: true } };

  try {
    const { supabase, categories } = await loadPageData();
    const lastSegment = segments[segments.length - 1] ?? "";

    if (segments.length >= 2 && isSafeModelSegment(lastSegment)) {
      const { data } = await productsByModelQuery(supabase, lastSegment);
      const matches = (data ?? []).filter((product) => productMatchesPath(product, segments.slice(0, -1), categories));
      if (matches.length === 1) {
        const product = matches[0];
        const canonical = productPath(getCategoryPath(product.categories!.id, categories), product.model);
        const description = product.description?.trim().slice(0, 160) || `Explore ${product.name} from ALLEX Furniture and contact our team for further product information.`;
        return {
          title: product.name,
          description,
          alternates: { canonical },
          openGraph: { type: "website", title: product.name, description, url: canonical },
          twitter: { card: "summary", title: product.name, description },
        };
      }
    }

    const category = findCategory(segments, categories);
    if (category) {
      const canonical = `/furniture/${getCategoryPath(category.id, categories).map(encodeURIComponent).join("/")}`;
      const description = category.description?.trim().slice(0, 160) || `Browse ${category.name} furniture in the ALLEX Furniture catalog.`;
      return {
        title: category.name,
        description,
        alternates: { canonical },
        openGraph: { type: "website", title: category.name, description, url: canonical },
      };
    }
  } catch {
    // Metadata should remain resilient if the public catalog is temporarily unavailable.
  }

  return { title: "Furniture", robots: { index: false, follow: true } };
}

export default async function FurniturePathPage({ params, searchParams }: Props) {
  const { segments } = await params;
  const queryParams = await searchParams;
  if (!segments.length || segments.length > 4) notFound();

  let supabase: Awaited<ReturnType<typeof createClient>>;
  let categories: Category[];
  try {
    const loaded = await loadPageData();
    supabase = loaded.supabase;
    categories = loaded.categories;
  } catch {
    notFound();
  }

  const lastSegment = segments[segments.length - 1] ?? "";
  let productCandidates: Product[] = [];
  let product: Product | null = null;
  let related: RelatedProduct[] = [];

  if (segments.length >= 2 && isSafeModelSegment(lastSegment)) {
    try {
      const result = await productsByModelQuery(supabase!, lastSegment);
      if (result.error) throw result.error;
      productCandidates = result.data ?? [];
      const matches = productCandidates.filter((candidate) => productMatchesPath(candidate, segments.slice(0, -1), categories!));
      if (matches.length === 1) {
        product = matches[0];
        const relatedResult = await relatedProductsQuery(supabase!, product.category_id, product.id);
        const uniqueCategoryIds = getUniqueCategoryIds(categories!);
        if (!relatedResult.error) related = (relatedResult.data ?? []).filter((item) => item.categories?.status === "active" && uniqueCategoryIds.has(item.categories.id));
      }
    } catch {
      // Continue to legacy redirect, category lookup, and the branded 404 when needed.
    }
  }

  if (product) {
    const categoryPath = getCategoryPath(product.categories!.id, categories!);
    const images = [...(product.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
    const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
    const breadcrumbCategories = categoryPath.map((_, index) => {
      const prefix = categoryPath.slice(0, index + 1).join("/");
      return categories!.find((item) => getCategoryPath(item.id, categories!).join("/") === prefix);
    }).filter((item): item is Category => Boolean(item));
    const canonical = productPath(categoryPath, product.model);
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      model: product.model,
      description: product.description || undefined,
      image: images.map((image) => storageUrl ? `${storageUrl}/storage/v1/object/public/furniture-images/${image.storage_path}` : undefined).filter(Boolean),
      brand: { "@type": "Brand", name: "ALLEX Furniture" },
      url: new URL(canonical, SITE_URL).toString(),
    };

        return <main>
          <SiteHeader actionHref={`/contact?subject=${encodeURIComponent(`Enquiry about ${product.name} (${product.model})`)}`} actionLabel="Enquire about this product" />
          <section className="page-shell product-page">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/furniture">Furniture</Link>
              {breadcrumbCategories.map((item) => <span className="breadcrumb-part" key={item.id}><span aria-hidden="true">/</span><Link href={`/furniture/${getCategoryPath(item.id, categories!).map(encodeURIComponent).join("/")}`}>{item.name}</Link></span>)}
              <span aria-hidden="true">/</span><span aria-current="page">{product.name}</span>
            </nav>
            <div className="product-detail">
              <div className="detail-gallery">
                {images.length && storageUrl ? images.map((image, index) => <div key={image.id} className="detail-image-frame"><Image className="detail-image-photo" src={`${storageUrl}/storage/v1/object/public/furniture-images/${image.storage_path}`} alt={image.alt_text?.trim() || `${product.name} furniture by ALLEX Furniture`} width={1400} height={1100} sizes="(max-width: 750px) 90vw, 52vw" priority={index === 0} /></div>) : <div className="detail-placeholder"><span>ALLEX FURNITURE</span><b>{product.name.slice(0, 1)}</b><small>Product image not available</small></div>}
              </div>
              <div className="detail-copy">
                <p className="eyebrow">{product.categories?.name ?? "Furniture"}</p>
                <h1>{product.name}</h1>
                <p className="model-label">MODEL {product.model}</p>
                <div className="detail-rule" />
                <p className="detail-description">{product.description?.trim() || "Contact our team to request further information about this product."}</p>
                <ButtonLink href={`/contact?subject=${encodeURIComponent(`Enquiry about ${product.name} (${product.model})`)}`}>Enquire about this product <span>↗</span></ButtonLink>
                <p className="form-note">Catalog information only. No online checkout or payment is available.</p>
              </div>
            </div>
            {related.length > 0 && <section className="related-products"><div className="section-heading"><div><p className="eyebrow">EXPLORE MORE</p><h2>Related <em>furniture.</em></h2></div><Link className="text-link" href="/furniture">View all furniture ↗</Link></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} categories={categories!} categoryPath={item.categories ? getCategoryPath(item.categories.id, categories!) : []} />)}</div></section>}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
          </section>
          <SiteFooter />
        </main>;
  }

  if (segments.length === 2) {
    const legacyMatches = productCandidates.filter((candidate) => candidate.categories?.slug === segments[0] && candidate.categories?.status === "active");
    if (legacyMatches.length === 1) {
      const legacyProduct = legacyMatches[0];
      const legacyPath = getCategoryPath(legacyProduct.categories!.id, categories!);
      if (legacyPath.length > 0 && legacyPath.join("/") !== segments[0]) {
        permanentRedirect(productPath(legacyPath, legacyProduct.model));
      }
    }
  }

    const category = findCategory(segments, categories!);
  if (!category) notFound();

  const categoryPath = getCategoryPath(category.id, categories!);
  const uniqueCategoryIds = getUniqueCategoryIds(categories!);
  const descendants = getDescendantCategoryIds(category.id, categories!).filter((id) => uniqueCategoryIds.has(id));
  if (!categoryPath.length || !descendants.length) notFound();
  const requestedPage = safePage(queryParams.page);
  let currentPage = requestedPage;
  let products: CategoryProduct[] = [];
  let total = 0;
  try {
    let result = await categoryProductsQuery(supabase!, descendants, currentPage);
    if (result.error) throw result.error;
    total = result.count ?? 0;
    const lastPage = Math.max(1, Math.ceil(total / 12));
    if (currentPage > lastPage) {
      currentPage = lastPage;
      result = await categoryProductsQuery(supabase!, descendants, currentPage);
      if (result.error) throw result.error;
    }
    products = result.data ?? [];
  } catch {
    notFound();
  }

  const children = categories!.filter((item) => item.parent_id === category.id && uniqueCategoryIds.has(item.id));
  const imageBase = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const totalPages = Math.max(1, Math.ceil(total / 12));
  const breadcrumbCategories = categoryPath.map((_, index) => {
    const prefix = categoryPath.slice(0, index + 1).join("/");
    return categories!.find((item) => getCategoryPath(item.id, categories!).join("/") === prefix);
  }).filter((item): item is Category => Boolean(item));

  return <main>
    <SiteHeader />
    <section className="page-shell category-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/furniture">Furniture</Link>
        {breadcrumbCategories.map((item, index) => <span className="breadcrumb-part" key={item.id}><span aria-hidden="true">/</span>{index === breadcrumbCategories.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={`/furniture/${getCategoryPath(item.id, categories!).map(encodeURIComponent).join("/")}`}>{item.name}</Link>}</span>)}
      </nav>
      <div className="page-heading category-heading">
        <p className="eyebrow">ALLEX FURNITURE CATALOG</p>
        <h1>{category.name}</h1>
        <p>{category.description?.trim() || `Explore active furniture in the ${category.name} category.`}</p>
      </div>
      {children.length > 0 && <section className="category-children">
        <div className="section-heading"><div><p className="eyebrow">EXPLORE BY CATEGORY</p><h2>Browse <em>subcategories.</em></h2></div></div>
        <div className="category-card-grid">{children.map((child) => {
          const image = child.category_images;
          const imageUrl = image && imageBase ? `${imageBase}/storage/v1/object/public/furniture-images/${image.storage_path}` : null;
          return <Link className="category-card" href={`/furniture/${getCategoryPath(child.id, categories!).map(encodeURIComponent).join("/")}`} key={child.id}>
            <div className="category-card-image">{imageUrl ? <Image src={imageUrl} alt={image?.alt_text?.trim() || child.name} fill sizes="(max-width: 650px) 90vw, 30vw" /> : <div className="category-placeholder" aria-hidden="true"><span>ALLEX</span><b>{child.name.slice(0, 1)}</b></div>}</div>
            <div className="category-card-copy"><h3>{child.name}</h3><span aria-hidden="true">↗</span></div>
          </Link>;
        })}</div>
      </section>}
      <section className="category-products">
        <div className="section-heading"><div><p className="eyebrow">AVAILABLE IN THIS CATEGORY</p><h2>Furniture <em>catalog.</em></h2></div><span className="catalog-result-summary">{total} {total === 1 ? "product" : "products"}</span></div>
        {products.length > 0 ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} categories={categories!} categoryPath={product.categories ? getCategoryPath(product.categories.id, categories!) : []} />)}</div> : <div className="empty-catalog"><h3>No active products in this category yet.</h3><p>Browse the full catalog or contact our team for assistance.</p><Link className="text-link" href="/furniture">Browse all furniture ↗</Link></div>}
        {totalPages > 1 && <nav className="catalog-pagination" aria-label="Category product pages">
          {currentPage > 1 ? <Link className="text-link" href={`?page=${currentPage - 1}`}>← Previous</Link> : <span />}
          <span>Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages ? <Link className="text-link" href={`?page=${currentPage + 1}`}>Next →</Link> : <span />}
        </nav>}
      </section>
    </section>
    <SiteFooter />
  </main>;
}
