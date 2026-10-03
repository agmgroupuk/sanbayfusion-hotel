import { notFound } from "next/navigation";
import App from "@/components/universal-chat/App";
import { AGENTS } from "@/components/universal-chat/agentRegistry";

export default async function AgentChatPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = AGENTS[agentId];
  if (!agent) notFound();

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
