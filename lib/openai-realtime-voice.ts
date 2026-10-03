"use client";

import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";

export type RealtimeVoice =
  | "alloy"
  | "echo"
  | "shimmer"
  | "ash"
  | "ballad"
  | "coral"
  | "sage"
  | "verse";

export interface RealtimeVoiceConfig {
  agentId: string;
  voice?: RealtimeVoice;
  turnDetection?: {
    type: "server_vad";
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  } | null;
  inputAudioTranscription?: { model: string };
}

export interface RealtimeCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onSpeechStarted?: () => void;
  onSpeechStopped?: () => void;
  onUserTranscript?: (transcript: string, isFinal: boolean) => void;
  onAgentTranscript?: (transcript: string, isFinal: boolean) => void;
  onAgentStartSpeaking?: () => void;
  onAgentStopSpeaking?: () => void;
  onError?: (error: string) => void;
}

type RealtimeSessionResponse = {
  clientSecret: string;
  model: string;
  agent: { name: string; instructions: string; voice: RealtimeVoice };
};

const voiceNames = new Set<string>([
  "alloy",
  "echo",
  "shimmer",
  "ash",
  "ballad",
  "coral",
  "sage",
  "verse",
]);

function isRealtimeVoice(value: unknown): value is RealtimeVoice {
  return typeof value === "string" && voiceNames.has(value);
}

function isRealtimeSessionResponse(value: unknown): value is RealtimeSessionResponse {
  if (typeof value !== "object" || value === null) return false;
  if (
    !("clientSecret" in value) ||
    typeof value.clientSecret !== "string" ||
    !("model" in value) ||
    typeof value.model !== "string" ||
    !("agent" in value) ||
    typeof value.agent !== "object" ||
    value.agent === null ||
    !("name" in value.agent) ||
    typeof value.agent.name !== "string" ||
    !("instructions" in value.agent) ||
    typeof value.agent.instructions !== "string" ||
    !("voice" in value.agent) ||
    !isRealtimeVoice(value.agent.voice)
  ) {
    return false;
  }
  return true;
}

class RealtimeVoiceService {
  private session: RealtimeSession | null = null;
  private connectionController: AbortController | null = null;
  private callbacks: RealtimeCallbacks = {};
  private connectionGeneration = 0;

  async connect(config: RealtimeVoiceConfig): Promise<void> {
    this.disconnect();
    const generation = this.connectionGeneration;
    const controller = new AbortController();
    this.connectionController = controller;
    let response: Response;
    try {
      response = await fetch("/api/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agentId: config.agentId,
          voice: config.voice,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (generation !== this.connectionGeneration) return;
      this.connectionController = null;
      throw error;
    }

    let result: unknown;
    try {
      result = await response.json();
    } catch (error) {
      if (generation !== this.connectionGeneration) return;
      this.connectionController = null;
      throw error;
    }
    if (generation !== this.connectionGeneration) return;
    this.connectionController = null;
    if (!response.ok) {
      const message =
        typeof result === "object" &&
        result !== null &&
        "error" in result &&
        typeof result.error === "string"
          ? result.error
          : "Could not start a realtime voice session.";
      throw new Error(message);
    }
    if (!isRealtimeSessionResponse(result)) {
      throw new Error("The realtime service returned an invalid response.");
    }

    const agent = new RealtimeAgent({
      name: result.agent.name,
      instructions: result.agent.instructions,
      voice: result.agent.voice,
    });
    const session = new RealtimeSession(agent, {
      model: result.model,
      transport: "webrtc",
      tracingDisabled: true,
      config: {
        outputModalities: ["audio", "text"],
        audio: {
          input: {
            format: { type: "audio/pcm", rate: 24000 },
            transcription: {
              model: config.inputAudioTranscription?.model || "gpt-4o-mini-transcribe",
            },
            turnDetection: config.turnDetection || { type: "server_vad" },
          },
          output: {
            format: { type: "audio/pcm", rate: 24000 },
            voice: result.agent.voice,
          },
        },
      },
    });
    this.session = session;

    session.transport.on("connection_change", (status) => {
      if (generation !== this.connectionGeneration) return;
      if (status === "connected") this.callbacks.onConnected?.();
      if (status === "disconnected") this.callbacks.onDisconnected?.();
    });
    session.on("audio_start", () => {
      if (generation === this.connectionGeneration) this.callbacks.onAgentStartSpeaking?.();
    });
    session.on("audio_stopped", () => {
      if (generation === this.connectionGeneration) this.callbacks.onAgentStopSpeaking?.();
    });
    session.on("audio_interrupted", () => {
      if (generation === this.connectionGeneration) this.callbacks.onAgentStopSpeaking?.();
    });
    session.on("error", (event) => {
      if (generation !== this.connectionGeneration) return;
      const message =
        event.error instanceof Error ? event.error.message : "Realtime voice session failed.";
      this.callbacks.onError?.(message);
    });
    session.on("transport_event", (event) => {
      if (generation !== this.connectionGeneration) return;
      if (
        event.type === "input_audio_buffer.speech_started"
      ) {
        this.callbacks.onSpeechStarted?.();
      } else if (event.type === "input_audio_buffer.speech_stopped") {
        this.callbacks.onSpeechStopped?.();
      } else if (
        event.type === "conversation.item.input_audio_transcription.completed" &&
        "transcript" in event &&
        typeof event.transcript === "string"
      ) {
        this.callbacks.onUserTranscript?.(event.transcript, true);
      } else if (
        event.type === "response.output_audio_transcript.delta" &&
        "delta" in event &&
        typeof event.delta === "string"
      ) {
        this.callbacks.onAgentTranscript?.(event.delta, false);
      } else if (
        event.type === "response.output_audio_transcript.done" &&
        "transcript" in event &&
        typeof event.transcript === "string"
      ) {
        this.callbacks.onAgentTranscript?.(event.transcript, true);
      }
    });

    try {
      await session.connect({ apiKey: result.clientSecret });
      if (generation !== this.connectionGeneration) session.close();
    } catch (error) {
      session.close();
      if (generation === this.connectionGeneration) this.session = null;
      if (generation !== this.connectionGeneration) return;
      throw error;
    }
  }

  setCallbacks(callbacks: RealtimeCallbacks): void {
    this.callbacks = callbacks;
  }

  sendTextMessage(text: string): void {
    this.session?.sendMessage(text);
  }

  setMuted(muted: boolean): void {
    this.session?.mute(muted);
  }

  get muted(): boolean {
    return this.session?.muted ?? false;
  }

  get connected(): boolean {
    return this.session?.transport.status === "connected";
  }

  disconnect(): void {
    this.connectionGeneration += 1;
    this.connectionController?.abort();
    this.connectionController = null;
    this.session?.close();
    this.session = null;
  }
}

export const realtimeVoice = new RealtimeVoiceService();
export default realtimeVoice;
