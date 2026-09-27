"use client";

export function AdminApprovalForm({ action }: { action: () => Promise<void> }) {
  return <form action={action} onSubmit={(event) => {
    if (!window.confirm("Approve this paid membership and activate its 12-month term now?")) event.preventDefault();
  }}><button className="mt-6 rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground">APPROVE &amp; ACTIVATE MEMBERSHIP</button></form>;
}
