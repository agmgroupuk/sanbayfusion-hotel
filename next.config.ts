import type { NextConfig } from "next";
import { trustedPublicOrigins } from "./lib/request-origin";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: trustedPublicOrigins().map(origin => new URL(origin).host) },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  async redirects() {
    return [
      { source: "/terms", destination: "/terms-and-conditions", permanent: true },
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/cookies", destination: "/cookie-policy", permanent: true },
      { source: "/accessibility-statement", destination: "/accessibility", permanent: true },
    ];
  },
};

export default nextConfig;
