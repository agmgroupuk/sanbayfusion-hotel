"use client";
import React from "react";
import { createRoot } from "react-dom/client";
import { PersonalInformation, AddressManager, PaymentMethods, SecuritySettings } from "../components/account/account-forms";
import { AccountNavigation } from "../components/account/account-navigation";
const root = createRoot(document.getElementById("root")!);
function Frame({ children }: { children: React.ReactNode }) { return <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8"><header className="border-b border-border pb-8"><p className="text-eyebrow text-gold">Sanbay Fusion · Customer account</p><h1 className="mt-3 font-display text-4xl">Welcome, Sandbox</h1></header><div className="mt-8 grid min-w-0 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]"><aside className="min-w-0"><AccountNavigation /></aside><div className="min-w-0">{children}</div></div></div>; }
declare global { interface Window {
 mountProfile: (props: React.ComponentProps<typeof PersonalInformation>) => void;
 mountAddresses: (props: React.ComponentProps<typeof AddressManager>) => void;
 mountCards: (props: React.ComponentProps<typeof PaymentMethods>) => void;
 mountSecurity: (props: React.ComponentProps<typeof SecuritySettings>) => void;
} }
window.mountProfile=props=>root.render(<Frame><PersonalInformation {...props}/></Frame>);
window.mountAddresses=props=>root.render(<Frame><AddressManager {...props}/></Frame>);
window.mountCards=props=>root.render(<Frame><PaymentMethods {...props}/></Frame>);
window.mountSecurity=props=>root.render(<Frame><SecuritySettings {...props}/></Frame>);
