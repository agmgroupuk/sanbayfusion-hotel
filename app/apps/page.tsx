import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Applications",
};

export default function ApplicationsPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
      <p className="text-eyebrow text-gold">Sanbay Fusion</p>
      <h1 className="mt-5 font-display text-h1 font-light">Platform</h1>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          { href: "/agents", title: "Agents", text: "AI agent conversations" },
          { href: "/tools", title: "Tools", text: "Browser-based developer utilities" },
          { href: "/labs", title: "Labs", text: "AI experiments" },
        ].map((item) => (
          <Link href={item.href} key={item.href} className="group">
            <Card className="h-full p-6 transition-colors group-hover:border-gold/60 sm:p-8">
              <h2 className="font-display text-h3">{item.title}</h2>
              <p className="mt-4 text-sm text-muted-foreground">{item.text}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
