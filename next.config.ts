import type { NextConfig } from "next";

const serverActionAllowedOrigins = process.env.NODE_ENV === "development"
  ? [`localhost:${process.env.PORT || "3000"}`]
  : [];

const nextConfig: NextConfig = {
  /* config options here */
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
