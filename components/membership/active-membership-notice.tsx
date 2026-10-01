"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { MembershipDialog } from "./membership-dialog";

export function ActiveMembershipNotice() {
  const [open, setOpen] = useState(false);
  return <div className="space-y-3"><button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-full border border-gold/60 bg-gold/10 px-4 py-3 text-sm text-gold"><Check className="size-4 shrink-0" aria-hidden="true" />Membership already active</button><Link href="/dashboard/membership" className="block text-center text-sm text-gold underline underline-offset-4">View my membership</Link>
    <MembershipDialog open={open} onClose={() => setOpen(false)} title="Your membership is already active">
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground"><p>Your Sanbay Fusion membership is already active. You cannot purchase another membership while your current membership is active or has selected service months remaining.</p><p>Please use your Customer Dashboard to view your membership, selected service months, benefits, and orders.</p></div>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/dashboard/membership" className="rounded-full bg-gold px-5 py-3 text-sm text-gold-foreground">View my membership</Link><button type="button" onClick={() => setOpen(false)} className="rounded-full border border-border px-5 py-3 text-sm">Close</button></div>
    </MembershipDialog>
  </div>;
}
