import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next.js doesn't infer a parent
  // directory when a stray lockfile exists in the home folder.
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      // Supabase Storage (property images, avatars, docs)
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/**" },
      // Seed/demo imagery
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
