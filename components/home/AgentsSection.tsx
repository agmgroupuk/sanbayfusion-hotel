import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AGENTS } from "@/components/universal-chat/agentRegistry";

const agents = Object.entries(AGENTS);

export function AgentsSection() {
  return (
    <section id="agents" aria-labelledby="agents-heading" className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-eyebrow text-gold">Agents</p>
            <h2 id="agents-heading" className="mt-4 font-display text-h2 font-light">
              A specialist for every conversation.
            </h2>
          </div>
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 text-sm text-gold transition-colors hover:text-gold/75"
          >
            Explore all agents
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <p className="mb-7 max-w-2xl text-sm text-muted-foreground">
          Browse the agents already in the platform. Each opens the shared chat
          with that agent selected.
        </p>
      </div>

      <div
        className="home-agent-carousel"
        role="region"
        aria-label="Agent carousel"
      >
        <div className="home-agent-carousel__track flex w-max">
          {[false, true].map((duplicate) => (
            <div
              key={duplicate ? "duplicate" : "agents"}
              aria-hidden={duplicate}
              className="flex shrink-0 gap-4 pr-4"
            >
              {agents.map(([id, agent]) => (
                <Link
                  key={`${duplicate ? "copy-" : ""}${id}`}
                  href={`/agents/${id}`}
                  tabIndex={duplicate ? -1 : undefined}
                  className="home-agent-carousel__card group flex w-[min(82vw,20rem)] shrink-0 flex-col rounded-2xl border border-border bg-card/70 p-5 transition-colors hover:border-gold/50 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-12 place-items-center rounded-xl border border-gold/20 bg-gold/10 text-2xl">
                      {agent.icon}
                    </span>
                    <span className="rounded-full border border-border px-3 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                      {agent.category}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl transition-colors group-hover:text-gold">
                    {agent.name}
                  </h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
                    {agent.specialty}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-gold">
                    Talk to {agent.name}
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
