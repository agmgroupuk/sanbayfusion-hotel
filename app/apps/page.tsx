import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Applications",
};

export default function ApplicationsPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
      <p className="text-eyebrow text-gold">Sanbay Fusion</p>
      <h1 className="mt-5 font-display text-h1 font-light">Applications</h1>
      <Card className="mt-10 max-w-3xl p-6 sm:p-8">
        <p className="text-foreground/75">
          Applications will appear here after their existing projects are
          provided and integrated.
        </p>
      </Card>
    </section>
  );
}
