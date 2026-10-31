import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";
import type { Database } from "@/lib/database.types";

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
      url: new URL("/furniture", siteUrl).toString(),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: new URL("/contact", siteUrl).toString(),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: new URL("/projects", siteUrl).toString(),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !publishableKey) return entries;

  try {
    const supabase = createClient<Database>(supabaseUrl, publishableKey);
    const pageSize = 500;
    for (let offset = 0; offset < 50_000; offset += pageSize) {
      const { data, error } = await supabase
        .from("products")
        .select("model,created_at,categories(slug,status)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error || !data?.length) break;

      for (const product of data) {
        if (entries.length >= 50_000) break;
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
      if (data.length < pageSize || entries.length >= 50_000) break;
    }

    let remaining = Math.max(0, 50_000 - entries.length);
    for (let offset = 0; remaining > 0 && offset < 50_000; offset += pageSize) {
      const { data } = await supabase
        .from("projects")
        .select("slug,created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .range(offset, offset + Math.min(pageSize, remaining) - 1);
      if (!data?.length) break;
      for (const project of data) {
        entries.push({
          url: new URL(`/projects/${encodeURIComponent(project.slug)}`, siteUrl).toString(),
          lastModified: new Date(project.created_at),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
      remaining = 50_000 - entries.length;
      if (data.length < pageSize) break;
    }
  } catch {
    // Keep the core sitemap available when the catalog API is temporarily unavailable.
  }

  return entries;
}
