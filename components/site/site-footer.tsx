import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-gold/30 bg-[#090807] text-gold">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>{site.legalName}</p>
        <Link
          href="/apps"
          className="w-fit text-gold/80 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Applications
        </Link>
      </div>
    </footer>
  );
}
