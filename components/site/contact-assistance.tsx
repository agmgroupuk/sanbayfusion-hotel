import Link from "next/link";
import { site } from "@/lib/site";

export function ContactAssistance({ personal = false }: { personal?: boolean }) {
  return <div className="mt-8 border-t border-gold/25 pt-6 text-sm leading-7">
    <p className="font-medium text-foreground">{personal ? `Manager: ${site.managerName}` : "Need assistance? Speak with our team."}</p>
    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-gold">
      <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center underline underline-offset-4">Tel: {site.phone}</a>
      <a href={`mailto:${site.email}`} className="inline-flex min-h-11 items-center break-all underline underline-offset-4">{site.email}</a>
      <Link href="/contact" className="inline-flex min-h-11 items-center underline underline-offset-4">Contact details</Link>
    </div>
  </div>;
}
