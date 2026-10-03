"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

function PreviewLoading({ label }: { label: string }) {
  return (
    <div
      aria-label={label}
      className="min-h-64 rounded-2xl border border-border bg-background/60 p-5 sm:p-7"
    >
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="mt-5 h-32 rounded-lg border border-border/70 bg-card/60" />
      <p className="mt-4 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

const ToolWorkbench = dynamic(
  () =>
    import("@/app/tools/tool-workbench").then((module) => module.ToolWorkbench),
  {
    ssr: false,
    loading: () => <PreviewLoading label="Loading the existing browser tool…" />,
  },
);

const LabWorkbench = dynamic(
  () =>
    import("@/app/labs/lab-workbench").then((module) => module.LabWorkbench),
  {
    ssr: false,
    loading: () => <PreviewLoading label="Loading the live experiment…" />,
  },
);

export function HomeInteractivePreview({
  kind,
}: {
  kind: "tool" | "lab";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (typeof window.IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setNearViewport(true), 0);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="min-w-0" aria-busy={!nearViewport}>
      {!nearViewport ? (
        <PreviewLoading label="Interactive preview loads as you scroll." />
      ) : kind === "tool" ? (
        <ToolWorkbench toolSlug="json-formatter" embedded />
      ) : (
        <LabWorkbench
          experiment="story-weaver"
          title="Story Weaver"
          embedded
        />
      )}
    </div>
  );
}
