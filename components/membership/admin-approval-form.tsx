"use client";

import Link from "next/link";

export function AdminApprovalForm({ action }: { action: () => Promise<void> }) {
  return <form action={action} onSubmit={(event) => {
    if (!window.confirm("Approve this paid membership and activate its selected membership term now?")) event.preventDefault();
  }}><div className="mt-6 flex flex-wrap items-center gap-4"><button className="rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground">APPROVE &amp; ACTIVATE MEMBERSHIP</button><Link href="/admin/membership-deliveries" className="text-eyebrow text-gold underline">MANAGE DELIVERY SCHEDULE</Link></div></form>;
}
