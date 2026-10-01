"use client";

import { useEffect, useId, useRef } from "react";
import { useLenis } from "lenis/react";
import { X } from "lucide-react";

export function MembershipDialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const lenis = useLenis();
  useEffect(() => {
    if (!open) return;
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    lenis?.stop();
    return () => { dialog.close(); document.body.style.overflow = overflow; lenis?.start(); previous?.focus(); };
  }, [open, lenis]);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={onClose} onClick={event => { if (event.target === ref.current) onClose(); }} data-lenis-prevent className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-sm border border-gold/50 bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm">
    <div className="p-6 sm:p-9"><div className="flex items-start justify-between gap-5"><h2 id={titleId} className="font-display text-3xl sm:text-4xl">{title}</h2><button type="button" autoFocus onClick={onClose} aria-label="Close dialog" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border hover:border-gold hover:text-gold"><X aria-hidden="true" className="size-5" /></button></div>{children}</div>
  </dialog>;
}
