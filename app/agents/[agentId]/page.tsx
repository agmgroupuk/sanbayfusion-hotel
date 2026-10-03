import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import App from "@/components/universal-chat/App";
import { AGENTS } from "@/components/universal-chat/agentRegistry";
import { getCurrentUserFromToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export default async function AgentChatPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = AGENTS[agentId];
  if (!agent) notFound();

  const cookieStore = await cookies();
  const user = await getCurrentUserFromToken(
    cookieStore.get(SESSION_COOKIE)?.value,
  );
  if (!user) {
    redirect(`/auth/signin?redirect=${encodeURIComponent(`/agents/${agentId}`)}`);
  }

  return (
    <App
      initialAgentId={agentId}
      initialAgentName={agent.name}
      initialSystemPrompt={`You are ${agent.name}, an AI assistant focused on ${agent.specialty}.`}
      initialProvider="openai"
      initialModel="gpt-4o-mini"
      agentIcon={agent.icon}
      agentSpecialty={agent.specialty}
      agentColor={agent.color}
      agentCategory={agent.category}
    />
  );
}
