import Link from "next/link";
import { ArrowUpRight, MessageSquareText } from "lucide-react";
import { AGENTS } from "@/components/universal-chat/agentRegistry";

const demoAgent = AGENTS["tech-wizard"];

export function DemoSection() {
  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="border-b border-border/60 bg-card/20"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:px-12">
        <div className="max-w-xl">
          <p className="text-eyebrow text-gold">Live AI chat</p>
          <h2 id="demo-heading" className="mt-4 font-display text-h2 font-light">
            One shared chat. The agent you choose.
          </h2>
          <p className="mt-5 text-muted-foreground">
            The same conversation interface powers every agent. Open the live
            Tech Wizard chat, then choose another agent from the Agents page.
          </p>
          <Link
            href="/agents/tech-wizard"
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-gold-foreground transition hover:-translate-y-0.5 hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Try the live chat
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="rounded-3xl border border-gold/20 bg-card/70 p-5 shadow-2xl shadow-black/20 sm:p-8">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
                <MessageSquareText size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="font-medium text-foreground">Shared agent chat</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Existing conversation experience
                </p>
              </div>
            </div>
            <span className="rounded-full border border-gold/25 px-3 py-1 text-xs text-gold">
              Live
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-background text-xl">
                {demoAgent.icon}
              </span>
              <div>
                <p className="text-sm font-medium">{demoAgent.name}</p>
                <p className="text-xs text-muted-foreground">
                  {demoAgent.specialty}
                </p>
              </div>
            </div>
            <Link
              href="/agents/tech-wizard"
              className="text-sm text-gold transition-colors hover:text-gold/75"
            >
              Open conversation
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
