import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LabWorkbench } from "../lab-workbench";

const titles: Record<string, string> = {
  "battle-arena": "Battle Arena",
  "debate-arena": "Debate Arena",
  "dream-interpreter": "Dream Interpreter",
  "emotion-visualizer": "Emotion Visualizer",
  "future-predictor": "Future Predictor",
  "personality-mirror": "Personality Mirror",
  "story-weaver": "Story Weaver",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ experiment: string }>;
}): Promise<Metadata> {
  const { experiment } = await params;
  return { title: Object.hasOwn(titles, experiment) ? titles[experiment] : "Labs" };
}

export default async function LabExperimentPage({
  params,
}: {
  params: Promise<{ experiment: string }>;
}) {
  const { experiment } = await params;
  if (!Object.hasOwn(titles, experiment)) notFound();
  return <LabWorkbench experiment={experiment} title={titles[experiment]} />;
}
