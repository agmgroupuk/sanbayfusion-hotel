import Link from "next/link";
import Image from "next/image";
import { navLinks, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex min-w-0 max-w-sm flex-col items-start">
            <Image src="/brand/sanbayfusion-logo.webp" alt={site.name} width={240} height={120} sizes="240px" className="block h-auto w-48 max-w-full object-contain object-left sm:w-56" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gold">{site.tagline}.</p>
          </div>

          <div>
            <p className="text-eyebrow text-muted-foreground">Visit</p>
            <address className="mt-4 space-y-1 text-sm not-italic text-foreground/80">
              <p>{site.address.line1}</p>
              <p>{site.address.line2}</p>
              <p className="pt-2">
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="transition-colors hover:text-gold">
                  {site.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${site.email}`} className="transition-colors hover:text-gold">
                  {site.email}
                </a>
              </p>
            </address>
          </div>

          <div>
            <p className="text-eyebrow text-muted-foreground">Explore</p>
            <ul className="mt-4 flex max-w-xl flex-wrap gap-x-5 gap-y-3 text-sm text-foreground/75">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/reservations" className="text-gold hover:text-gold/80">
                  Reservations
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border/50 pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy-policy" className="transition-colors hover:text-gold">
              Privacy
            </Link>
            <Link href="/terms-and-conditions" className="transition-colors hover:text-gold">
              Terms
            </Link>
            <Link href="/cookie-policy" className="transition-colors hover:text-gold">
              Cookies
            </Link>
            <Link href="/accessibility" className="transition-colors hover:text-gold">
              Accessibility
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
