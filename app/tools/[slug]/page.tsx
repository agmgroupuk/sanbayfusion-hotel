import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolWorkbench } from "@/app/tools/tool-workbench";
import { getTool, isToolSlug, TOOLS } from "@/app/tools/tools";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isToolSlug(slug)) return {};
  const tool = getTool(slug);
  return {
    title: tool.title,
    description: tool.description,
  };
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isToolSlug(slug)) notFound();
  return <ToolWorkbench toolSlug={slug} />;
}
