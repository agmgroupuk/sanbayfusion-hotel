import React from "react";
import Link from "next/link";
import { site } from "@/lib/site";

interface OverlayProps {
  active: boolean;
  onActivate: () => void;
  agentName?: string;
}

const destinations = [
  { href: "/", label: "Home" },
  { href: "/agents", label: "Agents" },
  { href: "/tools", label: "Tools" },
  { href: "/labs", label: "Labs" },
  { href: "/apps", label: "Apps" },
];

const Overlay: React.FC<OverlayProps> = ({
  active,
  onActivate,
  agentName = "Neural Companion",
}) => {
  const buttonText =
    agentName && agentName !== "Neural Companion"
      ? `Meet ${agentName}`
      : "Enter workspace";

  return (
    <div
      aria-hidden={!active}
      inert={!active}
      className={`fixed inset-0 z-[150] flex flex-col overflow-hidden bg-background text-foreground transition-[opacity,transform] duration-700 ease-in-out ${
        active
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-4 opacity-0"
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(207,170,95,0.10),transparent_48%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 rounded-3xl border border-gold/15 sm:inset-8"
      />

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col items-center justify-center overflow-y-auto px-5 py-8 text-center">
        <div
          aria-hidden="true"
          className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-gold/35 bg-gold/10 font-display text-base font-semibold text-gold shadow-[0_0_40px_rgba(207,170,95,0.08)]"
        >
          SF
        </div>

        <h1 className="whitespace-nowrap font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {site.name}
        </h1>
        <div aria-hidden="true" className="mt-5 h-px w-14 bg-gold/70" />

        <button
          type="button"
          onClick={onActivate}
          className="mt-8 rounded-full border border-gold bg-gold px-8 py-3.5 text-sm font-semibold tracking-wide text-gold-foreground shadow-lg shadow-gold/10 transition-all hover:-translate-y-0.5 hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"
        >
          {buttonText}
        </button>

        <nav
          aria-label="Platform destinations"
          className="mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5"
        >
          {destinations.map((destination) => (
            <Link
              key={destination.href}
              href={destination.href}
              className="rounded-full border border-border/80 bg-card/60 px-4 py-2 text-xs tracking-wide text-foreground/75 transition-colors hover:border-gold/50 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {destination.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Overlay;
