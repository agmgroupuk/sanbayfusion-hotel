import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { RestaurantJsonLd } from "@/components/site/restaurant-jsonld";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SmoothScroll>
      <RestaurantJsonLd />
      <ScrollProgress />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-eyebrow focus:text-gold-foreground"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </SmoothScroll>
  );
}
