import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Product = { id: string; name: string; model: string; description: string | null; categories: { name: string; slug: string } | null; product_images: { storage_path: string; alt_text: string | null; is_primary: boolean }[] };

const collections = [
  { title: "Living room", subtitle: "The art of slowing down", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85", href: "/#catalog" },
  { title: "Dining", subtitle: "Gather beautifully", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85", href: "/#catalog" },
  { title: "Bedroom", subtitle: "A softer place to land", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=85", href: "/#catalog" },
];

export default async function Home() {
  let products: Product[] = [];
  let connected = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id,name,model,description,categories(name,slug),product_images(storage_path,alt_text,is_primary)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8);
    if (!error) {
      products = (data ?? []) as unknown as Product[];
      connected = true;
    }
  } catch { /* The storefront remains useful while environment variables are being configured. */ }

  const productGroups = products.reduce<{ slug: string; name: string; items: Product[] }[]>((groups, product) => {
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
      <div className="announcement">Thoughtfully made furniture · Designed for the way you live</div>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Allex Furniture home"><span className="brand-mark">A.</span><span>ALLEX<span className="brand-light">FURNITURE</span></span></Link>
        <nav className="main-nav"><a href="#collections">Collections</a><a href="#catalog">Our furniture</a><a href="#story">Our story</a></nav>
        <Link className="header-cta" href="/contact">Let’s talk <span>↗</span></Link>
      </header>

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
        <div className="section-heading"><div><p className="eyebrow">FIND YOUR FEEL</p><h2>Rooms with <em>character.</em></h2></div><a className="text-link" href="#catalog">View all furniture <span>↗</span></a></div>
        <div className="collection-grid">{collections.map((item, index) => <Link className={`collection-card collection-${index + 1}`} href={item.href} key={item.title}><div className="collection-image" style={{ backgroundImage: `url("${item.image}")` }} /><div className="collection-overlay" /><div className="collection-copy"><span>0{index + 1} / COLLECTION</span><h3>{item.title}</h3><p>{item.subtitle}</p></div><span className="round-arrow">↗</span></Link>)}</div>
      </section>

      <section id="catalog" className="section catalog-section">
        <div className="section-heading"><div><p className="eyebrow">THE ALLEX EDIT</p><h2>Pieces to <em>live with.</em></h2><p className="section-intro">Explore the collection, from everyday essentials to the pieces that make a room yours.</p></div></div>
        {productGroups.length > 0 && <div className="category-pills">{productGroups.map((group) => <a key={group.slug} href={`#category-${group.slug}`}>{group.name}</a>)}</div>}
        {products.length ? <div className="catalog-groups">{productGroups.map((group) => <section id={`category-${group.slug}`} className="catalog-group" key={group.slug}><div className="section-heading"><div><h3>{group.name}</h3></div></div><div className="product-grid">{group.items.map((product) => {
          const primary = product.product_images?.find((image) => image.is_primary) ?? product.product_images?.[0];
          return <article className="product-card" key={product.id}><div className="product-image">{primary ? <div className="product-photo" style={{ backgroundImage: `url("${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/furniture-images/${primary.storage_path}")` }} /> : <div className="product-placeholder"><span>ALLEX</span><b>{product.name.slice(0, 1)}</b></div>}<span className="product-tag">{product.categories?.name ?? "Furniture"}</span></div><div className="product-info"><div><h3>{product.name}</h3><p>Model {product.model}</p></div><Link className="product-arrow" href={`/furniture/${product.categories?.slug ?? "collection"}/${product.model}`} aria-label={`View ${product.name}`}>↗</Link></div></article>;
        })}</div></section>)}</div> : <div className="empty-catalog"><span className="empty-icon">✳</span><h3>The collection is taking shape.</h3><p>{connected ? "Our team is preparing the first pieces. Check back soon." : "Our furniture collection will appear here as soon as the catalog is connected."}</p><Link className="text-link" href="/contact">Ask us about a piece <span>↗</span></Link></div>}
      </section>

      <section id="story" className="story-section"><div className="story-image" role="img" aria-label="Natural textures and furniture in a calm interior" /><div className="story-copy"><p className="eyebrow">A MORE PERSONAL SPACE</p><h2>Not just furniture.<br /><em>A feeling.</em></h2><p>We believe the best spaces aren&apos;t styled to impress. They&apos;re made to live in. Allex brings together thoughtful design, warm materials and useful details to help make your space unmistakably yours.</p><Link className="button button-light" href="/contact">Tell us what you have in mind <span>↗</span></Link><span className="story-signoff">Make room for living. — Allex</span></div></section>

      <section className="contact-banner"><div><p className="eyebrow">SOMETHING IN MIND?</p><h2>Let’s make room<br />for <em>what matters.</em></h2></div><Link className="button button-dark" href="/contact">Start a conversation <span>↗</span></Link></section>
      <footer className="site-footer"><Link href="/" className="brand"><span className="brand-mark">A.</span><span>ALLEX<span className="brand-light">FURNITURE</span></span></Link><p>Furniture for living, and living well.</p><div className="footer-links"><Link href="/contact">Contact</Link><Link href="/admin/login">Admin</Link></div><span className="copyright">© {new Date().getFullYear()} Allex Furniture</span></footer>
    </main>
  );
}
