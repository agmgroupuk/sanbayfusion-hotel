import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";

const socialProfiles = [
  { id: "facebook", name: "Facebook", url: site.social.facebookUrl, icon: "f" },
  { id: "instagram", name: "Instagram", url: site.social.instagramUrl, icon: "◎" },
  { id: "tiktok", name: "TikTok", url: site.social.tiktokUrl, icon: "♪" },
  { id: "line", name: "LINE", url: site.social.lineUrl || `https://line.me/ti/p/@${site.socialHandle}`, icon: "L" },
  { id: "whatsapp", name: "WhatsApp", url: site.social.whatsappUrl || `https://wa.me/${site.phone.replace(/\s/g, "").replace("+", "")}`, icon: "✆" },
] as const;

const quickLinkItems = [
  { href: "/plans", label: "Membership Plans", icon: "✦" },
  { href: "/faq", label: "FAQ", icon: "?" },
  { href: "/catalogue", label: "Catalogue", icon: "◫" },
  { href: "/contact", label: "Contact", icon: "✉" },
  { href: "/events", label: "Private Events", icon: "✧" },
  { href: "/how-it-works", label: "How It Works", icon: "▣" },
  { href: "/delivery-areas", label: "Delivery Areas", icon: "◌" },
];

export function SiteFooter({ authenticated }: { authenticated: boolean }) {
  const joinOrDashboard = authenticated
    ? { href: "/dashboard", label: "Dashboard" }
    : { href: "/signup", label: "Join Now" };

  return (
    <footer className="border-t border-gold/30 bg-[#090807] text-gold">
      <div className="mx-auto max-w-[1320px] px-5 py-10 sm:px-8 lg:px-8 lg:py-12">
        <div className="grid gap-y-8 lg:grid-cols-[42%_58%] lg:gap-x-10 xl:gap-x-14">
          <div className="lg:border-r lg:border-gold/20 lg:pr-10 xl:pr-14">
            <div className="mb-5 flex items-center justify-start">
              <Image
                src="/brand/sanbayfusion-logo.webp"
                alt={site.name}
                width={260}
                height={130}
                priority
                className="h-auto w-[180px] object-contain sm:w-[210px] lg:w-[220px]"
              />
            </div>

            <h3 className="font-display text-[1.3rem] font-medium leading-[1.08] tracking-[-0.04em] text-gold sm:text-[1.55rem] lg:text-[1.85rem]">
              Private Hospitality, Thoughtfully Arranged.
            </h3>

            <p className="mt-4 max-w-md text-sm leading-7 text-foreground/75 sm:text-[0.94rem]">
              Membership dining and bespoke hospitality for international visitors in Thailand.
            </p>

            <div className="mt-5 text-[0.58rem] font-medium tracking-[0.26rem] text-gold/80">
              MEMBERSHIP DINING  •  PRIVATE EVENTS  •  THAILAND
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {socialProfiles.map((profile) => (
                <a
                  key={profile.id}
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${profile.name} — ${site.name}`}
                  title={`${profile.name} — ${site.name}`}
                  className="group inline-flex size-10 items-center justify-center rounded-full border border-gold/50 bg-[#110f0d] text-base text-gold transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:bg-[#16120d] hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  <span className="transition-transform duration-200 group-hover:scale-110">{profile.icon}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="lg:pl-1">
            <div className="mb-5 inline-block border-b border-gold/55 pb-2 text-[0.62rem] font-medium tracking-[0.32rem] text-gold">
              QUICK LINKS
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {quickLinkItems.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between gap-3 rounded-md border border-gold/35 bg-[#110f0d] px-3.5 py-3 text-left text-sm text-gold transition-colors duration-200 hover:border-gold/80 hover:bg-[#17130f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-gold/50 bg-[#1a160f] text-[0.75rem] text-gold">
                      {link.icon}
                    </span>
                    <span className="truncate">{link.label}</span>
                  </span>
                  <span className="text-base text-gold transition-transform duration-200 group-hover:translate-x-1">›</span>
                </Link>
              ))}

              <Link
                href={joinOrDashboard.href}
                className="group flex items-center justify-between gap-3 rounded-md border border-gold/35 bg-[#110f0d] px-3.5 py-3 text-left text-sm text-gold transition-colors duration-200 hover:border-gold/80 hover:bg-[#17130f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-gold/50 bg-[#1a160f] text-[0.75rem] text-gold">
                    ⟐
                  </span>
                  <span className="truncate">{joinOrDashboard.label}</span>
                </span>
                <span className="text-base text-gold transition-transform duration-200 group-hover:translate-x-1">›</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gold/25 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 text-[0.68rem] tracking-[0.08em] text-foreground/70 sm:flex-row">
            <p>© {new Date().getFullYear()} Sanbay Fusion. All rights reserved.</p>
            <nav aria-label="Legal links" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-gold/85">
              <Link href="/privacy-policy" className="transition-colors hover:text-gold">Privacy</Link>
              <Link href="/terms-and-conditions" className="transition-colors hover:text-gold">Terms</Link>
              <Link href="/cookie-policy" className="transition-colors hover:text-gold">Cookies</Link>
              <Link href="/accessibility" className="transition-colors hover:text-gold">Accessibility</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
