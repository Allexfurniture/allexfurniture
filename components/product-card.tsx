import Link from "next/link";
import type { Tables } from "@/lib/database.types";

type CatalogProduct = Pick<Tables<"products">, "id" | "name" | "model"> & {
  categories: Pick<Tables<"categories">, "name" | "slug"> | null;
  product_images: Pick<Tables<"product_images">, "storage_path" | "alt_text" | "is_primary">[] | null;
};

export function ProductCard({ product }: { product: CatalogProduct }) {
  const primary = product.product_images?.find((image) => image.is_primary) ?? product.product_images?.[0];
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const imageUrl = primary && storageUrl ? `${storageUrl}/storage/v1/object/public/furniture-images/${primary.storage_path}` : null;
  const href = `/furniture/${encodeURIComponent(product.categories?.slug ?? "collection")}/${encodeURIComponent(product.model)}`;

  return <article className="product-card">
    <Link className="listing-product-link" href={href} aria-label={`View ${product.name}`}>
      <div className="product-image">{imageUrl ? <div className="product-photo" role="img" aria-label={primary?.alt_text ?? product.name} style={{ backgroundImage: `url("${imageUrl}")` }} /> : <div className="product-placeholder"><span>ALLEX</span><b>{product.name.slice(0, 1)}</b></div>}<span className="product-tag">{product.categories?.name ?? "Furniture"}</span></div>
      <div className="product-info"><div><h2>{product.name}</h2><p>Model {product.model}</p></div><span className="product-arrow" aria-hidden="true">↗</span></div>
    </Link>
  </article>;
}