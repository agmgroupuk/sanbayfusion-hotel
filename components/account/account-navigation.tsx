"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
const sections = [["", "Overview"], ["personal", "Personal information"], ["addresses", "Addresses"], ["payment-methods", "Payment methods"], ["security", "Security"], ["membership", "Membership"], ["payments", "Invoices / payments"]];
export function AccountNavigation() {
 const pathname = usePathname(); const router = useRouter();
 return <><label className="block text-sm text-muted-foreground lg:hidden">Account section<select aria-label="Account section" value={sections.some(([slug]) => pathname === `/dashboard${slug ? `/${slug}` : ""}`) ? pathname : "/dashboard"} onChange={event => router.push(event.target.value)} className="mt-2 h-12 w-full rounded-sm border border-gold/40 bg-background px-3 text-foreground">{sections.map(([slug, label]) => <option key={slug} value={`/dashboard${slug ? `/${slug}` : ""}`}>{label}</option>)}</select></label><nav aria-label="Account navigation" className="hidden gap-2 lg:flex lg:flex-col">{sections.map(([slug, label]) => { const href = `/dashboard${slug ? `/${slug}` : ""}`; const active = pathname === href; return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`shrink-0 rounded-sm border px-4 py-3 text-sm transition-colors ${active ? "border-gold/50 bg-gold/10 text-gold" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}>{label}</Link>; })}</nav></>;
}
