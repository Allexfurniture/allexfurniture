import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";
import type { Database } from "@/lib/database.types";
import { SITE_URL, getCategoryPath, isSafeModelSegment, productPath } from "@/lib/public-site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: new URL("/", SITE_URL).toString(), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: new URL("/about", SITE_URL).toString(), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: new URL("/group", SITE_URL).toString(), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: new URL("/furniture", SITE_URL).toString(), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: new URL("/contact", SITE_URL).toString(), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: new URL("/privacy-policy", SITE_URL).toString(), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: new URL("/terms", SITE_URL).toString(), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !publishableKey) return entries;

  try {
    const supabase = createClient<Database>(supabaseUrl, publishableKey);
    const { data: categoryRows, error: categoryError } = await supabase
      .from("categories")
      .select("id,name,slug,parent_id,status,updated_at")
      .eq("status", "active")
      .order("name");
    if (categoryError) throw categoryError;
    const categories = categoryRows ?? [];
    const categoryUrls = new Set<string>();

    for (const category of categories) {
      const path = getCategoryPath(category.id, categories);
      if (!path.length) continue;
      const url = new URL(`/furniture/${path.map(encodeURIComponent).join("/")}`, SITE_URL).toString();
      if (categoryUrls.has(url)) continue;
      categoryUrls.add(url);
      entries.push({
        url,
        lastModified: new Date(category.updated_at),
        changeFrequency: "weekly",
        priority: path.length === 1 ? 0.8 : 0.7,
      });
    }

    const { data: productRows, error: productError } = await supabase
      .from("products")
      .select("id,model,updated_at,categories(id,status)")
      .eq("status", "active")
      .order("updated_at", { ascending: false });
    if (productError) throw productError;

    const candidateUrls = (productRows ?? []).flatMap((product) => {
      if (!isSafeModelSegment(product.model) || !product.categories || product.categories.status !== "active") return [];
      const category = categories.find((item) => item.id === product.categories?.id);
      if (!category) return [];
      const path = getCategoryPath(category.id, categories);
      if (!path.length) return [];
      return [{ url: new URL(productPath(path, product.model), SITE_URL).toString(), updatedAt: product.updated_at }];
    });
    const urlCounts = new Map<string, number>();
    for (const item of candidateUrls) urlCounts.set(item.url, (urlCounts.get(item.url) ?? 0) + 1);
    for (const item of candidateUrls) {
      if (urlCounts.get(item.url) !== 1) continue;
      entries.push({ url: item.url, lastModified: new Date(item.updatedAt), changeFrequency: "weekly", priority: 0.7 });
    }

    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("slug,updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false });
    if (!projectsError && projects?.length) {
      entries.push({ url: new URL("/projects", SITE_URL).toString(), lastModified: new Date(projects[0].updated_at), changeFrequency: "monthly", priority: 0.6 });
      for (const project of projects) {
        entries.push({ url: new URL(`/projects/${encodeURIComponent(project.slug)}`, SITE_URL).toString(), lastModified: new Date(project.updated_at), changeFrequency: "monthly", priority: 0.5 });
      }
    }
  } catch {
    // Keep the static corporate sitemap available when the public catalog is temporarily unavailable.
  }

  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  }).slice(0, 50_000);
}
