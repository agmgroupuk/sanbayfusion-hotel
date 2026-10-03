"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, RotateCcw, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { getTool, type ToolSlug } from "@/app/tools/tools";

const controlClass =
  "w-full rounded-lg border border-input bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition focus-visible:border-gold/70 focus-visible:ring-2 focus-visible:ring-gold/20";
const labelClass = "mb-2 block text-sm font-medium text-foreground/90";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gold/40 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-gold-foreground transition hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";
const outputClass =
  "min-h-32 w-full resize-y rounded-lg border border-border bg-black/20 p-4 font-mono text-sm leading-relaxed text-foreground/90";

type ToolDefinition = {
  slug: ToolSlug;
  title: string;
  description: string;
  icon: LucideIcon;
};

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-7">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Clipboard access is unavailable in this browser.");
    }
  }

  return (
    <button
      className={buttonClass}
      type="button"
      onClick={copy}
      disabled={!value}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function ToolHeading({ tool }: { tool: ToolDefinition }) {
  const Icon = tool.icon;
  return (
    <div className="mb-8">
      <Link
        href="/tools"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-gold"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All tools
      </Link>
      <div className="mt-7 flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
          <Icon className="size-6" />
        </span>
        <div>
          <p className="text-eyebrow text-gold">Browser utility</p>
          <h1 className="mt-2 font-display text-h3">{tool.title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            {tool.description} Processing stays on this device.
          </p>
        </div>
      </div>
    </div>
  );
}

function JsonFormatter() {
  const [input, setInput] = useState('{"name":"Sanbay","active":true,"count":3}');
  const [indent, setIndent] = useState("2");
  const parsed = useMemo(() => {
    if (!input.trim()) return { formatted: "", compact: "", error: "" };
    try {
      const value: unknown = JSON.parse(input);
      return {
        formatted: JSON.stringify(value, null, indent === "tab" ? "\t" : Number(indent)),
        compact: JSON.stringify(value),
        error: "",
      };
    } catch (error) {
      return {
        formatted: "",
        compact: "",
        error: error instanceof Error ? error.message : "Invalid JSON.",
      };
    }
  }, [indent, input]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="JSON input">
        <Field label="Paste JSON" htmlFor="json-input">
          <textarea
            id="json-input"
            className={`${controlClass} min-h-64 resize-y font-mono`}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={500_000}
            spellCheck={false}
          />
        </Field>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-muted-foreground" htmlFor="json-indent">
            Indentation
          </label>
          <select
            id="json-indent"
            className={`${controlClass} w-auto min-w-28`}
            value={indent}
            onChange={(event) => setIndent(event.target.value)}
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
          <button
            className={buttonClass}
            type="button"
            onClick={() => setInput('{"name":"Sanbay","active":true,"count":3}')}
          >
            <Sparkles className="size-4" />
            Example
          </button>
          <button className={buttonClass} type="button" onClick={() => setInput("")}>
            <RotateCcw className="size-4" />
            Clear
          </button>
        </div>
      </Panel>
      <Panel title="Formatted output">
        {parsed.error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {parsed.error}
          </p>
        ) : (
          <>
            <textarea
              aria-label="Formatted JSON output"
              className={outputClass}
              value={parsed.formatted}
              readOnly
              spellCheck={false}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <CopyButton value={parsed.formatted} label="Copy formatted" />
              <CopyButton value={parsed.compact} label="Copy compact" />
            </div>
          </>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Input is parsed and formatted in this browser only.
        </p>
      </Panel>
    </div>
  );
}

function encodeBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function decodeBase64Utf8(value: string) {
  const compact = value.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 === 1) {
    throw new Error("Enter a valid Base64 string.");
  }
  const padded = compact.padEnd(compact.length + ((4 - (compact.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function Base64Tool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("Sanbay Fusion — tools stay in your browser.");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function convert() {
    setError("");
    setOutput("");
    if (input.length > 1_000_000) {
      setError("Input is too large. Use at most 1,000,000 characters.");
      return;
    }
    try {
      setOutput(mode === "encode" ? encodeBase64Utf8(input) : decodeBase64Utf8(input));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to convert this input.");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title={mode === "encode" ? "Text to encode" : "Base64 to decode"}>
        <div className="mb-4 flex flex-wrap gap-2">
          {(["encode", "decode"] as const).map((nextMode) => (
            <button
              className={nextMode === mode ? primaryButtonClass : buttonClass}
              key={nextMode}
              type="button"
              onClick={() => {
                setMode(nextMode);
                setOutput("");
                setError("");
              }}
              aria-pressed={nextMode === mode}
            >
              {nextMode === "encode" ? "Encode" : "Decode"}
            </button>
          ))}
        </div>
        <Field
          label={mode === "encode" ? "UTF-8 text" : "Base64 text"}
          htmlFor="base64-input"
        >
          <textarea
            id="base64-input"
            className={`${controlClass} min-h-64 resize-y font-mono`}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={1_000_000}
            spellCheck={false}
          />
        </Field>
        <button className={`${primaryButtonClass} mt-4`} type="button" onClick={convert}>
          Convert
        </button>
      </Panel>
      <Panel title="Result">
        <textarea
          aria-label="Base64 conversion result"
          className={outputClass}
          value={output}
          readOnly
          spellCheck={false}
        />
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-4">
          <CopyButton value={output} label="Copy result" />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Uses UTF-8 and supports URL-safe Base64 while decoding.
        </p>
      </Panel>
    </div>
  );
}

function makeUuidV4() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function UuidTool() {
  const [count, setCount] = useState("5");
  const [uuids, setUuids] = useState<string[]>([]);
  const [candidate, setCandidate] = useState("");
  const amount = Number.parseInt(count, 10);
  const validation = candidate.trim()
    ? UUID_PATTERN.test(candidate.trim())
    : null;

  function generate() {
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) return;
    try {
      setUuids((current) =>
        [...Array.from({ length: amount }, makeUuidV4), ...current].slice(0, 200),
      );
    } catch {
      toast.error("Secure random number generation is unavailable in this browser.");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Generate UUID v4">
        <p className="text-sm text-muted-foreground">
          Values are created with the browser&apos;s cryptographically secure random
          number generator.
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="w-36">
            <Field label="How many?" htmlFor="uuid-count">
              <input
                id="uuid-count"
                className={controlClass}
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(event) => setCount(event.target.value)}
              />
            </Field>
          </div>
          <button
            className={primaryButtonClass}
            type="button"
            onClick={generate}
            disabled={!Number.isInteger(amount) || amount < 1 || amount > 100}
          >
            Generate
          </button>
          <button className={buttonClass} type="button" onClick={() => setUuids([])}>
            Clear list
          </button>
        </div>
        <div className="mt-5 space-y-2">
          {uuids.length ? (
            uuids.map((uuid, index) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-black/20 px-3 py-2"
                key={`${uuid}-${index}`}
              >
                <code className="break-all font-mono text-sm">{uuid}</code>
                <CopyButton value={uuid} label="Copy" />
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
              Generate up to 100 UUIDs at a time.
            </p>
          )}
        </div>
        {uuids.length > 0 && (
          <div className="mt-4">
            <CopyButton value={uuids.join("\n")} label="Copy all" />
          </div>
        )}
      </Panel>
      <Panel title="Validate a UUID">
        <Field label="UUID value" htmlFor="uuid-value">
          <input
            id="uuid-value"
            className={controlClass}
            value={candidate}
            onChange={(event) => setCandidate(event.target.value)}
            placeholder="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
            spellCheck={false}
          />
        </Field>
        {validation !== null && (
          <p
            className={`mt-4 rounded-lg border p-3 text-sm ${
              validation
                ? "border-gold/30 bg-gold/10 text-gold"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
            role="status"
          >
            {validation
              ? `Valid UUID${candidate.trim()[14] ? ` · version ${candidate.trim()[14]}` : ""}`
              : "This is not a valid hyphenated UUID."}
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          The validator checks the standard UUID layout, version nibble, and RFC
          variant bits.
        </p>
      </Panel>
    </div>
  );
}

type UrlPart = { label: string; value: string };

function UrlParser() {
  const [input, setInput] = useState(
    "https://example.com:8080/path/to/page?name=value&foo=bar#section",
  );
  const parsed = useMemo(() => {
    if (!input.trim()) return { parts: [] as UrlPart[], params: [] as UrlPart[], error: "" };
    try {
      const url = new URL(input);
      const parts: UrlPart[] = [
        { label: "Protocol", value: url.protocol },
        { label: "Host", value: url.host },
        { label: "Hostname", value: url.hostname },
        { label: "Port", value: url.port || "(default)" },
        { label: "Origin", value: url.origin },
        { label: "Path", value: url.pathname },
        { label: "Query", value: url.search || "(none)" },
        { label: "Fragment", value: url.hash || "(none)" },
      ];
      const params = Array.from(url.searchParams, ([key, value]) => ({
        label: key,
        value,
      }));
      return { parts, params, error: "" };
    } catch {
      return {
        parts: [] as UrlPart[],
        params: [] as UrlPart[],
        error: "Enter a complete URL, including its scheme (for example, https://).",
      };
    }
  }, [input]);

  return (
    <div className="grid gap-5">
      <Panel title="URL to inspect">
        <Field label="Absolute URL" htmlFor="url-input">
          <input
            id="url-input"
            className={controlClass}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={2_048}
            placeholder="https://example.com/path?key=value#section"
            spellCheck={false}
          />
        </Field>
        {parsed.error && <p className="mt-3 text-sm text-destructive">{parsed.error}</p>}
      </Panel>
      {parsed.parts.length > 0 && (
        <>
          <Panel title="Components">
            <div className="grid gap-3 sm:grid-cols-2">
              {parsed.parts.map((part) => (
                <div
                  className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-black/20 p-3"
                  key={part.label}
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{part.label}</p>
                    <code className="mt-1 block break-all font-mono text-sm">{part.value}</code>
                  </div>
                  <CopyButton value={part.value} label="Copy" />
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Query parameters">
            {parsed.params.length ? (
              <div className="space-y-2">
                {parsed.params.map((param, index) => (
                  <div
                    className="grid gap-1 rounded-lg border border-border bg-black/20 p-3 sm:grid-cols-2 sm:gap-4"
                    key={`${param.label}-${index}`}
                  >
                    <code className="break-all font-mono text-sm">{param.label}</code>
                    <code className="break-all font-mono text-sm text-muted-foreground">
                      {param.value || "(empty)"}
                    </code>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No query parameters.</p>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

function TimestampTool() {
  const [unit, setUnit] = useState<"seconds" | "milliseconds">("seconds");
  const [timestamp, setTimestamp] = useState("1700000000");
  const [localDate, setLocalDate] = useState("");
  const numeric = Number(timestamp);
  const dateValue = numeric * (unit === "seconds" ? 1_000 : 1);
  const validTimestamp =
    timestamp.trim() !== "" &&
    Number.isFinite(numeric) &&
    Math.abs(dateValue) <= 8.64e15;
  const date = validTimestamp ? new Date(dateValue) : null;

  function setCurrentTime() {
    const now = Date.now();
    setTimestamp(unit === "seconds" ? String(Math.floor(now / 1_000)) : String(now));
  }

  function convertLocalDate() {
    const parsed = new Date(localDate);
    if (!localDate || Number.isNaN(parsed.getTime())) {
      toast.error("Choose a valid local date and time.");
      return;
    }
    const milliseconds = parsed.getTime();
    setTimestamp(unit === "seconds" ? String(Math.floor(milliseconds / 1_000)) : String(milliseconds));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Unix timestamp">
        <div className="mb-4 flex flex-wrap gap-2">
          {(["seconds", "milliseconds"] as const).map((nextUnit) => (
            <button
              className={unit === nextUnit ? primaryButtonClass : buttonClass}
              type="button"
              key={nextUnit}
              aria-pressed={unit === nextUnit}
              onClick={() => setUnit(nextUnit)}
            >
              {nextUnit === "seconds" ? "Seconds" : "Milliseconds"}
            </button>
          ))}
        </div>
        <Field label={`Timestamp (${unit})`} htmlFor="timestamp-input">
          <input
            id="timestamp-input"
            className={controlClass}
            inputMode="numeric"
            value={timestamp}
            onChange={(event) => setTimestamp(event.target.value)}
          />
        </Field>
        <button className={`${buttonClass} mt-4`} type="button" onClick={setCurrentTime}>
          Use current time
        </button>
        {validTimestamp && date && (
          <div className="mt-5 space-y-3 rounded-lg border border-border bg-black/20 p-4">
            <div>
              <p className="text-xs text-muted-foreground">ISO 8601 (UTC)</p>
              <code className="mt-1 block break-all font-mono text-sm">{date.toISOString()}</code>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Your local time</p>
              <p className="mt-1 text-sm">{date.toLocaleString()}</p>
            </div>
            <CopyButton value={String(dateValue)} label="Copy milliseconds" />
          </div>
        )}
        {!validTimestamp && (
          <p className="mt-3 text-sm text-destructive">Enter a finite timestamp in the valid date range.</p>
        )}
      </Panel>
      <Panel title="Local date and time">
        <Field label="Date and time on this device" htmlFor="timestamp-date">
          <input
            id="timestamp-date"
            className={controlClass}
            type="datetime-local"
            value={localDate}
            onChange={(event) => setLocalDate(event.target.value)}
          />
        </Field>
        <button className={`${primaryButtonClass} mt-4`} type="button" onClick={convertLocalDate}>
          Convert to Unix
        </button>
        <p className="mt-4 text-xs text-muted-foreground">
          Date-time input is interpreted in your current local time zone. The ISO
          result above is UTC.
        </p>
      </Panel>
    </div>
  );
}

type RegexMatch = { value: string; index: number; groups: string[] };
type RegexResponse = { matches?: RegexMatch[]; error?: string; truncated?: boolean };

const regexWorkerSource = `
self.onmessage = function (event) {
  const { pattern, text, flags } = event.data;
  try {
    const regex = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
      if (matches.length >= 500) {
        self.postMessage({ matches: matches, truncated: true });
        return;
      }
      if (match[0] === "") regex.lastIndex += 1;
    }
    self.postMessage({ matches: matches });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Invalid pattern." });
  }
};
`;

function RegexTester() {
  const [pattern, setPattern] = useState("(\\w+)@(\\w+\\.\\w+)");
  const [text, setText] = useState(
    "Contact support@example.com or hello@sanbayfusion.com for more information.",
  );
  const [flags, setFlags] = useState<string[]>(["g", "i"]);
  const [response, setResponse] = useState<RegexResponse>({ matches: [] });
  const [running, setRunning] = useState(false);
  const inputTooLarge = pattern.length > 500 || text.length > 20_000;

  useEffect(() => {
    if (!pattern || !text) return;

    let worker: Worker | null = null;
    let objectUrl: string | null = null;
    let timeoutId: number | null = null;
    const debounceId = window.setTimeout(() => {
      setRunning(true);
      setResponse({ matches: [] });
      objectUrl = URL.createObjectURL(
        new Blob([regexWorkerSource], { type: "text/javascript" }),
      );
      worker = new Worker(objectUrl);
      let finished = false;
      timeoutId = window.setTimeout(() => {
        finished = true;
        worker?.terminate();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        setResponse({ error: "Pattern timed out. Try simplifying the expression." });
        setRunning(false);
      }, 400);

      worker.onmessage = (event: MessageEvent<RegexResponse>) => {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        worker?.terminate();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        if (!finished) {
          finished = true;
          setResponse(event.data);
          setRunning(false);
        }
      };
      worker.onerror = () => {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        worker?.terminate();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        if (!finished) {
          finished = true;
          setResponse({ error: "The regular expression could not be tested in this browser." });
          setRunning(false);
        }
      };
      worker.postMessage({ pattern, text, flags });
    }, 150);

    return () => {
      window.clearTimeout(debounceId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      worker?.terminate();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [flags, pattern, text]);

  function toggleFlag(flag: string) {
    setFlags((current) =>
      current.includes(flag)
        ? current.filter((item) => item !== flag)
        : [...current, flag],
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Pattern and test text">
        <Field label="Regular expression (without slashes)" htmlFor="regex-pattern">
          <input
            id="regex-pattern"
            className={controlClass}
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            maxLength={500}
            spellCheck={false}
          />
        </Field>
        <fieldset className="mt-4">
          <legend className={labelClass}>Flags</legend>
          <div className="flex flex-wrap gap-3">
            {[
              ["g", "Global"],
              ["i", "Ignore case"],
              ["m", "Multiline"],
              ["s", "Dot matches newline"],
              ["u", "Unicode"],
            ].map(([flag, label]) => (
              <label
                className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                key={flag}
              >
                <input
                  type="checkbox"
                  checked={flags.includes(flag)}
                  onChange={() => toggleFlag(flag)}
                  className="accent-[var(--gold)]"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Text to test" htmlFor="regex-text">
          <textarea
            id="regex-text"
            className={`${controlClass} mt-4 min-h-48 resize-y font-mono`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={20_000}
            spellCheck={false}
          />
        </Field>
        <p className="mt-3 text-xs text-muted-foreground">
          Evaluation runs in a short-lived browser worker with a time limit.
        </p>
      </Panel>
      <Panel title="Matches">
        {inputTooLarge ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Keep patterns under 500 characters and test text under 20,000 characters.
          </p>
        ) : !pattern || !text ? (
          <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
            Enter a pattern and some test text.
          </p>
        ) : running ? (
          <p className="text-sm text-muted-foreground">Testing pattern…</p>
        ) : response.error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {response.error}
          </p>
        ) : response.matches?.length ? (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {response.matches.length}
              {response.truncated ? "+" : ""} match
              {response.matches.length === 1 ? "" : "es"}
            </p>
            <ol className="max-h-[28rem] space-y-2 overflow-auto">
              {response.matches.map((match, index) => (
                <li
                  className="rounded-lg border border-border bg-black/20 p-3"
                  key={`${match.index}-${index}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <code className="break-all font-mono text-sm text-gold">
                      {match.value || "(empty match)"}
                    </code>
                    <span className="text-xs text-muted-foreground">index {match.index}</span>
                  </div>
                  {match.groups.some((group) => group !== undefined) && (
                    <p className="mt-2 break-all text-xs text-muted-foreground">
                      Groups: {match.groups.map((group) => group ?? "(undefined)").join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
            No matches found.
          </p>
        )}
      </Panel>
    </div>
  );
}

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

function normalizeHex(value: string) {
  const trimmed = value.trim().replace(/^#/, "");
  if (/^[\da-f]{3}$/i.test(trimmed)) {
    return `#${trimmed.split("").map((part) => part + part).join("").toLowerCase()}`;
  }
  if (/^[\da-f]{6}$/i.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return null;
}

function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHex(hex)!;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  let s = 0;

  if (delta) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case red:
        h = ((green - blue) / delta) % 6;
        break;
      case green:
        h = (blue - red) / delta + 2;
        break;
      default:
        h = (red - green) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number) {
  const saturation = s / 100;
  const lightness = l / 100;
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

function ColorTool() {
  const [input, setInput] = useState("#d6b86a");
  const hex = normalizeHex(input);
  const rgb = hex ? hexToRgb(hex) : null;
  const hsl = rgb ? rgbToHsl(rgb) : null;
  const palette = hsl
    ? [
        hslToHex(hsl.h, hsl.s, Math.max(8, hsl.l - 25)),
        hslToHex(hsl.h, hsl.s, Math.max(18, hsl.l - 12)),
        hex!,
        hslToHex(hsl.h, hsl.s, Math.min(88, hsl.l + 12)),
        hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
      ]
    : [];

  function randomColor() {
    const random = Math.floor(Math.random() * 0x1000000);
    setInput(`#${random.toString(16).padStart(6, "0")}`);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Pick a color">
        <div className="flex flex-wrap items-center gap-4">
          <input
            aria-label="Choose a color"
            className="size-16 cursor-pointer rounded-lg border border-border bg-transparent p-1"
            type="color"
            value={hex ?? "#000000"}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="flex-1">
            <Field label="HEX" htmlFor="color-hex">
              <input
                id="color-hex"
                className={controlClass}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={7}
                spellCheck={false}
              />
            </Field>
          </div>
          <button className={buttonClass} type="button" onClick={randomColor}>
            Random
          </button>
        </div>
        {!hex && (
          <p className="mt-3 text-sm text-destructive">
            Enter a 3- or 6-digit hexadecimal color, with or without #.
          </p>
        )}
        {hex && rgb && hsl && (
          <div className="mt-6 space-y-3">
            {[
              { label: "HEX", value: hex },
              { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
              { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
            ].map((format) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-black/20 p-3"
                key={format.label}
              >
                <div>
                  <p className="text-xs text-muted-foreground">{format.label}</p>
                  <code className="mt-1 block font-mono text-sm">{format.value}</code>
                </div>
                <CopyButton value={format.value} />
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="Color palette">
        {hex && palette.length ? (
          <div className="grid grid-cols-5 gap-2">
            {palette.map((shade, index) => (
              <button
                className="group min-w-0 overflow-hidden rounded-lg border border-border text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                key={`${shade}-${index}`}
                type="button"
                onClick={() => setInput(shade)}
                aria-label={`Use color ${shade}`}
              >
                <span className="block aspect-square" style={{ backgroundColor: shade }} />
                <code className="block truncate px-1 py-2 text-center text-[0.65rem] group-hover:text-gold">
                  {shade}
                </code>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Enter a valid color to create a palette.</p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Click a swatch to use it as the new base color.
        </p>
      </Panel>
    </div>
  );
}

function HashTool() {
  const [input, setInput] = useState("Hello, World! This is a test message.");
  const [algorithm, setAlgorithm] = useState<"SHA-1" | "SHA-256" | "SHA-384" | "SHA-512">(
    "SHA-256",
  );
  const [digest, setDigest] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setDigest("");
    setError("");
    if (input.length > 1_000_000) {
      setError("Input is too large. Use at most 1,000,000 characters.");
      return;
    }
    if (!globalThis.crypto?.subtle) {
      setError("Secure browser crypto is unavailable. Open this page over HTTPS.");
      return;
    }
    setLoading(true);
    try {
      const data = new TextEncoder().encode(input);
      const result = await crypto.subtle.digest(algorithm, data);
      setDigest(Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, "0")).join(""));
    } catch {
      setError("Unable to generate this digest in the current browser.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Text to hash">
        <Field label="Input text" htmlFor="hash-input">
          <textarea
            id="hash-input"
            className={`${controlClass} min-h-64 resize-y font-mono`}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={1_000_000}
            spellCheck={false}
          />
        </Field>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-36">
            <Field label="Algorithm" htmlFor="hash-algorithm">
              <select
                id="hash-algorithm"
                className={controlClass}
                value={algorithm}
                onChange={(event) =>
                  setAlgorithm(event.target.value as typeof algorithm)
                }
              >
                <option>SHA-1</option>
                <option>SHA-256</option>
                <option>SHA-384</option>
                <option>SHA-512</option>
              </select>
            </Field>
          </div>
          <button
            className={primaryButtonClass}
            type="button"
            onClick={generate}
            disabled={loading}
          >
            {loading ? "Generating…" : "Generate digest"}
          </button>
        </div>
      </Panel>
      <Panel title="Digest">
        <textarea
          aria-label="Generated hash digest"
          className={`${outputClass} min-h-28 break-all`}
          value={digest}
          readOnly
          spellCheck={false}
        />
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-4">
          <CopyButton value={digest} label="Copy digest" />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          SHA-1 is provided for compatibility and should not be used for security
          decisions. Hashing is performed with the Web Crypto API on this device.
        </p>
      </Panel>
    </div>
  );
}

export function ToolWorkbench({ toolSlug }: { toolSlug: ToolSlug }) {
  const tool: ToolDefinition = getTool(toolSlug);
  const toolContent = (() => {
    switch (tool.slug) {
      case "json-formatter":
        return <JsonFormatter />;
      case "base64":
        return <Base64Tool />;
      case "uuid-generator":
        return <UuidTool />;
      case "url-parser":
        return <UrlParser />;
      case "timestamp-converter":
        return <TimestampTool />;
      case "regex-tester":
        return <RegexTester />;
      case "color-picker":
        return <ColorTool />;
      case "hash-generator":
        return <HashTool />;
    }
  })();

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <ToolHeading tool={tool} />
      <div className="mb-5 rounded-lg border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-muted-foreground">
        No account data or provider credentials are used by this tool. Work stays
        in your browser and is not saved.
      </div>
      {toolContent}
    </section>
  );
}
