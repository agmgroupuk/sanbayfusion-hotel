import Link from "next/link";
import { AGENTS } from "@/components/universal-chat/agentRegistry";

export const metadata = { title: "Agents" };

export default function AgentsPage() {
  const agents = Object.entries(AGENTS);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-eyebrow text-gold">Sanbay Fusion platform</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-h1">Agents</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Choose an agent to start a conversation directly.
          </p>
        </div>
        <Link className="text-sm text-gold transition-colors hover:text-gold/75" href="/apps">
          Back to platform
        </Link>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map(([id, agent]) => (
          <Link
            key={id}
            href={`/agents/${id}`}
            className="group rounded-2xl border border-border bg-card/70 p-5 transition-all hover:border-gold/60 hover:bg-card"
          >
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-2xl">
                {agent.icon}
              </span>
              <div>
                <h2 className="font-display text-lg text-foreground transition-colors group-hover:text-gold">
                  {agent.name}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">{agent.category}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{agent.specialty}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
