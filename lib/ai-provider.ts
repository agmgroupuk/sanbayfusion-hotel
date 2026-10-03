import type { ChatMessage } from "@/components/universal-chat/services/chatService";

type ProviderId =
  | "openai"
  | "anthropic"
  | "mistral"
  | "xai"
  | "cerebras"
  | "groq"
  | "gemini";

export type ChatInput = {
  message: string;
  conversationHistory: ChatMessage[];
  systemPrompt: string;
  provider: ProviderId;
  model: string;
  temperature: number;
  maxTokens: number;
  imageData?: { base64: string; mimeType: string };
  activeTool: "none" | "thinking";
};

type ProviderConfig = {
  key: string | undefined;
  endpoint: string;
  model: string;
  protocol: "openai" | "anthropic" | "gemini";
};

type ProviderRequest = {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

function providerConfig(provider: ProviderId): ProviderConfig {
  const configs: Record<ProviderId, ProviderConfig> = {
    openai: {
      key: process.env.OPENAI_API_KEY,
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini",
      protocol: "openai",
    },
    anthropic: {
      key: process.env.ANTHROPIC_API_KEY,
      endpoint: "https://api.anthropic.com/v1/messages",
      model: "claude-3-5-haiku-latest",
      protocol: "anthropic",
    },
    mistral: {
      key: process.env.MISTRAL_API_KEY,
      endpoint: "https://api.mistral.ai/v1/chat/completions",
      model: "mistral-small-latest",
      protocol: "openai",
    },
    xai: {
      key: process.env.XAI_API_KEY,
      endpoint: "https://api.x.ai/v1/chat/completions",
      model: "grok-3-mini",
      protocol: "openai",
    },
    cerebras: {
      key: process.env.CEREBRAS_API_KEY,
      endpoint: "https://api.cerebras.ai/v1/chat/completions",
      model: "llama-3.3-70b",
      protocol: "openai",
    },
    groq: {
      key: process.env.GROQ_API_KEY,
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      model: "llama-3.3-70b-versatile",
      protocol: "openai",
    },
    gemini: {
      key: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
      endpoint: "https://generativelanguage.googleapis.com/v1beta/models/",
      model: "gemini-2.0-flash",
      protocol: "gemini",
    },
  };
  return configs[provider];
}

function assertProvider(value: string): asserts value is ProviderId {
  if (
    value !== "openai" &&
    value !== "anthropic" &&
    value !== "mistral" &&
    value !== "xai" &&
    value !== "cerebras" &&
    value !== "groq" &&
    value !== "gemini"
  ) {
    throw new AiProviderError("This AI provider is not supported.", 400);
  }
}

function validModel(value: string): boolean {
  return /^[a-zA-Z0-9._:-]{1,128}$/.test(value);
}

export function validateChatInput(value: unknown): ChatInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AiProviderError("Invalid request body.", 400);
  }
  const body = value as Record<string, unknown>;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const systemPrompt =
    typeof body.systemPrompt === "string" ? body.systemPrompt.slice(0, 20_000) : "";
  const providerValue =
    typeof body.provider === "string" ? body.provider.toLowerCase() : "openai";
  assertProvider(providerValue);

  const provider = providerValue;
  const config = providerConfig(provider);
  const requestedModel = typeof body.model === "string" ? body.model.trim() : "";
  const model = requestedModel || config.model;
  if (!message || message.length > 30_000) {
    throw new AiProviderError("Message must contain 1–30,000 characters.", 400);
  }
  if (!validModel(model)) {
    throw new AiProviderError("Invalid model name.", 400);
  }

  const rawHistory = Array.isArray(body.conversationHistory)
    ? body.conversationHistory
    : [];
  if (rawHistory.length > 40) {
    throw new AiProviderError("Conversation history is too long.", 400);
  }
  const conversationHistory: ChatMessage[] = [];
  let historySize = 0;
  for (const entry of rawHistory) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      Array.isArray(entry) ||
      !("role" in entry) ||
      !("content" in entry)
    ) {
      throw new AiProviderError("Invalid conversation history.", 400);
    }
    const item = entry as { role: unknown; content: unknown };
    if (
      (item.role !== "user" && item.role !== "assistant" && item.role !== "system") ||
      typeof item.content !== "string" ||
      item.content.length > 20_000
    ) {
      throw new AiProviderError("Invalid conversation history.", 400);
    }
    historySize += item.content.length;
    conversationHistory.push({ role: item.role, content: item.content });
  }
  if (historySize > 100_000) {
    throw new AiProviderError("Conversation history exceeds the allowed size.", 413);
  }

  let imageData: ChatInput["imageData"];
  if (body.imageData !== undefined) {
    if (
      typeof body.imageData !== "object" ||
      body.imageData === null ||
      Array.isArray(body.imageData)
    ) {
      throw new AiProviderError("Invalid image attachment.", 400);
    }
    const image = body.imageData as Record<string, unknown>;
    if (
      typeof image.base64 !== "string" ||
      image.base64.length > 8_000_000 ||
      typeof image.mimeType !== "string" ||
      !/^image\/(png|jpeg|webp|gif)$/.test(image.mimeType) ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(image.base64)
    ) {
      throw new AiProviderError("Image attachment is invalid or too large.", 413);
    }
    imageData = { base64: image.base64, mimeType: image.mimeType };
  }

  const rawTool =
    typeof body.activeTool === "string" ? body.activeTool : "none";
  if (rawTool !== "none" && rawTool !== "thinking") {
    throw new AiProviderError(
      "That agent mode is not available yet. Choose Chat or Thinking.",
      400,
    );
  }

  const temperature =
    typeof body.temperature === "number" && Number.isFinite(body.temperature)
      ? Math.max(0, Math.min(2, body.temperature))
      : 0.7;
  const maxTokens =
    typeof body.maxTokens === "number" && Number.isFinite(body.maxTokens)
      ? Math.max(1, Math.min(8192, Math.floor(body.maxTokens)))
      : 2048;

  return {
    message,
    conversationHistory,
    systemPrompt:
      rawTool === "thinking"
        ? `${systemPrompt}\nThink carefully, then give a concise answer. Do not reveal private chain-of-thought.`
        : systemPrompt,
    provider,
    model,
    temperature,
    maxTokens,
    imageData,
    activeTool: rawTool,
  };
}

function chatMessages(input: ChatInput) {
  const messages: { role: string; content: unknown }[] = [];
  if (input.systemPrompt) {
    messages.push({ role: "system", content: input.systemPrompt });
  }
  for (const entry of input.conversationHistory) {
    if (entry.role !== "system") {
      messages.push({ role: entry.role, content: entry.content });
    }
  }

  const content: Array<Record<string, unknown>> = [{ type: "text", text: input.message }];
  if (input.imageData) {
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${input.imageData.mimeType};base64,${input.imageData.base64}`,
      },
    });
  }
  messages.push({
    role: "user",
    content: input.imageData ? content : input.message,
  });
  return messages;
}

function buildProviderRequest(input: ChatInput, stream: boolean): ProviderRequest {
  const config = providerConfig(input.provider);
  if (!config.key) {
    throw new AiProviderError(
      `The ${input.provider} provider is not configured on this deployment.`,
      503,
    );
  }

  if (config.protocol === "openai") {
    return {
      url: config.endpoint,
      headers: {
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
      body: {
        model: input.model,
        messages: chatMessages(input),
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        stream,
      },
    };
  }

  if (config.protocol === "anthropic") {
    const messages = chatMessages(input)
      .filter((message) => message.role !== "system")
      .map((message) => {
        if (typeof message.content === "string") return message;
        const items = message.content as Array<Record<string, unknown>>;
        return {
          role: message.role,
          content: items.map((item) =>
            item.type === "image_url"
              ? {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: input.imageData?.mimeType,
                    data: input.imageData?.base64,
                  },
                }
              : { type: "text", text: item.text },
          ),
        };
      });
    return {
      url: config.endpoint,
      headers: {
        "x-api-key": config.key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: {
        model: input.model,
        max_tokens: input.maxTokens,
        temperature: input.temperature,
        system: input.systemPrompt || undefined,
        messages,
        stream,
      },
    };
  }

  const parts: Array<Record<string, unknown>> = [{ text: input.message }];
  if (input.imageData) {
    parts.push({
      inlineData: {
        mimeType: input.imageData.mimeType,
        data: input.imageData.base64,
      },
    });
  }
  const contents: Array<{
    role: "user" | "model";
    parts: Array<Record<string, unknown>>;
  }> = input.conversationHistory
    .filter((entry) => entry.role !== "system")
    .map((entry) => ({
      role: entry.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: entry.content }],
    }));
  contents.push({ role: "user", parts });
  const method = stream
    ? "streamGenerateContent?alt=sse"
    : "generateContent";
  return {
    url: `${config.endpoint}${encodeURIComponent(input.model)}:${method}${stream ? "&" : "?"}key=${encodeURIComponent(config.key)}`,
    headers: { "Content-Type": "application/json" },
    body: {
      systemInstruction: input.systemPrompt
        ? { parts: [{ text: input.systemPrompt }] }
        : undefined,
      contents,
      generationConfig: {
        temperature: input.temperature,
        maxOutputTokens: input.maxTokens,
      },
    },
  };
}

export async function requestChatCompletion(
  input: ChatInput,
  stream: boolean,
  signal?: AbortSignal,
): Promise<Response> {
  const request = buildProviderRequest(input, stream);
  const response = await fetch(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(request.body),
    signal: signal ?? AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    const status = response.status;
    const message =
      status === 401 || status === 403
        ? "The AI provider credentials are not accepted."
        : status === 429
          ? "The AI provider is rate-limited. Try again shortly."
          : `The AI provider returned HTTP ${status}.`;
    throw new AiProviderError(message, status === 429 ? 429 : 502);
  }
  return response;
}

export async function completionText(
  response: Response,
  provider: ProviderId,
): Promise<string> {
  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null) return "";

  if (provider === "anthropic") {
    const content = "content" in result ? result.content : undefined;
    if (!Array.isArray(content)) return "";
    return content
      .filter(
        (part): part is { type: string; text: string } =>
          typeof part === "object" &&
          part !== null &&
          "type" in part &&
          part.type === "text" &&
          "text" in part &&
          typeof part.text === "string",
      )
      .map((part) => part.text)
      .join("");
  }

  if (provider === "gemini") {
    const candidates = "candidates" in result ? result.candidates : undefined;
    if (!Array.isArray(candidates) || !candidates[0]) return "";
    const candidate = candidates[0];
    if (typeof candidate !== "object" || candidate === null || !("content" in candidate)) return "";
    const content = candidate.content;
    if (typeof content !== "object" || content === null || !("parts" in content)) return "";
    const parts = content.parts;
    if (!Array.isArray(parts)) return "";
    return parts
      .filter(
        (part): part is { text: string } =>
          typeof part === "object" &&
          part !== null &&
          "text" in part &&
          typeof part.text === "string",
      )
      .map((part) => part.text)
      .join("");
  }

  const choices = "choices" in result ? result.choices : undefined;
  if (!Array.isArray(choices) || !choices[0]) return "";
  const choice = choices[0];
  if (typeof choice !== "object" || choice === null || !("message" in choice)) return "";
  const message = choice.message;
  if (typeof message !== "object" || message === null || !("content" in message)) return "";
  return typeof message.content === "string" ? message.content : "";
}

export function streamingText(provider: ProviderId, value: unknown): string {
  if (typeof value !== "object" || value === null) return "";
  if (provider === "anthropic") {
    if (
      "type" in value &&
      value.type === "content_block_delta" &&
      "delta" in value &&
      typeof value.delta === "object" &&
      value.delta !== null &&
      "text" in value.delta &&
      typeof value.delta.text === "string"
    ) {
      return value.delta.text;
    }
    return "";
  }
  if (provider === "gemini") {
    if (!("candidates" in value) || !Array.isArray(value.candidates)) return "";
    const parts = value.candidates[0]?.content?.parts;
    return Array.isArray(parts)
      ? parts
          .filter(
            (part): part is { text: string } =>
              typeof part === "object" &&
              part !== null &&
              "text" in part &&
              typeof part.text === "string",
          )
          .map((part) => part.text)
          .join("")
      : "";
  }
  if (!("choices" in value) || !Array.isArray(value.choices)) return "";
  const delta = value.choices[0]?.delta;
  if (typeof delta !== "object" || delta === null || !("content" in delta)) return "";
  return typeof delta.content === "string" ? delta.content : "";
}

export function firstConfiguredProvider(): ProviderId | null {
  const providers: ProviderId[] = [
    "openai",
    "mistral",
    "anthropic",
    "gemini",
    "xai",
    "groq",
    "cerebras",
  ];
  return providers.find((provider) => Boolean(providerConfig(provider).key)) ?? null;
}
