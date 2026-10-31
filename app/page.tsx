import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/button-link";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { COMPANY, SITE_URL, getCategoryPath, getUniqueCategoryIds } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Home",
  description: "Explore the ALLEX Furniture catalog and enquire about office, commercial, and custom-made furniture solutions.",
  alternates: { canonical: "/" },
};

function loadProducts(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from("products")
    .select("id,name,model,categories(id,name,slug,parent_id,status),product_images(storage_path,alt_text,is_primary)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);
}

function loadCategories(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from("categories")
    .select("id,name,slug,parent_id,status,category_images(storage_path,alt_text)")
    .eq("status", "active")
    .order("name");
}

type Product = QueryData<ReturnType<typeof loadProducts>>[number];
type Category = QueryData<ReturnType<typeof loadCategories>>[number];

export default async function Home() {
  let products: Product[] = [];
  let categories: Category[] = [];
  let connected = false;
  try {
    const supabase = await createClient();
    const [{ data: productData, error: productError }, { data: categoryData, error: categoryError }] = await Promise.all([loadProducts(supabase), loadCategories(supabase)]);
    products = productData ?? [];
    categories = categoryData ?? [];
    connected = !productError && !categoryError;
  } catch {
    // Keep the public landing page useful while environment variables are being configured.
  }

  const uniqueCategoryIds = getUniqueCategoryIds(categories);
  const validCategories = categories.filter((category) => uniqueCategoryIds.has(category.id));
  const rootCategories = validCategories.filter((category) => !category.parent_id);
  const productGroups = products.reduce<{ id: string; slug: string; name: string; items: Product[] }[]>((groups, product) => {
    const category = product.categories;
    if (!category || category.status !== "active" || !validCategories.some((item) => item.id === category.id)) return groups;
    let group = groups.find((item) => item.id === category.id);
    if (!group) {
      group = { id: category.id, slug: category.slug, name: category.name, items: [] };
      groups.push(group);
    }
    group.items.push(product);
    return groups;
  }, []);

  const heroProduct = products.find((product) =>
    product.categories?.status === "active"
    && validCategories.some((category) => category.id === product.categories?.id)
    && Boolean(product.product_images?.length)
  );
  const heroImage = heroProduct?.product_images?.find((image) => image.is_primary) ?? heroProduct?.product_images?.[0];
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const heroImageUrl = heroImage && storageUrl
    ? `${storageUrl}/storage/v1/object/public/furniture-images/${heroImage.storage_path}`
    : null;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.name,
    url: SITE_URL,
    email: COMPANY.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "NI Tower, Level 7, Plot 01, Road 10, Block E, Banani",
      addressLocality: "Dhaka",
      postalCode: "1213",
      addressCountry: "BD",
    },
  };

  return <main>
    <SiteHeader />
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-line" /> COMMERCIAL & CUSTOM FURNITURE</p>
        <h1>Furniture for<br />spaces that <em>work.</em></h1>
        <p className="hero-description">ALLEX Furniture provides office and commercial furniture solutions, including custom-made options for spaces with specific needs.</p>
        <div className="hero-actions"><Link className="button button-dark" href="/furniture">Explore furniture <span>↗</span></Link><Link className="text-link" href="/contact">Discuss an enquiry <span>↗</span></Link></div>
        <div className="hero-note"><span className="note-dot" /> {COMPANY.tagline}</div>
      </div>
      <div className="hero-visual">
        <div className="hero-photo">
          {heroImageUrl && heroProduct ? <Image className="hero-product-image" src={heroImageUrl} alt={heroImage?.alt_text?.trim() || `${heroProduct.name} furniture by ALLEX Furniture`} fill sizes="(max-width: 900px) 90vw, 45vw" priority /> : null}
        </div>
        <div className="photo-label"><span>ALLEX FURNITURE</span><span>OFFICE & COMMERCIAL</span></div>
        <div className="hero-stamp"><span>THOUGHTFUL</span><b>FURNITURE<br />SOLUTIONS.</b><span>ALLEX FURNITURE</span></div>
      </div>
    </section>

    <section className="trust-strip"><span>OFFICE FURNITURE</span><i /> <span>CUSTOM-MADE SOLUTIONS</span><i /> <span>ACTIVE PRODUCT CATALOG</span><i /> <span>DIRECT ENQUIRIES</span></section>

    <section id="collections" className="section collections-section">
      <div className="section-heading"><div><p className="eyebrow">EXPLORE THE CATALOG</p><h2>Browse by <em>category.</em></h2><p className="section-intro">Choose a category to explore its subcategories and published products.</p></div><Link className="text-link" href="/furniture">View all furniture <span>↗</span></Link></div>
      {rootCategories.length ? <div className="collection-grid">{rootCategories.map((category, index) => {
        const image = category.category_images;
        const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
        const imageUrl = image && storageUrl ? `${storageUrl}/storage/v1/object/public/furniture-images/${image.storage_path}` : null;
        const path = getCategoryPath(category.id, validCategories);
        const childCount = validCategories.filter((item) => item.parent_id === category.id).length;
        return <Link className={`collection-card collection-${(index % 3) + 1}`} href={`/furniture/${path.map(encodeURIComponent).join("/")}`} key={category.id}>
          <div className="collection-image">{imageUrl ? <Image src={imageUrl} alt={image?.alt_text?.trim() || category.name} fill sizes="(max-width: 650px) 90vw, 40vw" /> : null}</div>
          <div className="collection-overlay" /><div className="collection-copy"><span>{String(index + 1).padStart(2, "0")} / CATEGORY</span><h3>{category.name}</h3><p>{childCount ? `${childCount} subcategories to explore` : "Explore products"}</p></div><span className="round-arrow" aria-hidden="true">↗</span>
        </Link>;
      })}</div> : <div className="empty-catalog"><h3>{connected ? "Categories are not published yet." : "The catalog is temporarily unavailable."}</h3><p>Contact our team if you need help with a furniture enquiry.</p><Link className="text-link" href="/contact">Contact ALLEX Furniture ↗</Link></div>}
    </section>

    <section id="catalog" className="section catalog-section">
      <div className="section-heading"><div><p className="eyebrow">PUBLISHED PRODUCTS</p><h2>Explore the <em>catalog.</em></h2><p className="section-intro">Product names, model numbers, and images shown here come from the current catalog.</p></div><Link className="text-link" href="/furniture">Browse all furniture <span>↗</span></Link></div>
      {productGroups.length > 0 ? <div className="catalog-groups">{productGroups.map((group) => <section id={`category-${group.slug}`} className="catalog-group" key={group.id}><div className="section-heading"><div><h3>{group.name}</h3></div><Link className="text-link" href={`/furniture?category=${encodeURIComponent(getCategoryPath(group.id, validCategories).join("/"))}`}>Filter by category ↗</Link></div><div className="product-grid">{group.items.map((product) => <ProductCard key={product.id} product={product} categories={validCategories} categoryPath={product.categories ? getCategoryPath(product.categories.id, validCategories) : []} />)}</div></section>)}</div> : <div className="empty-catalog"><span className="empty-icon" aria-hidden="true">✳</span><h3>{connected ? "No active products are published yet." : "The catalog is temporarily unavailable."}</h3><p>Contact our team if you need information about a furniture requirement.</p><Link className="text-link" href="/contact">Ask about furniture ↗</Link></div>}
    </section>

    <section id="story" className="story-section"><div className="story-image" aria-hidden="true" /><div className="story-copy"><p className="eyebrow">ABOUT ALLEX FURNITURE</p><h2>Furniture shaped around <em>your space.</em></h2><p>From the published catalog to custom furniture enquiries, ALLEX Furniture helps businesses explore furniture options for the spaces they need to create.</p><ButtonLink variant="light" href="/about">Learn about ALLEX Furniture <span>↗</span></ButtonLink><Link className="story-signoff" href="/group">Explore our group concerns ↗</Link></div></section>

    <section className="contact-banner"><div><p className="eyebrow">HAVE A REQUIREMENT?</p><h2>Let’s discuss your<br /><em>furniture enquiry.</em></h2></div><ButtonLink href="/contact">Contact our team <span>↗</span></ButtonLink></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c") }} />
    <SiteFooter />
  </main>;
}
