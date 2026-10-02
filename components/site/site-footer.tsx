"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { site, navLinks } from "@/lib/site";

const socialProfiles = [
  { id: "facebook", name: "Facebook", url: site.social.facebookUrl, icon: "facebook" },
  { id: "instagram", name: "Instagram", url: site.social.instagramUrl, icon: "instagram" },
  { id: "tiktok", name: "TikTok", url: site.social.tiktokUrl, icon: "tiktok" },
  { id: "line", name: "LINE", url: site.social.lineUrl || `https://line.me/ti/p/@${site.socialHandle}`, icon: "line" },
  { id: "whatsapp", name: "WhatsApp", url: site.social.whatsappUrl || `https://wa.me/${site.phone.replace(/\s/g, "").replace("+", "")}`, icon: "whatsapp" },
] as const;

const quickLinks = [
  { href: "/plans", label: "Membership Plans", icon: "✦" },
  { href: "/catalogue", label: "Catalogue", icon: "◈" },
  { href: "/events", label: "Private Events", icon: "◆" },
  { href: "/delivery-areas", label: "Delivery Areas", icon: "◉" },
  { href: "/faq", label: "FAQ", icon: "◐" },
  { href: "/contact", label: "Contact", icon: "✉" },
  { href: "/how-it-works", label: "How It Works", icon: "◌" },
];

export function SiteFooter() {
  const { data: session } = useSession();
  const isAuthed = !!session?.user;

  const joinOrDashboard = isAuthed
    ? { href: "/dashboard", label: "Dashboard" }
    : { href: "/join", label: "Join Now" };

  return (
    <footer className="border-t border-gold/20 bg-[#0a0907]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        <div className="grid gap-x-16 gap-y-14 lg:grid-cols-2">
          {/* LEFT — BRAND SECTION */}
          <div className="max-w-lg">
            <div className="mb-6">
              <Image
                src="/brand/sanbayfusion-logo.webp"
                alt={site.name}
                width={260}
                height={130}
                className="h-auto w-[200px] object-contain lg:w-[240px]"
                priority
              />
            </div>

            <h3 className="font-serif text-[21px] leading-tight tracking-[-0.01em] text-[#d4af37]">
              Private Hospitality, Thoughtfully Arranged.
            </h3>

            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#a38f6b]">
              Membership dining and bespoke hospitality for international visitors in Thailand.
            </p>

            <div className="mt-4 text-[11px] font-medium tracking-[3px] text-[#d4af37]/80">
              MEMBERSHIP DINING  •  PRIVATE EVENTS  •  THAILAND
            </div>

            {/* SOCIAL ICONS */}
            <div className="mt-8 flex flex-wrap gap-3">
              {socialProfiles.map((profile) => (
                <a
                  key={profile.id}
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${profile.name} — Sanbay Fusion`}
                  className="group inline-flex size-11 items-center justify-center rounded-full border border-[#d4af37]/40 bg-[#11100d] text-[#d4af37] transition-all hover:border-[#d4af37] hover:bg-[#d4af37]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4af37]"
                >
                  <span className="text-[15px] transition-transform group-hover:scale-110">
                    {profile.icon === "facebook" && "f"}
                    {profile.icon === "instagram" && "◎"}
                    {profile.icon === "tiktok" && "♪"}
                    {profile.icon === "line" && "L"}
                    {profile.icon === "whatsapp" && "☎"}
                  </span>
                </a>
              ))}

              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                aria-label="Call Sanbay Fusion"
                className="group inline-flex size-11 items-center justify-center rounded-full border border-[#d4af37]/40 bg-[#11100d] text-[#d4af37] transition-all hover:border-[#d4af37] hover:bg-[#d4af37]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4af37]"
              >
                <span className="text-[15px]">☎</span>
              </a>

              <a
                href={`mailto:${site.email}`}
                aria-label="Email Sanbay Fusion"
                className="group inline-flex size-11 items-center justify-center rounded-full border border-[#d4af37]/40 bg-[#11100d] text-[#d4af37] transition-all hover:border-[#d4af37] hover:bg-[#d4af37]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4af37]"
              >
                <span className="text-[15px]">✉</span>
              </a>
            </div>
          </div>

          {/* VERTICAL GOLD DIVIDER (desktop) */}
          <div className="hidden lg:block" aria-hidden="true">
            <div className="h-full w-px bg-gradient-to-b from-transparent via-[#d4af37]/30 to-transparent" />
          </div>

          {/* RIGHT — QUICK LINKS */}
          <div>
            <div className="mb-6 text-[11px] font-medium tracking-[3px] text-[#d4af37]/70">QUICK LINKS</div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {quickLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="group flex items-center justify-between rounded-md border border-[#d4af37]/25 bg-[#11100d] px-5 py-[13px] text-sm text-[#d4af37] transition-all hover:border-[#d4af37]/60 hover:bg-[#1a1814] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4af37]"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[#d4af37]/60">{link.icon}</span>
                    <span>{link.label}</span>
                  </span>
                  <span className="text-[#d4af37]/50 transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              ))}

              {/* Join / Dashboard */}
              <Link
                href={joinOrDashboard.href}
                className="group col-span-1 flex items-center justify-between rounded-md border border-[#d4af37]/25 bg-[#11100d] px-5 py-[13px] text-sm text-[#d4af37] transition-all hover:border-[#d4af37]/60 hover:bg-[#1a1814] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4af37] sm:col-span-2"
              >
                <span className="flex items-center gap-3">
                  <span className="text-[#d4af37]/60">⟐</span>
                  <span>{joinOrDashboard.label}</span>
                </span>
                <span className="text-[#d4af37]/50 transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM LEGAL BAR */}
        <div className="mt-16 border-t border-[#d4af37]/20 pt-8">
          <div className="flex flex-col items-center justify-between gap-y-3 text-xs text-[#a38f6b] sm:flex-row">
            <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
            <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-6">
              <Link href="/privacy-policy" className="transition-colors hover:text-[#d4af37]">Privacy</Link>
              <Link href="/terms-and-conditions" className="transition-colors hover:text-[#d4af37]">Terms</Link>
              <Link href="/cookie-policy" className="transition-colors hover:text-[#d4af37]">Cookies</Link>
              <Link href="/accessibility" className="transition-colors hover:text-[#d4af37]">Accessibility</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
