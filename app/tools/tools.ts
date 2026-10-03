import {
  Binary,
  Clock,
  Code2,
  FileJson,
  Hash,
  Key,
  Palette,
  type LucideIcon,
} from "lucide-react";

export const TOOLS = [
  {
    slug: "json-formatter",
    title: "JSON Formatter",
    description: "Validate, format, and compact JSON in your browser.",
    icon: FileJson,
  },
  {
    slug: "base64",
    title: "Base64 Encoder / Decoder",
    description: "Encode or decode UTF-8 text, including non-Latin characters.",
    icon: Binary,
  },
  {
    slug: "uuid-generator",
    title: "UUID Generator",
    description: "Generate cryptographically random UUID v4 values and validate UUIDs.",
    icon: Key,
  },
  {
    slug: "url-parser",
    title: "URL Parser",
    description: "Inspect URL components and query parameters.",
    icon: Code2,
  },
  {
    slug: "timestamp-converter",
    title: "Timestamp Converter",
    description: "Convert Unix timestamps and local date-time values.",
    icon: Clock,
  },
  {
    slug: "regex-tester",
    title: "Regex Tester",
    description: "Test JavaScript regular expressions against sample text.",
    icon: Code2,
  },
  {
    slug: "color-picker",
    title: "Color Picker",
    description: "Convert HEX, RGB, and HSL colors and build a quick palette.",
    icon: Palette,
  },
  {
    slug: "hash-generator",
    title: "Hash Generator",
    description: "Generate SHA-1, SHA-256, SHA-384, and SHA-512 digests locally.",
    icon: Hash,
  },
] as const satisfies readonly {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
}[];

export type ToolSlug = (typeof TOOLS)[number]["slug"];

export function isToolSlug(slug: string): slug is ToolSlug {
  return TOOLS.some((tool) => tool.slug === slug);
}

export function getTool(slug: ToolSlug) {
  return TOOLS.find((tool) => tool.slug === slug)!;
}
