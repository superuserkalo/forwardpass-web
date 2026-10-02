import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async rewrites() {
    // Markdown copies of issues and articles sit next to their HTML pages.
    return [{ source: "/archive/:kind/:slug.md", destination: "/markdown/:kind/:slug" }];
  },
};

export default nextConfig;
