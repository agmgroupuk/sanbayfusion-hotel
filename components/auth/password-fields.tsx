"use client";

import { useEffect, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { passwordChecks, passwordMaxLength, passwordSchema } from "@/lib/password-policy";
import { estimatePasswordStrength } from "@/lib/password-strength";

type Props = {
  password: string; confirmation: string;
  onPasswordChange: (value: string) => void; onConfirmationChange: (value: string) => void;
  passwordLabel?: string; confirmationLabel?: string; disabled?: boolean; userInputs?: string[];
};
const inputClass = "mt-2 h-12 w-full min-w-0 rounded-sm border border-input bg-background pl-3 pr-14 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60";
const colors = ["bg-red-500", "bg-orange-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"];

export function PasswordFields({ password, confirmation, onPasswordChange, onConfirmationChange, passwordLabel = "Password", confirmationLabel = "Confirm Password", disabled = false, userInputs = [] }: Props) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [strength, setStrength] = useState<{ input: string; context: string; result: Awaited<ReturnType<typeof estimatePasswordStrength>> | null } | null>(null);
  const context = JSON.stringify(userInputs);
  useEffect(() => {
    let active = true;
    estimatePasswordStrength(password, JSON.parse(context)).then(result => {
      if (active) setStrength({ input: password, context, result });
    }).catch(() => { if (active) setStrength({ input: password, context, result: null }); });
    return () => { active = false; };
  }, [password, context]);
  const current = strength?.input === password && strength.context === context ? strength : null;
  const score = password ? current?.result?.score ?? 0 : 0;
  const label = !password ? "Very Weak" : current ? current.result?.label ?? "Strength estimate unavailable" : "Checking strength…";
  const matches = password.length > 0 && confirmation === password;
  const checks = passwordChecks(password);
  const hint = current?.result?.warning || current?.result?.suggestions[0] || "Use an unpredictable password. Avoid names, common phrases and repeated patterns.";

  function toggle(show: boolean, set: (value: boolean) => void, field: string) {
    return <button type="button" disabled={disabled} onClick={() => set(!show)} aria-label={`${show ? "Hide" : "Show"} ${field.toLowerCase()}`} aria-pressed={show} aria-controls={`${id}-${field === passwordLabel ? "password" : "confirmation"}`} className="absolute right-0 top-2 flex h-12 w-12 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {show ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
    </button>;
  }

  return <div className="min-w-0 space-y-5">
    <div>
      <label htmlFor={`${id}-password`} className="block text-sm">{passwordLabel} *</label>
      <div className="relative">
        <input id={`${id}-password`} name="password" type={showPassword ? "text" : "password"} required disabled={disabled} autoComplete="new-password" autoCapitalize="none" spellCheck={false} maxLength={passwordMaxLength} value={password} onChange={event => onPasswordChange(event.target.value)} aria-describedby={`${id}-requirements ${id}-strength ${id}-hint`} aria-invalid={password.length > 0 && !passwordSchema.safeParse(password).success} className={inputClass} />
        {toggle(showPassword, setShowPassword, passwordLabel)}
      </div>
      <ul id={`${id}-requirements`} aria-label="Password requirements" aria-live="polite" aria-atomic="true" className="mt-3 space-y-1.5 text-sm leading-relaxed">
        {checks.map(check => <li key={check.id} data-requirement={check.id} data-met={check.met} className="flex items-start gap-2">
          <span aria-hidden="true" className={`w-4 shrink-0 ${check.met ? "text-emerald-500" : "text-muted-foreground"}`}>{check.met ? "✓" : "○"}</span>
          <span><span className="sr-only">{check.met ? "Met: " : "Not met: "}</span>{check.label}</span>
        </li>)}
      </ul>
      <div className="mt-4 space-y-2">
        <p id={`${id}-strength`} role="status" aria-atomic="true" className="text-sm">Password strength: <strong>{label}</strong></p>
        <div role="meter" aria-label="Password strength" aria-valuemin={0} aria-valuemax={4} aria-valuenow={score} aria-valuetext={label} className="grid grid-cols-5 gap-1.5">
          {colors.map((color, index) => <span key={index} aria-hidden="true" className={`h-1.5 rounded-full ${password && current?.result && index <= score ? color : "bg-muted"}`} />)}
        </div>
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground">{hint} Maximum {passwordMaxLength} characters.</p>
      </div>
    </div>
    <div>
      <label htmlFor={`${id}-confirmation`} className="block text-sm">{confirmationLabel} *</label>
      <div className="relative">
        <input id={`${id}-confirmation`} name="confirmation" type={showConfirmation ? "text" : "password"} required disabled={disabled} autoComplete="new-password" autoCapitalize="none" spellCheck={false} maxLength={passwordMaxLength} value={confirmation} onChange={event => onConfirmationChange(event.target.value)} aria-describedby={`${id}-match`} aria-invalid={confirmation.length > 0 && !matches} className={inputClass} />
        {toggle(showConfirmation, setShowConfirmation, confirmationLabel)}
      </div>
      <p id={`${id}-match`} role="status" aria-atomic="true" className="mt-2 text-sm">
        <span aria-hidden="true">{confirmation ? matches ? "✓ " : "✕ " : ""}</span>{confirmation ? matches ? "Passwords match" : "Passwords do not match" : "Re-enter your password to confirm it."}
      </p>
    </div>
  </div>;
}
