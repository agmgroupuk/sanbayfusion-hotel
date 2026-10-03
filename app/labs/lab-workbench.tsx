"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Check, LoaderCircle, Send, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

type Provider = {
  id: string;
  label: string;
};

type ExperimentId =
  | "battle-arena"
  | "debate-arena"
  | "dream-interpreter"
  | "emotion-visualizer"
  | "future-predictor"
  | "personality-mirror"
  | "story-weaver";

type Output = {
  text: string;
  provider?: string;
  runId?: string;
  battleKey?: string;
  warning?: string;
  response1?: string;
  response2?: string;
  modelLabel1?: string;
  modelLabel2?: string;
};

const apiRoutes: Record<ExperimentId, string> = {
  "battle-arena": "battle-arena",
  "debate-arena": "debate-arena",
  "dream-interpreter": "dream-analysis",
  "emotion-visualizer": "emotion-analysis",
  "future-predictor": "future-prediction",
  "personality-mirror": "personality-analysis",
  "story-weaver": "story-generation",
};

export function LabWorkbench({
  experiment,
  title,
  embedded = false,
}: {
  experiment: string;
  title: string;
  embedded?: boolean;
}) {
  const experimentId = experiment as ExperimentId;
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providerError, setProviderError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState<Output | null>(null);
  const [vote, setVote] = useState("");
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [form, setForm] = useState({
    prompt: "",
    genre: "fantasy",
    continuation: "",
    dream: "",
    text: "",
    topic: "",
    timeframe: "5years",
    position1: "Support",
    position2: "Challenge",
    model1: "",
    model2: "",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/lab/providers")
      .then(async (response) => {
        const data = (await response.json()) as {
          providers?: Provider[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error ?? "Could not load configured providers.");
        }
        return data.providers ?? [];
      })
      .then((available) => {
        if (cancelled) return;
        setProviders(available);
        setForm((current) => ({
          ...current,
          model1: current.model1 || available[0]?.id || "",
          model2:
            current.model2 ||
            available.find((provider) => provider.id !== available[0]?.id)?.id ||
            "",
        }));
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setProviderError(
            cause instanceof Error ? cause.message : "Could not load providers.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProviders(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isBattle = experimentId === "battle-arena";
  const isDebate = experimentId === "debate-arena";
  const hasProviders = providers.length > 0;

  const setField = useCallback(
    (field: keyof typeof form, value: string) => {
      setForm((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const canSubmit = useMemo(() => {
    if (busy || !hasProviders) return false;
    if (isBattle) {
      return Boolean(form.prompt.trim() && form.model1 && form.model2 && form.model1 !== form.model2);
    }
    if (experimentId === "story-weaver") return Boolean(form.prompt.trim());
    if (experimentId === "dream-interpreter") return Boolean(form.dream.trim());
    if (experimentId === "future-predictor" || isDebate) return Boolean(form.topic.trim());
    if (experimentId === "personality-mirror") return form.text.trim().length >= 50;
    return Boolean(form.text.trim());
  }, [busy, experimentId, form, hasProviders, isBattle, isDebate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setOutput(null);
    setVote("");
    setVotes({});

    let payload: Record<string, string>;
    switch (experimentId) {
      case "battle-arena":
        payload = {
          prompt: form.prompt.trim(),
          model1: form.model1,
          model2: form.model2,
        };
        break;
      case "debate-arena":
        payload = {
          topic: form.topic.trim(),
          position1: form.position1.trim(),
          position2: form.position2.trim(),
        };
        break;
      case "dream-interpreter":
        payload = { dream: form.dream.trim() };
        break;
      case "emotion-visualizer":
      case "personality-mirror":
        payload = { text: form.text.trim() };
        break;
      case "future-predictor":
        payload = { topic: form.topic.trim(), timeframe: form.timeframe };
        break;
      case "story-weaver":
        payload = {
          prompt: form.prompt.trim(),
          genre: form.genre,
          ...(form.continuation.trim() || output?.text
            ? { continuation: form.continuation.trim() || output?.text || "" }
            : {}),
        };
        break;
    }

    try {
      const response = await fetch(`/api/lab/${apiRoutes[experimentId]}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as Record<string, unknown>;
      if (!response.ok || data.success !== true) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "The experiment could not be completed.",
        );
      }

      const generatedText =
        experimentId === "battle-arena"
          ? ""
          : String(
              data.story ?? data.debate ?? data.analysis ?? data.prediction ?? "",
            );
      const textValue =
        experimentId === "story-weaver" &&
        (form.continuation.trim() || output?.text) &&
        generatedText
          ? `${form.continuation.trim() || output?.text}\n\n${generatedText}`
          : generatedText;
      setOutput({
        text: textValue,
        provider: typeof data.provider === "string" ? data.provider : undefined,
        runId: typeof data.runId === "string" ? data.runId : undefined,
        warning: typeof data.warning === "string" ? data.warning : undefined,
        battleKey:
          typeof data.battleKey === "string" ? data.battleKey : undefined,
        response1:
          typeof data.response1 === "string" ? data.response1 : undefined,
        response2:
          typeof data.response2 === "string" ? data.response2 : undefined,
        modelLabel1:
          typeof data.modelLabel1 === "string" ? data.modelLabel1 : undefined,
        modelLabel2:
          typeof data.modelLabel2 === "string" ? data.modelLabel2 : undefined,
      });
      if (experimentId === "story-weaver" && textValue) {
        setField("continuation", textValue);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitVote(choice: string, id: string) {
    if (!id || vote) return;
    setError("");
    try {
      const route = isBattle
        ? "/api/lab/battle-arena/vote"
        : "/api/lab/debate-arena/vote";
      const payload = isBattle
        ? { battleKey: id, winner: choice }
        : { topicId: id, position: choice };
      const response = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        error?: string;
        votes?: Record<string, number>;
      };
      if (!response.ok) throw new Error(data.error ?? "Could not save your vote.");
      setVote(choice);
      setVotes(data.votes ?? {});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your vote.");
    }
  }

  return (
    <section className={embedded ? "w-full min-w-0" : "mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-16"}>
      {!embedded && (
        <>
          <Link
            href="/labs"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            All Labs
          </Link>

          <header className="mt-8 max-w-3xl">
            <p className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-gold">
              <Sparkles size={16} aria-hidden="true" />
              Sanbay Fusion Labs
            </p>
            <h1 className="mt-3 font-display text-h1 font-light leading-tight">{title}</h1>
            <p className="mt-4 text-muted-foreground">
              Submit an experiment to a configured AI provider. No sign-in or
              subscription is required.
            </p>
          </header>
        </>
      )}

      <div className={embedded ? "grid min-w-0 items-start gap-4" : "mt-9 grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"}>
        <Card className="p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl">Set up the experiment</h2>
                {loadingProviders && (
                  <LoaderCircle
                    size={17}
                    className="animate-spin text-gold"
                    aria-label="Loading providers"
                  />
                )}
              </div>

              {providerError && (
                <p role="alert" className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {providerError}
                </p>
              )}
              {!loadingProviders && !hasProviders && (
                <p className="mb-5 rounded-lg border border-gold/30 bg-background/70 p-4 text-sm text-muted-foreground">
                  No supported AI provider is configured for this deployment.
                  No simulated results are shown.
                </p>
              )}

              <form onSubmit={submit} className="space-y-5">
                {isBattle && (
                  <>
                    <TextArea
                      label="Prompt"
                      value={form.prompt}
                      onChange={(value) => setField("prompt", value)}
                      placeholder="Ask both providers the same question…"
                      maxLength={4_000}
                      required
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SelectField
                        label="Response A"
                        value={form.model1}
                        onChange={(value) => setField("model1", value)}
                        options={providers}
                      />
                      <SelectField
                        label="Response B"
                        value={form.model2}
                        onChange={(value) => setField("model2", value)}
                        options={providers}
                      />
                    </div>
                    {providers.length === 1 && (
                      <p className="text-xs text-muted-foreground">
                        Battle Arena needs two different configured providers.
                      </p>
                    )}
                  </>
                )}

                {isDebate && (
                  <>
                    <TextField
                      label="Debate topic"
                      value={form.topic}
                      onChange={(value) => setField("topic", value)}
                      placeholder="Should cities prioritize public transit over roads?"
                      maxLength={1_000}
                      required
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        label="Position one"
                        value={form.position1}
                        onChange={(value) => setField("position1", value)}
                        maxLength={500}
                        required
                      />
                      <TextField
                        label="Position two"
                        value={form.position2}
                        onChange={(value) => setField("position2", value)}
                        maxLength={500}
                        required
                      />
                    </div>
                  </>
                )}

                {experimentId === "dream-interpreter" && (
                  <TextArea
                    label="Dream description"
                    value={form.dream}
                    onChange={(value) => setField("dream", value)}
                    placeholder="Describe the dream and details that stood out…"
                    maxLength={6_000}
                    required
                  />
                )}

                {experimentId === "emotion-visualizer" && (
                  <TextArea
                    label="Text to analyze"
                    value={form.text}
                    onChange={(value) => setField("text", value)}
                    placeholder="Paste or write a passage…"
                    maxLength={6_000}
                    required
                  />
                )}

                {experimentId === "personality-mirror" && (
                  <TextArea
                    label="Writing sample"
                    value={form.text}
                    onChange={(value) => setField("text", value)}
                    placeholder="Paste at least 50 characters of writing…"
                    maxLength={6_000}
                    minLength={50}
                    required
                  />
                )}

                {experimentId === "future-predictor" && (
                  <>
                    <TextArea
                      label="Topic or scenario"
                      value={form.topic}
                      onChange={(value) => setField("topic", value)}
                      placeholder="How might remote work change urban neighborhoods?"
                      maxLength={2_000}
                      required
                    />
                    <SelectField
                      label="Time horizon"
                      value={form.timeframe}
                      onChange={(value) => setField("timeframe", value)}
                      options={[
                        { id: "1year", label: "1 year" },
                        { id: "5years", label: "5 years" },
                        { id: "10years", label: "10 years" },
                        { id: "25years", label: "25 years" },
                      ]}
                    />
                  </>
                )}

                {experimentId === "story-weaver" && (
                  <>
                    <TextArea
                      label="Story premise"
                      value={form.prompt}
                      onChange={(value) => setField("prompt", value)}
                      placeholder="A cartographer discovers that one island appears only on old maps…"
                      maxLength={2_000}
                      required
                    />
                    <SelectField
                      label="Genre"
                      value={form.genre}
                      onChange={(value) => setField("genre", value)}
                      options={[
                        { id: "fantasy", label: "Fantasy" },
                        { id: "scifi", label: "Science fiction" },
                        { id: "romance", label: "Romance" },
                        { id: "mystery", label: "Mystery" },
                        { id: "horror", label: "Horror" },
                        { id: "adventure", label: "Adventure" },
                      ]}
                    />
                    {output?.text && (
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium">
                          Continue this story
                        </span>
                        <textarea
                          value={form.continuation || output.text}
                          onChange={(event) =>
                            setField("continuation", event.target.value)
                          }
                          maxLength={6_000}
                          rows={6}
                          className={fieldClass}
                        />
                      </label>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold px-5 py-3 font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {busy ? (
                    <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Send size={16} aria-hidden="true" />
                  )}
                  {busy
                    ? "Running experiment…"
                    : experimentId === "story-weaver" && output?.text
                      ? "Continue story"
                      : "Run experiment"}
                </button>
          </form>
        </Card>

        <Card className="min-h-64 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold">Output</p>
              <h2 className="mt-1 font-display text-2xl">Experiment result</h2>
            </div>
            {output?.provider && (
              <span className="rounded-full border border-gold/25 px-3 py-1 text-xs text-muted-foreground">
                {output.provider}
              </span>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </p>
          )}
          {!output && !error && (
            <p className="mt-6 text-sm text-muted-foreground">
              Your provider-backed output will appear here. No simulated
              results are shown.
            </p>
          )}
          {output && (
            <div className="mt-6 space-y-5">
              {output.warning && (
                <p className="rounded-lg border border-gold/30 bg-background/70 p-3 text-sm text-muted-foreground">
                  {output.warning}
                </p>
              )}
              {isBattle ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <BattleResponse
                    title={output.modelLabel1 ?? "Response A"}
                    text={output.response1 ?? ""}
                    choice="model1"
                    count={votes.model1 ?? 0}
                    active={vote === "model1"}
                    disabled={Boolean(vote)}
                    onVote={() => submitVote("model1", output.battleKey ?? "")}
                  />
                  <BattleResponse
                    title={output.modelLabel2 ?? "Response B"}
                    text={output.response2 ?? ""}
                    choice="model2"
                    count={votes.model2 ?? 0}
                    active={vote === "model2"}
                    disabled={Boolean(vote)}
                    onVote={() => submitVote("model2", output.battleKey ?? "")}
                  />
                </div>
              ) : (
                <>
                  <div className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground/90">
                    {output.text}
                  </div>
                  {isDebate && output.runId && (
                    <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                      <span className="mr-auto self-center text-xs text-muted-foreground">
                        Which position was more persuasive?
                      </span>
                      <VoteButton
                        label={`Support · ${votes.for ?? 0}`}
                        active={vote === "for"}
                        disabled={Boolean(vote)}
                        onClick={() => submitVote("for", output.runId ?? "")}
                      />
                      <VoteButton
                        label={`Challenge · ${votes.against ?? 0}`}
                        active={vote === "against"}
                        disabled={Boolean(vote)}
                        onClick={() => submitVote("against", output.runId ?? "")}
                      />
                    </div>
                  )}
                </>
              )}
              {vote && (
                <p className="flex items-center gap-2 text-sm text-gold">
                  <Check size={15} aria-hidden="true" />
                  Your vote has been saved.
                </p>
              )}
              {(output.runId || output.battleKey) && (
                <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                  Run reference · {output.runId ?? output.battleKey}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

const fieldClass =
  "w-full rounded-md border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  minLength,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
  minLength?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        required={required}
        rows={5}
        className={fieldClass}
      />
      <span className="mt-1 block text-right text-xs text-muted-foreground">
        {value.length}/{maxLength}
      </span>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        className={fieldClass}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function BattleResponse({
  title,
  text,
  choice,
  count,
  active,
  disabled,
  onVote,
}: {
  title: string;
  text: string;
  choice: string;
  count: number;
  active: boolean;
  disabled: boolean;
  onVote: () => void;
}) {
  return (
    <div className="flex min-h-64 flex-col rounded-lg border border-gold/20 bg-background/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium text-gold">{title}</h3>
        <span className="text-xs text-muted-foreground">{choice === "model1" ? "A" : "B"}</span>
      </div>
      <p className="mt-4 flex-1 whitespace-pre-wrap break-words text-sm leading-6">
        {text}
      </p>
      <VoteButton
        label={`Vote for ${choice === "model1" ? "A" : "B"} · ${count}`}
        active={active}
        disabled={disabled}
        onClick={onVote}
      />
    </div>
  );
}

function VoteButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className="rounded-md border border-gold/35 px-3 py-2 text-xs font-medium text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
