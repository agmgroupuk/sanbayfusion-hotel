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
  async headers() {
    // Branding aliases must revalidate instead of inheriting a CDN's default
    // static-file TTL. Content-versioned metadata links also refresh browsers.
    return [
      "/favicon.ico", "/icon.png", "/icon", "/favicon.png",
      "/apple-icon.png", "/apple-icon", "/apple-touch-icon.png",
      "/apple-touch-icon-precomposed.png", "/manifest.webmanifest",
      "/site.webmanifest", "/manifest.json", "/brand/sanbayfusion-icon-:size.png",
    ].map(source => ({
      source,
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "CDN-Cache-Control", value: "no-store" },
        { key: "Cloudflare-CDN-Cache-Control", value: "no-store" },
      ],
    }));
  },
  async rewrites() {
    return [
      { source: "/icon", destination: "/icon.png" },
      { source: "/apple-icon", destination: "/apple-icon.png" },
      { source: "/favicon.png", destination: "/icon.png" },
      { source: "/apple-touch-icon.png", destination: "/apple-icon.png" },
      { source: "/apple-touch-icon-precomposed.png", destination: "/apple-icon.png" },
      { source: "/site.webmanifest", destination: "/manifest.webmanifest" },
      { source: "/manifest.json", destination: "/manifest.webmanifest" },
    ];
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
