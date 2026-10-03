import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gold/25 bg-card/80 text-card-foreground shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
