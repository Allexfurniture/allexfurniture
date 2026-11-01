import type { NextConfig } from "next";

const serverActionAllowedOrigins = process.env.NODE_ENV === "development"
  ? [`localhost:${process.env.PORT || "3000"}`]
  : [];

const supabaseImageHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseImageHost ? [{ protocol: "https" as const, hostname: supabaseImageHost, pathname: "/storage/v1/object/public/furniture-images/**" }] : [],
  },
  experimental: {
    agentFeedback: true,
    serverActions: { bodySizeLimit: "10mb", allowedOrigins: serverActionAllowedOrigins },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
