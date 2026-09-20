import { Reveal } from "@/components/motion/reveal";
import { KineticText } from "@/components/motion/kinetic-text";
import { cn } from "@/lib/utils";

/** Editorial page header. Adds top padding to clear the fixed nav. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mx-auto max-w-7xl px-5 pt-36 pb-14 sm:px-8 sm:pt-52 sm:pb-20",
        className,
      )}
    >
      {eyebrow && (
        <Reveal variant="fade" className="text-eyebrow text-gold">
          {eyebrow}
        </Reveal>
      )}
      <KineticText
        as="h1"
        text={title}
        delay={0.08}
        stagger={0.09}
        className="text-h1 mt-6 font-display font-light"
      />
      {lead && (
        <Reveal variant="up" delay={0.25}>
          <p className="lead measure mt-7">{lead}</p>
        </Reveal>
      )}
    </header>
  );
}
