import {
  PortableText as BasePortableText,
  type PortableTextComponents,
} from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/react";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mt-5 first:mt-0">{children}</p>,
  },
  marks: {
    em: ({ children }) => <em className="italic">{children}</em>,
    strong: ({ children }) => <strong className="font-medium text-foreground">{children}</strong>,
  },
};

export function PortableText({ value }: { value: PortableTextBlock[] }) {
  return (
    <div className="measure text-foreground/90">
      <BasePortableText value={value} components={components} />
    </div>
  );
}
