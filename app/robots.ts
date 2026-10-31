import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://allexfurniture.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/contact", "/furniture/"],
      disallow: ["/admin/"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl,
  };
}
