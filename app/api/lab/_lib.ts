import type { Prisma } from "@prisma/client";
import { AiProviderError, completionText, firstConfiguredProvider, requestChatCompletion, validateChatInput } from "@/lib/ai-provider";
import type { ChatInput } from "@/lib/ai-provider";
import prisma from "@/lib/prisma";

export class LabApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "LabApiError";
  }
}

export type LabProvider = ChatInput["provider"];

export const LAB_PROVIDERS: Array<{
  id: LabProvider;
  label: string;
  env: string[];
}> = [
  { id: "openai", label: "OpenAI", env: ["OPENAI_API_KEY"] },
  { id: "anthropic", label: "Anthropic", env: ["ANTHROPIC_API_KEY"] },
  { id: "mistral", label: "Mistral", env: ["MISTRAL_API_KEY"] },
  { id: "gemini", label: "Gemini", env: ["GEMINI_API_KEY", "GOOGLE_API_KEY"] },
  { id: "xai", label: "xAI", env: ["XAI_API_KEY"] },
  { id: "groq", label: "Groq", env: ["GROQ_API_KEY"] },
  { id: "cerebras", label: "Cerebras", env: ["CEREBRAS_API_KEY"] },
];

export const BATTLE_MODELS: Record<
  LabProvider,
  { label: string; model: string }
> = {
  openai: { label: "OpenAI · GPT-4o mini", model: "gpt-4o-mini" },
  anthropic: {
    label: "Anthropic · Claude Haiku",
    model: "claude-3-5-haiku-latest",
  },
  mistral: { label: "Mistral · Small", model: "mistral-small-latest" },
  gemini: { label: "Google · Gemini Flash", model: "gemini-2.0-flash" },
  xai: { label: "xAI · Grok mini", model: "grok-3-mini" },
  groq: {
    label: "Groq · Llama 3.3",
    model: "llama-3.3-70b-versatile",
  },
  cerebras: { label: "Cerebras · Llama 3.3", model: "llama-3.3-70b" },
};

export function configuredLabProviders() {
  return LAB_PROVIDERS.filter(({ env }) =>
    env.some((name) => Boolean(process.env[name])),
  );
}

export async function readJsonBody(
  request: Request,
  maxBytes = 16_000,
): Promise<Record<string, unknown>> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > maxBytes) {
    throw new LabApiError("Request body is too large.", 413);
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    throw new LabApiError("Could not read request body.", 400);
  }
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new LabApiError("Request body is too large.", 413);
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new LabApiError("Request body must be valid JSON.", 400);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new LabApiError("Request body must be a JSON object.", 400);
  }
  return value as Record<string, unknown>;
}

export function requiredText(
  body: Record<string, unknown>,
  field: string,
  maxLength = 8_000,
  minLength = 1,
): string {
  const value = typeof body[field] === "string" ? body[field].trim() : "";
  if (value.length < minLength || value.length > maxLength) {
    throw new LabApiError(
      `${field} must contain ${minLength}–${maxLength} characters.`,
      400,
    );
  }
  return value;
}

export function optionalText(
  body: Record<string, unknown>,
  field: string,
  maxLength = 8_000,
): string | undefined {
  const raw = body[field];
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (typeof raw !== "string" || raw.length > maxLength) {
    throw new LabApiError(`${field} must be at most ${maxLength} characters.`, 400);
  }
  const value = raw.trim();
  return value || undefined;
}

export function enumValue<T extends string>(
  value: unknown,
  options: readonly T[],
  field: string,
  fallback: T,
): T {
  if (value === undefined || value === "") return fallback;
  if (typeof value !== "string" || !options.includes(value as T)) {
    throw new LabApiError(`Invalid ${field}.`, 400);
  }
  return value as T;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof LabApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof AiProviderError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json(
    { error: "The Lab request could not be completed. Please try again." },
    { status: 502 },
  );
}

export async function requestLabCompletion(
  message: string,
  systemPrompt: string,
  options: { provider?: LabProvider; model?: string; maxTokens?: number } = {},
): Promise<{ text: string; provider: LabProvider }> {
  const provider = options.provider ?? firstConfiguredProvider();
  if (!provider) {
    throw new LabApiError(
      "No supported AI provider is configured for Labs on this deployment.",
      503,
    );
  }

  const input = validateChatInput({
    message,
    systemPrompt,
    provider,
    model: options.model ?? "",
    conversationHistory: [],
    temperature: 0.7,
    maxTokens: options.maxTokens ?? 1800,
    activeTool: "none",
  });
  const response = await requestChatCompletion(
    input,
    false,
    AbortSignal.timeout(45_000),
  );
  const text = (await completionText(response, input.provider)).trim();
  if (!text) {
    throw new LabApiError("The AI provider returned an empty response.", 502);
  }
  return { text, provider: input.provider };
}

export async function createLabRun(
  userId: string | null,
  labId: string,
  input: Record<string, string>,
  provider: string,
): Promise<{ id: string | null; warning?: string }> {
  if (!process.env.DATABASE_URL) {
    return {
      id: null,
      warning: "Database is not configured; this run will not be saved.",
    };
  }

  try {
    const run = await prisma.labRun.create({
      data: {
        ...(userId ? { userId } : {}),
        labId,
        input: input as Prisma.InputJsonObject,
        output: { status: "processing" },
        provider,
      },
    });
    return { id: run.id };
  } catch (error) {
    console.error(
      "[lab] Run persistence failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return {
      id: null,
      warning: "Lab run history could not be saved; the provider result will still be returned.",
    };
  }
}

export async function completeLabRun(
  runId: string | null,
  output: Record<string, unknown>,
): Promise<boolean> {
  if (!runId || !process.env.DATABASE_URL) return false;
  try {
    await prisma.labRun.update({
      where: { id: runId },
      data: { output: output as Prisma.InputJsonObject },
    });
    return true;
  } catch (error) {
    console.error(
      "[lab] Run result persistence failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return false;
  }
}

export async function markLabRunFailed(runId: string | null, message: string) {
  if (!runId || !process.env.DATABASE_URL) return;
  try {
    await prisma.labRun.update({
      where: { id: runId },
      data: { output: { status: "failed", error: message } },
    });
  } catch (error) {
    console.error(
      "[lab] Failed to record unsuccessful run:",
      error instanceof Error ? error.name : "Unknown error",
    );
  }
}

export async function updateVote(
  userId: string | null,
  battleId: string,
  choice: string,
  expectedLabId: "battle-arena" | "debate-arena",
) {
  if (userId) {
    await prisma.labVote.upsert({
      where: { userId_battleId: { userId, battleId } },
      update: { choice },
      create: { userId, battleId, choice },
    });
  } else {
    await prisma.labVote.create({ data: { battleId, choice } });
  }

  const rows = await prisma.labVote.groupBy({
    by: ["choice"],
    where: { battleId },
    _count: { _all: true },
  });
  const votes: Record<string, number> = {};
  for (const row of rows) votes[row.choice] = row._count._all;
  return { votes, labId: expectedLabId };
}

export async function votesForLab(labId: "battle-arena" | "debate-arena") {
  const runs = await prisma.labRun.findMany({
    where: { labId, userId: null },
    orderBy: { createdAt: "desc" },
    take: 1_000,
    select: { id: true },
  });
  if (!runs.length) return {};

  const rows = await prisma.labVote.groupBy({
    by: ["battleId", "choice"],
    where: {
      battleId: { in: runs.map((run) => run.id) },
    },
    _count: { _all: true },
  });
  const votes: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    votes[row.battleId] ??= {};
    votes[row.battleId][row.choice] = row._count._all;
  }
  return votes;
}
