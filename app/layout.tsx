import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/lib/site";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Sanbay Fusion Bar & Restaurant",
    template: "%s · Sanbay Fusion",
  },
  description: site.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "Sanbay Fusion Bar & Restaurant",
    description: site.description,
    siteName: "Sanbay Fusion",
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanbay Fusion Bar & Restaurant",
    description: site.description,
  },
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
