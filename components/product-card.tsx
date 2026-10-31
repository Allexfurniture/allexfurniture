import Image from "next/image";
import Link from "next/link";
import type { Tables } from "@/lib/database.types";
import { getCategoryPath, productPath, type CategoryPathNode } from "@/lib/public-site";

type CatalogProduct = Pick<Tables<"products">, "id" | "name" | "model"> & {
  categories: (Pick<Tables<"categories">, "id" | "name" | "slug" | "parent_id"> & { status?: string }) | null;
  product_images: Pick<Tables<"product_images">, "storage_path" | "alt_text" | "is_primary">[] | null;
};

type ProductCardProps = {
  product: CatalogProduct;
  categoryPath?: string[];
  categories?: readonly CategoryPathNode[];
};

export function ProductCard({ product, categoryPath, categories }: ProductCardProps) {
  const primary = product.product_images?.find((image) => image.is_primary) ?? product.product_images?.[0];
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const imageUrl = primary && storageUrl
    ? `${storageUrl}/storage/v1/object/public/furniture-images/${primary.storage_path}`
    : null;
  const path = categoryPath?.length
    ? categoryPath
    : product.categories && categories
      ? getCategoryPath(product.categories.id, categories)
      : product.categories?.slug ? [product.categories.slug] : [];
  const href = productPath(path, product.model);

  return (
    <article className="product-card">
      <Link className="listing-product-link" href={href} aria-label={`View ${product.name}, model ${product.model}`}>
        <div className="product-image">
          {imageUrl ? (
            <Image
              className="product-photo-image"
              src={imageUrl}
              alt={primary?.alt_text?.trim() || `${product.name} furniture by ALLEX Furniture`}
              fill
              sizes="(max-width: 650px) 46vw, (max-width: 950px) 46vw, 23vw"
              unoptimized
            />
          ) : (
            <div className="product-placeholder" role="img" aria-label={`No product image available for ${product.name}`}>
              <span>ALLEX FURNITURE</span><b>{product.name.slice(0, 1)}</b><small>Image coming soon</small>
            </div>
          )}
          <span className="product-tag">{product.categories?.name ?? "Furniture"}</span>
        </div>
        <div className="product-info">
          <div><h2>{product.name}</h2><p>Model {product.model}</p></div>
          <span className="product-arrow" aria-hidden="true">↗</span>
        </div>
      </Link>
    </article>
  );
}
