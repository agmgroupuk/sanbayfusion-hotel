import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  ...pageMetadata("/"),
  metadataBase: new URL(site.url),
  title: {
    default: "Sanbay Fusion | Memberships for International Visitors",
    template: "%s · Sanbay Fusion",
  },
  applicationName: site.name,
  manifest: "/manifest.webmanifest",
  // Let file metadata add all three content-versioned icon links. Setting an
  // explicit icons object here suppresses Next's PNG/Apple file discovery.
  description: site.description,
  // Public pages declare their own canonical; private routes must not inherit '/'.
  alternates: undefined,
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION.trim() }
    : undefined,

};

export const viewport: Viewport = {
  themeColor: "#1a1712",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fontVariables} dark h-full`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
