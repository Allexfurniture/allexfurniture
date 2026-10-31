import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/button-link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
type Props = { params: Promise<{ segments: string[] }> };

function productQuery(supabase: Awaited<ReturnType<typeof createClient>>, model: string) {
  return supabase.from("products").select("id,name,model,description,categories(name,slug,status),product_images(id,storage_path,alt_text,is_primary)").ilike("model", model).eq("status", "active").maybeSingle();
}

type ProductRecord = NonNullable<QueryData<ReturnType<typeof productQuery>>>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;
  if (segments.length !== 2) return { title: "Furniture", robots: { index: false, follow: true } };
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
    const product = data;

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
  if (segments.length !== 2) notFound();
  const model = segments.at(-1) ?? "";
  const categorySlug = segments.at(-2) ?? "";
  let product: ProductRecord | null = null;

  try {
    const supabase = await createClient();
    const { data } = await productQuery(supabase, model);
    const candidate = data;
    if (candidate && candidate.categories?.status === "active" && candidate.categories.slug === categorySlug) product = candidate;
  } catch { /* Not-found is the safe fallback while Supabase is not configured. */ }

  if (!product) notFound();
  const images = [...(product.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\\/$/, "");
  return <main>
    <SiteHeader actionHref={`/contact?subject=${encodeURIComponent(`Enquiry about ${product.name} (${product.model})`)}`} actionLabel="Ask about this piece" />
    <section className="page-shell">
      <Link href="/#catalog" className="text-link">← Back to the collection</Link>
      <div className="product-detail">
        <div className="detail-gallery">{images.length && storageUrl ? images.map((image, index) => <div key={image.id} className="detail-image-frame"><Image className="detail-image-photo" src={`${storageUrl}/storage/v1/object/public/furniture-images/${image.storage_path}`} alt={image.alt_text?.trim() || `${product.name} furniture by Allex Furniture`} width={1400} height={1100} sizes="(max-width: 750px) 90vw, 52vw" priority={index === 0} unoptimized /></div>) : <div className="detail-placeholder"><span>ALLEX FURNITURE</span><b>{product.name.slice(0, 1)}</b></div>}</div>
        <div className="detail-copy"><p className="eyebrow">{product.categories?.name ?? "THE COLLECTION"}</p><h1>{product.name}</h1><p className="model-label">MODEL {product.model}</p><div className="detail-rule" /><p className="detail-description">{product.description || "A considered piece from the Allex Furniture collection. Get in touch with our team to learn more about materials, dimensions and availability."}</p><ButtonLink href={`/contact?subject=${encodeURIComponent("Enquiry about " + product.name + " (" + product.model + ")")}`}>Enquire about this piece <span>↗</span></ButtonLink><p className="form-note">Catalog only. No online checkout or payment.</p></div>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
