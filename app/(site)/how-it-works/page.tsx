import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, PackageCheck, RefreshCw, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "How It Works",
  description: "How Sanbay Fusion food delivery memberships work from plan selection to scheduled delivery.",
  alternates: { canonical: "/how-it-works" },
};

const steps = [
  ["01", "Choose a membership", "Select the plan that matches your household, schedule, and appetite."],
  ["02", "Pick your delivery days", "We show available dates and delivery windows for your area before you commit."],
  ["03", "Receive your food package", "Your seasonal meals, snacks, drinks, or pantry products arrive on the agreed schedule."],
  ["04", "Adjust the next cycle", "Update preferences, pause, or change future delivery dates before the next cycle begins."],
] as const;

const icons = [CalendarDays, Sparkles, PackageCheck, RefreshCw];

export default function HowItWorksPage() {
  return (
    <div className="pb-28">
      <PageHeader eyebrow="The membership rhythm" title="Simple by design" lead="The service is built around recurring food delivery, not one-off ordering. You choose the rhythm once, then we prepare the next package." />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {steps.map(([number, title, description], index) => {
            const Icon = icons[index];
            return <Reveal key={number} variant="up" delay={index * 0.06}><article className="h-full rounded-sm border border-border/60 bg-card/30 p-8"><div className="flex items-center justify-between text-gold"><span className="text-eyebrow">{number}</span><Icon className="size-5" /></div><h2 className="mt-10 font-display text-3xl font-light italic">{title}</h2><p className="mt-4 text-base leading-relaxed text-foreground/75">{description}</p></article></Reveal>;
          })}
        </div>
        <Reveal variant="up" className="mx-auto mt-20 max-w-3xl border-y border-border/60 py-10 text-center"><p className="text-eyebrow text-gold">A clear promise</p><p className="lead mt-5 text-base text-foreground/80">Every membership shows what is included, how many delivery days you receive, and what happens next. No hidden one-off ordering flow.</p><Link href="/plans" className="mt-8 inline-flex rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground">View Membership Plans</Link></Reveal>
      </div>
    </div>
  );
}