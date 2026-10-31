import Link from "next/link";
import type { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/button-link";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

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
  } catch { /* The storefront remains useful while environment variables are being configured. */ }

  const productGroups = products.reduce<{ slug: string; name: string; items: typeof products }[]>((groups, product) => {
    const slug = product.categories?.slug ?? "furniture";
    const name = product.categories?.name ?? "Furniture";
    let group = groups.find((item) => item.slug === slug);
    if (!group) {
      group = { slug, name, items: [] };
      groups.push(group);
    }
    group.items.push(product);
    return groups;
  }, []);

  return (
    <main>
      <SiteHeader showNavigation />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> MADE FOR LIVING</p>
          <h1>Spaces that<br />feel like <em>you.</em></h1>
          <p className="hero-description">Furniture with a point of view. Discover considered pieces, honest materials and timeless forms made to feel at home.</p>
          <div className="hero-actions"><a className="button button-dark" href="#catalog">Explore the collection <span>↗</span></a><a className="text-link" href="#story">Get to know us <span>↓</span></a></div>
          <div className="hero-note"><span className="note-dot" /> A little more considered. A lot more you.</div>
        </div>
        <div className="hero-visual">
          <div className="hero-photo" role="img" aria-label="Warm contemporary living room with sculptural furniture" />
          <div className="photo-label"><span>01 / 03</span><span>THE ART OF EVERYDAY</span></div>
          <div className="hero-stamp"><span>GOOD DESIGN</span><b>GOOD<br/>LIVING.</b><span>ALLEX FURNITURE</span></div>
        </div>
      </section>

      <section className="trust-strip"><span>TIMELESS BY DESIGN</span><i /> <span>MADE FOR REAL LIFE</span><i /> <span>DETAILS THAT MATTER</span><i /> <span>ROOM TO BE YOURSELF</span></section>

      <section id="collections" className="section collections-section">
        <div className="section-heading"><div><p className="eyebrow">FIND YOUR FEEL</p><h2>Rooms with <em>character.</em></h2></div><Link className="text-link" href="/furniture">View all furniture <span>↗</span></Link></div>
        {categories.length ? <div className="collection-grid">{categories.map((category, index) => {
          const image = category.category_images;
          const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          return <Link className={`collection-card collection-${(index % 3) + 1}`} href={`/furniture?category=${encodeURIComponent(category.slug)}`} key={category.id}><div className="collection-image" style={image && storageUrl ? { backgroundImage: `url("${storageUrl}/storage/v1/object/public/furniture-images/${image.storage_path}")` } : undefined} role={image ? "img" : undefined} aria-label={image?.alt_text ?? undefined} /><div className="collection-overlay" /><div className="collection-copy"><span>{String(index + 1).padStart(2, "0")} / COLLECTION</span><h3>{category.name}</h3><p>Explore the collection</p></div><span className="round-arrow">↗</span></Link>;
        })}</div> : <div className="empty-catalog"><h3>{connected ? "New collections are on the way." : "Collections will appear here when the catalog is connected."}</h3></div>}
      </section>

      <section id="catalog" className="section catalog-section">
        <div className="section-heading"><div><p className="eyebrow">THE ALLEX EDIT</p><h2>Pieces to <em>live with.</em></h2><p className="section-intro">Explore the latest additions, then browse the full collection.</p></div><Link className="text-link" href="/furniture">Browse all furniture <span>↗</span></Link></div>
        {productGroups.length > 0 && <div className="category-pills">{productGroups.map((group) => <a key={group.slug} href={`#category-${group.slug}`}>{group.name}</a>)}</div>}
        {products.length ? <div className="catalog-groups">{productGroups.map((group) => <section id={`category-${group.slug}`} className="catalog-group" key={group.slug}><div className="section-heading"><div><h3>{group.name}</h3></div></div><div className="product-grid">{group.items.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>)}</div> : <div className="empty-catalog"><span className="empty-icon">✳</span><h3>The collection is taking shape.</h3><p>{connected ? "Our team is preparing the first pieces. Check back soon." : "Our furniture collection will appear here as soon as the catalog is connected."}</p><Link className="text-link" href="/contact">Ask us about a piece <span>↗</span></Link></div>}
      </section>

      <section id="story" className="story-section"><div className="story-image" role="img" aria-label="Natural textures and furniture in a calm interior" /><div className="story-copy"><p className="eyebrow">A MORE PERSONAL SPACE</p><h2>Not just furniture.<br /><em>A feeling.</em></h2><p>We believe the best spaces aren&apos;t styled to impress. They&apos;re made to live in. Allex brings together thoughtful design, warm materials and useful details to help make your space unmistakably yours.</p><ButtonLink variant="light" href="/contact">Tell us what you have in mind <span>↗</span></ButtonLink><span className="story-signoff">Make room for living. — Allex</span></div></section>

      <section className="contact-banner"><div><p className="eyebrow">SOMETHING IN MIND?</p><h2>Let’s make room<br />for <em>what matters.</em></h2></div><ButtonLink href="/contact">Start a conversation <span>↗</span></ButtonLink></section>
      <SiteFooter />
    </main>
  );
}

async function loadProducts(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from("products").select("id,name,model,description,categories(name,slug),product_images(storage_path,alt_text,is_primary)").eq("status", "active").order("created_at", { ascending: false }).limit(8);
}

async function loadCategories(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from("categories").select("id,name,slug,category_images(storage_path,alt_text)").eq("status", "active").is("parent_id", null).order("name");
}
