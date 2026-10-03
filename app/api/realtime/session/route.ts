import { NextRequest, NextResponse } from "next/server";
import { AGENTS } from "@/components/universal-chat/agentRegistry";
import { getCurrentUser, hashToken } from "@/lib/auth";

export const runtime = "nodejs";

const voices = new Set([
  "alloy",
  "echo",
  "shimmer",
  "ash",
  "ballad",
  "coral",
  "sage",
  "verse",
]);

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Realtime voice is not configured on this deployment." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const agentId = "agentId" in body && typeof body.agentId === "string" ? body.agentId : "";
  const agent = AGENTS[agentId];
  if (!agent) return NextResponse.json({ error: "Unknown agent." }, { status: 400 });
  const voice =
    "voice" in body && typeof body.voice === "string" && voices.has(body.voice)
      ? body.voice
      : "alloy";
  const model = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1";
  if (!/^[a-zA-Z0-9._:-]{1,128}$/.test(model)) {
    return NextResponse.json({ error: "Realtime model configuration is invalid." }, { status: 500 });
  }
  const instructions = `You are ${agent.name}, an AI assistant focused on ${agent.specialty}. Keep spoken responses concise and conversational.`;

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": hashToken(user.id),
      },
      body: JSON.stringify({
        expires_after: { seconds: 600 },
        session: {
          type: "realtime",
          model,
          instructions,
          output_modalities: ["audio", "text"],
          audio: {
            input: {
              format: { type: "audio/pcm", rate: 24000 },
              transcription: { model: "gpt-4o-mini-transcribe" },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 600,
              },
              noise_reduction: { type: "near_field" },
            },
            output: {
              format: { type: "audio/pcm", rate: 24000 },
              voice,
            },
          },
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      console.error("Realtime token creation failed with status:", response.status);
      return NextResponse.json(
        { error: "Realtime voice could not be started. Check the provider configuration." },
        { status: response.status === 429 ? 429 : 503 },
      );
    }

    const result: unknown = await response.json();
    if (typeof result !== "object" || result === null || !("client_secret" in result)) {
      throw new Error("Realtime provider returned an invalid client secret response.");
    }
    const secret = result.client_secret;
    const clientSecret =
      typeof secret === "string"
        ? secret
        : typeof secret === "object" &&
            secret !== null &&
            "value" in secret &&
            typeof secret.value === "string"
          ? secret.value
          : "";
    if (!clientSecret) {
      throw new Error("Realtime provider did not return a usable client secret.");
    }

    return NextResponse.json(
      { clientSecret, model, agent: { name: agent.name, instructions, voice } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Realtime session creation failed:", error);
    return NextResponse.json(
      { error: "Realtime voice could not be started. Please try again." },
      { status: 503 },
    );
  }
}
