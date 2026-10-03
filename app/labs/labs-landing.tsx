"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, FlaskConical, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { verifySession } from "@/lib/session-client";

const experiments = [
  {
    id: "battle-arena",
    title: "Battle Arena",
    category: "Compare",
    summary: "Run one prompt through two configured AI providers and cast a vote.",
  },
  {
    id: "debate-arena",
    title: "Debate Arena",
    category: "Compare",
    summary: "Explore balanced arguments for two positions on a topic.",
  },
  {
    id: "story-weaver",
    title: "Story Weaver",
    category: "Create",
    summary: "Draft or continue a short story in a chosen genre.",
  },
  {
    id: "dream-interpreter",
    title: "Dream Interpreter",
    category: "Reflect",
    summary: "Explore possible symbols and emotional themes without diagnosis.",
  },
  {
    id: "personality-mirror",
    title: "Personality Mirror",
    category: "Reflect",
    summary: "Review observable communication patterns in a writing sample.",
  },
  {
    id: "emotion-visualizer",
    title: "Emotion Visualizer",
    category: "Analyze",
    summary: "Read the emotional tone and sentiment of a text.",
  },
  {
    id: "future-predictor",
    title: "Future Predictor",
    category: "Explore",
    summary: "Consider plausible scenarios, drivers, and uncertainties.",
  },
];

type Activity = {
  totalRuns: number;
  recentRuns: Array<{ id: string; labId: string; createdAt: string }>;
};

export function LabsLanding() {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadActivity() {
      const session = await verifySession();
      if (!session.valid || cancelled) return;
      setIsAuthenticated(true);

      const response = await fetch("/api/lab/analytics", {
        credentials: "include",
        cache: "no-store",
      });
      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!response.ok) {
        throw new Error("Lab activity could not be loaded.");
      }

      const result = (await response.json()) as Activity;
      if (!cancelled) setActivity(result);
    }
    void loadActivity().catch((error: unknown) => {
      if (!cancelled) console.error("Unable to load Lab activity.", error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
      <section className="relative overflow-hidden rounded-3xl border border-gold/25 bg-card/70 px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.22em] text-gold">
            <FlaskConical size={17} aria-hidden="true" />
            Sanbay Fusion Labs
          </p>
          <h1 className="mt-5 font-display text-h1 font-light leading-tight">
            Ideas, tested.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Hands-on text experiments powered by the AI providers configured for
            this platform. Provider runs are made on the server and saved to
            your account.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-background/70 px-4 py-2 text-sm text-foreground/80">
              <Sparkles size={15} className="text-gold" aria-hidden="true" />
              {activity ? `${activity.totalRuns} saved runs` : "Account activity"}
            </span>
            {!isAuthenticated && (
              <Link
                href="/auth/signin?redirect=%2Flabs"
                className="text-sm text-muted-foreground underline decoration-gold/50 underline-offset-4 transition-colors hover:text-gold"
              >
                Sign in to run an experiment
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-gold">Experiments</p>
            <h2 className="mt-2 font-display text-h3">Choose a Lab</h2>
          </div>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Text-based experiments · authenticated · provider-backed
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {experiments.map((experiment, index) => (
            <Link
              href={`/labs/${experiment.id}`}
              key={experiment.id}
              className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Card className="h-full p-6 transition-colors group-hover:border-gold/60 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs uppercase tracking-[0.16em] text-gold/80">
                    {experiment.category}
                  </span>
                  <span className="font-display text-lg text-gold/55">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-2xl">{experiment.title}</h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
                  {experiment.summary}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold">
                  Open experiment
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Card>
            </Link>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-5 text-muted-foreground">
          Dream and writing analysis are reflective tools, not mental-health
          assessments. Future scenarios are speculative, not factual or
          financial advice. Image, music, and voice experiments are not shown
          until their provider configuration is verified.
        </p>
      </section>
    </main>
  );
}
