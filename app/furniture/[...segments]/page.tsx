import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ImageRow = { id: string; storage_path: string; alt_text: string | null; is_primary: boolean };
type ProductRecord = {
  id: string;
  name: string;
  model: string;
  description: string | null;
  categories: { name: string; slug: string; status: string } | null;
  product_images: ImageRow[] | null;
};
type Props = { params: Promise<{ segments: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;
  const model = segments.at(-1) ?? "";
  const categorySlug = segments.at(-2) ?? "";
  const fallbackTitle = (model || "Furniture").replaceAll("-", " ");

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("name,model,description,categories(slug,status)")
      .ilike("model", model)
      .eq("status", "active")
      .maybeSingle();
    const product = data as unknown as { name: string; model: string; description: string | null; categories: { slug: string; status: string } | null } | null;

    if (product && product.categories?.status === "active" && product.categories.slug === categorySlug) {
      const description = product.description?.trim().slice(0, 160)
        || `Discover ${product.name} from Allex Furniture. Contact our team for materials, dimensions and availability.`;
      const canonical = `/furniture/${segments.map(encodeURIComponent).join("/")}`;
      return {
        title: product.name,
        description,
        alternates: { canonical },
        openGraph: { type: "website", title: product.name, description, url: canonical },
        twitter: { card: "summary", title: product.name, description },
      };
    }
  } catch {
    // Keep metadata generation resilient when the catalog database is unavailable.
  }

  return { title: fallbackTitle, robots: { index: false, follow: true } };
}

export default async function ProductPage({ params }: Props) {
  const { segments } = await params;
  if (segments.length < 2) notFound();
  const model = segments.at(-1) ?? "";
  const categorySlug = segments.at(-2) ?? "";
  let product: ProductRecord | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("id,name,model,description,categories(name,slug,status),product_images(id,storage_path,alt_text,is_primary)")
      .ilike("model", model)
      .eq("status", "active")
      .maybeSingle();
    const candidate = data as unknown as ProductRecord | null;
    if (candidate && candidate.categories?.status === "active" && candidate.categories.slug === categorySlug) product = candidate;
  } catch { /* Not-found is the safe fallback while Supabase is not configured. */ }

  if (!product) notFound();
  const images = [...(product.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return <main>
    <div className="announcement">Thoughtfully made furniture · Designed for the way you live</div>
    <header className="site-header"><Link href="/" className="brand"><span className="brand-mark">A.</span><span>ALLEX<span className="brand-light">FURNITURE</span></span></Link><Link className="header-cta" href="/contact">Ask about this piece ↗</Link></header>
    <section className="page-shell">
      <Link href="/#catalog" className="text-link">← Back to the collection</Link>
      <div className="product-detail">
        <div className="detail-gallery">{images.length ? images.map((image) => <div key={image.id} className="detail-image" role="img" aria-label={image.alt_text || product.name} style={{ backgroundImage: `url("${storageUrl}/storage/v1/object/public/furniture-images/${image.storage_path}")` }} />) : <div className="detail-placeholder"><span>ALLEX FURNITURE</span><b>{product.name.slice(0, 1)}</b></div>}</div>
        <div className="detail-copy"><p className="eyebrow">{product.categories?.name ?? "THE COLLECTION"}</p><h1>{product.name}</h1><p className="model-label">MODEL {product.model}</p><div className="detail-rule" /><p className="detail-description">{product.description || "A considered piece from the Allex Furniture collection. Get in touch with our team to learn more about materials, dimensions and availability."}</p><Link href={`/contact?subject=${encodeURIComponent("Enquiry about " + product.name + " (" + product.model + ")")}`} className="button button-dark">Enquire about this piece <span>↗</span></Link><p className="form-note">Catalog only. No online checkout or payment.</p></div>
      </div>
    </section>
    <footer className="site-footer"><Link href="/" className="brand"><span className="brand-mark">A.</span><span>ALLEX<span className="brand-light">FURNITURE</span></span></Link><p>Furniture for living, and living well.</p><div className="footer-links"><Link href="/contact">Contact</Link><Link href="/admin/login">Admin</Link></div><span className="copyright">© {new Date().getFullYear()} Allex Furniture</span></footer>
  </main>;
}
