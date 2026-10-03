import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  BATTLE_MODELS,
  completeLabRun,
  createLabRun,
  enumValue,
  errorResponse,
  LabApiError,
  markLabRunFailed,
  optionalText,
  requestLabCompletion,
  requiredText,
  type LabProvider,
  configuredLabProviders,
  readJsonBody,
} from "@/app/api/lab/_lib";

const PROVIDER_IDS = [
  "openai",
  "anthropic",
  "mistral",
  "gemini",
  "xai",
  "groq",
  "cerebras",
] as const satisfies readonly LabProvider[];

const GENRES = [
  "fantasy",
  "scifi",
  "romance",
  "mystery",
  "horror",
  "adventure",
] as const;

type Experiment = "battle-arena" | "debate-arena" | "dream-analysis" |
  "emotion-analysis" | "future-prediction" | "personality-analysis" |
  "story-generation";

function isExperiment(value: string): value is Experiment {
  return [
    "battle-arena",
    "debate-arena",
    "dream-analysis",
    "emotion-analysis",
    "future-prediction",
    "personality-analysis",
    "story-generation",
  ].includes(value);
}

function providerDisplay(id: LabProvider) {
  return BATTLE_MODELS[id].label;
}

function battleProvider(value: unknown, field: string, fallback: LabProvider) {
  const aliases: Record<string, LabProvider> = {
    "gpt-4": "openai",
    "claude-3": "anthropic",
    llama: "groq",
  };
  if (typeof value === "string" && aliases[value]) return aliases[value];
  return enumValue(value, PROVIDER_IDS, field, fallback);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ experiment: string }> },
) {
  try {
    const { experiment } = await context.params;
    if (!isExperiment(experiment)) {
      return NextResponse.json({ error: "Unknown Lab experiment." }, { status: 404 });
    }

    const body = await readJsonBody(request);

    if (experiment === "battle-arena") {
      const requestedPrompt1 = optionalText(body, "prompt1", 4_000);
      const requestedPrompt2 = optionalText(body, "prompt2", 4_000);
      const topic = optionalText(body, "topic", 1_000);
      const prompt =
        optionalText(body, "prompt", 4_000) ?? requestedPrompt1 ?? requestedPrompt2;
      if (!prompt) throw new LabApiError("prompt is required.", 400);
      const model1 = battleProvider(
        body.model1,
        "model1",
        "openai",
      );
      const model2 = battleProvider(
        body.model2,
        "model2",
        "anthropic",
      );
      if (model1 === model2) {
        throw new LabApiError("Choose two different AI providers.", 400);
      }

      const availableProviders = new Set(
        configuredLabProviders().map((provider) => provider.id),
      );
      if (!availableProviders.has(model1) || !availableProviders.has(model2)) {
        throw new LabApiError(
          "Both selected providers must be configured on this deployment.",
          503,
        );
      }

      const input = {
        prompt,
        ...(topic ? { topic } : {}),
        model1,
        model2,
        prompt1: `${topic ? `Topic: ${topic}\n` : ""}${requestedPrompt1 ?? prompt}`,
        prompt2: `${topic ? `Topic: ${topic}\n` : ""}${requestedPrompt2 ?? prompt}`,
      };
      const run = await createLabRun(
        null,
        "battle-arena",
        input,
        `${model1},${model2}`,
      );
      try {
        const [first, second] = await Promise.all([
          requestLabCompletion(
            input.prompt1,
            "Answer the user's prompt directly and helpfully. Keep the response focused.",
            { provider: model1, model: BATTLE_MODELS[model1].model, maxTokens: 1200 },
          ),
          requestLabCompletion(
            input.prompt2,
            "Answer the user's prompt directly and helpfully. Keep the response focused.",
            { provider: model2, model: BATTLE_MODELS[model2].model, maxTokens: 1200 },
          ),
        ]);
        const output = {
          response1: first.text,
          response2: second.text,
          provider1: first.provider,
          provider2: second.provider,
        };
        const saved = await completeLabRun(run.id, output);
        return NextResponse.json({
          success: true,
          ...output,
          modelLabel1: providerDisplay(model1),
          modelLabel2: providerDisplay(model2),
          battleKey: run.id ?? randomUUID(),
          ...(run.warning || !saved
            ? { warning: run.warning ?? "Lab run history could not be saved." }
            : {}),
        });
      } catch (error) {
        const message =
          error instanceof LabApiError
            ? error.message
            : "One or both AI providers could not complete the battle.";
        await markLabRunFailed(run.id, message);
        throw error instanceof LabApiError
          ? error
          : new LabApiError(message, 502);
      }
    }

    if (experiment === "debate-arena") {
      const topic = requiredText(body, "topic", 1_000);
      const position1 = optionalText(body, "position1", 500) ?? "Support";
      const position2 = optionalText(body, "position2", 500) ?? "Challenge";
      const input = { topic, position1, position2 };
      const provider = configuredLabProviders()[0]?.id;
      if (!provider) {
        throw new LabApiError(
          "No supported AI provider is configured for Labs on this deployment.",
          503,
        );
      }
      const run = await createLabRun(null, "debate-arena", input, provider);
      try {
        const [argument1, argument2] = await Promise.all([
          requestLabCompletion(
            `Topic: ${topic}\nPresent the strongest concise argument supporting this position: ${position1}.`,
            "You are a respectful debate participant. Steelman the requested position, use measured language, and do not invent facts.",
            { provider, maxTokens: 900 },
          ),
          requestLabCompletion(
            `Topic: ${topic}\nPresent the strongest concise argument supporting this position: ${position2}.`,
            "You are a respectful debate participant. Steelman the requested position, use measured language, and do not invent facts.",
            { provider, maxTokens: 900 },
          ),
        ]);
        const responses = [
          {
            agent: providerDisplay(provider),
            position: "for",
            argument: argument1.text,
          },
          {
            agent: providerDisplay(provider),
            position: "against",
            argument: argument2.text,
          },
        ];
        const debate = `## ${position1}\n${argument1.text}\n\n## ${position2}\n${argument2.text}`;
        const saved = await completeLabRun(run.id, { debate, responses, provider });
        const runId = run.id ?? randomUUID();
        return NextResponse.json({
          success: true,
          debate,
          provider: argument1.provider,
          runId,
          topicId: runId,
          responses,
          ...(run.warning || !saved
            ? { warning: run.warning ?? "Lab run history could not be saved." }
            : {}),
        });
      } catch (error) {
        const message =
          error instanceof LabApiError
            ? error.message
            : "The debate could not be completed.";
        await markLabRunFailed(run.id, message);
        throw error instanceof LabApiError
          ? error
          : new LabApiError(message, 502);
      }
    }

    const provider = configuredLabProviders()[0]?.id;
    if (!provider) {
      throw new LabApiError(
        "No supported AI provider is configured for Labs on this deployment.",
        503,
      );
    }

    let labId: string;
    let prompt: string;
    let systemPrompt: string;
    let input: Record<string, string>;
    let responseField: "analysis" | "prediction" | "story";

    switch (experiment) {
      case "dream-analysis": {
        const dream = requiredText(
          { ...body, dream: body.dream ?? body.dreamDescription },
          "dream",
          6_000,
        );
        input = { dream };
        labId = "dream-interpreter";
        prompt = `Analyze this dream thoughtfully. Discuss recurring imagery, possible emotional themes, and reflection questions. Do not present symbolic interpretation as medical or psychological diagnosis.\n\nDream:\n${dream}`;
        systemPrompt =
          "You are a reflective dream-analysis assistant. Offer possibilities rather than definitive claims, avoid diagnosis, and use clear section headings.";
        responseField = "analysis";
        break;
      }
      case "emotion-analysis": {
        const text = requiredText(body, "text", 6_000);
        input = { text };
        labId = "emotion-visualizer";
        prompt = `Analyze the emotional tone of this text. Identify likely emotions, sentiment, intensity (low/medium/high), and the textual cues behind the assessment. Do not infer a clinical diagnosis.\n\nText:\n${text}`;
        systemPrompt =
          "You are a careful text sentiment and emotion analysis assistant. Distinguish evidence from interpretation.";
        responseField = "analysis";
        break;
      }
      case "future-prediction": {
        const topic = requiredText(
          { ...body, topic: body.topic ?? body.scenario },
          "topic",
          2_000,
        );
        const timeframe = enumValue(
          body.timeframe,
          ["1year", "5years", "10years", "25years"] as const,
          "timeframe",
          "5years",
        );
        input = { topic, timeframe };
        labId = "future-predictor";
        prompt = `Explore plausible future scenarios for: ${topic}\nTime horizon: ${timeframe}.\nProvide 2-3 scenarios, key drivers, uncertainties, and signals to watch. Make clear these are speculative possibilities, not factual predictions or advice.`;
        systemPrompt =
          "You are a scenario-planning assistant. Use calibrated language, distinguish assumptions from evidence, and avoid false precision.";
        responseField = "prediction";
        break;
      }
      case "personality-analysis": {
        const text = requiredText(body, "text", 6_000, 50);
        input = { text };
        labId = "personality-mirror";
        prompt = `Describe observable communication patterns in this writing sample. Summarize likely tone, style, strengths, and possible areas to reflect on. Base every observation on the text and avoid diagnosing or assigning fixed personality traits.\n\nWriting sample:\n${text}`;
        systemPrompt =
          "You are a non-clinical writing-style reflection assistant. Do not claim to determine a person's true personality from a short sample.";
        responseField = "analysis";
        break;
      }
      case "story-generation": {
        const promptText = requiredText(body, "prompt", 2_000);
        const genre = enumValue(body.genre, GENRES, "genre", "fantasy");
        const continuation = optionalText(body, "continuation", 6_000);
        input = {
          prompt: promptText,
          genre,
          ...(continuation ? { continuation } : {}),
        };
        labId = "story-weaver";
        prompt = continuation
          ? `Continue this ${genre} story in a consistent style. Start with new prose and avoid repeating the supplied text.\nStory premise: ${promptText}\n\nExisting story:\n${continuation}`
          : `Write an engaging ${genre} story based on this premise. Use vivid but concise prose and a satisfying opening.\n\nPremise:\n${promptText}`;
        systemPrompt =
          "You are a creative fiction writer. Produce original prose only, with no preamble or explanation.";
        responseField = "story";
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown Lab experiment." }, { status: 404 });
    }

    const run = await createLabRun(null, labId, input, provider);
    try {
      const result = await requestLabCompletion(prompt, systemPrompt, {
        provider,
        maxTokens: responseField === "story" ? 2400 : 1600,
      });
      const saved = await completeLabRun(run.id, {
        [responseField]: result.text,
        provider: result.provider,
      });
      return NextResponse.json({
        success: true,
        [responseField]: result.text,
        provider: result.provider,
        runId: run.id ?? randomUUID(),
        ...(run.warning || !saved
          ? { warning: run.warning ?? "Lab run history could not be saved." }
          : {}),
      });
    } catch (error) {
      const message =
        error instanceof LabApiError
          ? error.message
          : "The AI provider could not complete this experiment.";
      await markLabRunFailed(run.id, message);
      throw error instanceof LabApiError
        ? error
        : new LabApiError(message, 502);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
