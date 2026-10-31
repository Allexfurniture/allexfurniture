import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

type SitemapProduct = {
  model: string;
  created_at: string;
  categories: { slug: string; status: string } | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://allexfurniture.vercel.app";
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: new URL("/", siteUrl).toString(),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/contact", siteUrl).toString(),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) return entries;

  try {
    const supabase = createClient(supabaseUrl, publishableKey);
    const { data } = await supabase
      .from("products")
      .select("model,created_at,categories(slug,status)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(500);

    for (const product of (data ?? []) as unknown as SitemapProduct[]) {
      if (!product.categories || product.categories.status !== "active") continue;
      entries.push({
        url: new URL(
          `/furniture/${encodeURIComponent(product.categories.slug)}/${encodeURIComponent(product.model)}`,
          siteUrl,
        ).toString(),
        lastModified: new Date(product.created_at),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // Keep the core sitemap available when the catalog API is temporarily unavailable.
  }

  return entries;
}
