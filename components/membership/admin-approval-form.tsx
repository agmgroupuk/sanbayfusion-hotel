"use client";
import { useState } from "react";
export function AdminApprovalForm({ approve, decline, legacy = false, approveLabel }: { approve: () => Promise<string>; decline?: () => Promise<string>; legacy?: boolean; approveLabel?: string }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function run(action: () => Promise<string>) {
    setBusy(true);
    try { setMessage(await action()); } catch { setMessage("Unable to complete review. Refresh to check the latest status before retrying."); } finally { setBusy(false); }
  }
  return <div className="mt-6 space-y-4"><div className="flex flex-wrap gap-4"><button disabled={busy} onClick={() => run(approve)} className="rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground disabled:opacity-50">{approveLabel ?? (legacy ? "ACTIVATE PAID MEMBERSHIP" : "APPROVE & ATTEMPT AUTHORIZED CHARGE")}</button>{decline && <button disabled={busy} onClick={() => run(decline)} className="rounded-full border border-foreground/40 px-6 py-3 text-eyebrow disabled:opacity-50">DECLINE WITHOUT CHARGE</button>}</div>{message && <p role="status">{message}</p>}</div>;
}
