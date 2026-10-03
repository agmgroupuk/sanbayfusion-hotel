"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAgentChatPage = /^\/agents\/[^/]+\/?$/.test(pathname ?? "");

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-eyebrow focus:text-gold-foreground"
      >
        Skip to content
      </a>
      {!isAgentChatPage && <SiteNav />}
      <main
        id="main"
        className={
          isAgentChatPage
            ? "fixed inset-0 z-[100] h-dvh w-full overflow-hidden"
            : "flex-1 pt-16 sm:pt-20"
        }
      >
        {children}
      </main>
      {!isAgentChatPage && <SiteFooter />}
    </>
  );
}
