import type { Metadata } from "next";
import { site } from "@/lib/site";

/** Public SEO inventory: metadata and the sitemap share the same routes. */
export const publicPageSeo = {
  "/": { title: "Memberships for International Visitors to Thailand", description: "Food memberships for eligible international visitors travelling to Thailand. Plan service months, meals and deliveries, or enquire about private events." },
  "/plans": { title: "Membership Plans for International Visitors", description: "Compare 1–12 month memberships for eligible international visitors to Thailand. Choose travel service months and Standard Meals; applications require approval." },
  "/how-it-works": { title: "How Membership Works for International Visitors", description: "Plan your Thailand visit: complete your profile, select service months and meals, then apply. Membership requires review, approval and successful payment." },
  "/about": { title: "About Sanbay Fusion Foods Company Limited", description: "Meet Sanbay Fusion Foods Company Limited: food memberships designed for eligible international visitors to Thailand, plus bespoke private hospitality." },
  "/events": { title: "Private Events & Bespoke Hospitality in Thailand", description: "Plan private dinners, celebrations, villa events, corporate gatherings and bespoke hospitality experiences in Thailand with Sanbay Fusion." },
  "/faq": { title: "Membership & Visitor FAQs", description: "Answers about international visitor eligibility, selected travel months, Standard Meals, application approval, payments, delivery and private event enquiries." },
  "/contact": { title: "Contact Sanbay Fusion in Bangkok", description: `Contact ${site.legalName} in Bangkok for visitor memberships, delivery and private events. Call ${site.phone} or email ${site.email}.` },
  "/membership": { title: "Food Memberships for International Visitors", description: "Explore food memberships exclusively for eligible foreign visitors normally living outside Thailand. Plan selected service months and apply for review." },
  "/pricing": { title: "Membership Pricing & Standard Meal Benefits", description: "Compare current 1–12 month membership fees and included Standard Meal allowances for eligible international visitors travelling to Thailand." },
  "/catalogue": { title: "Food & Refreshments Catalogue", description: "Explore Thai and international food, refreshments and menu inspiration for Sanbay Fusion visitor memberships. Availability and eligible products require confirmation." },
  "/menu": { title: "Food & Refreshments Menu", description: "Explore Sanbay Fusion food and refreshments for Standard Meals, optional prepaid packages and member orders during your visit to Thailand." },
  "/story": { title: "Our Story", description: "Discover the Sanbay Fusion approach to food, hospitality and advance planning for international visitors travelling to Thailand." },
  "/delivery-areas": { title: "Bangkok Delivery Areas", description: "Explore Sanbay Fusion's Bangkok delivery coverage and scheduled delivery windows. Confirm availability for your address before arranging membership services." },
  "/delivery-area": { title: "Check Delivery Availability", description: "Check delivery availability for your Thailand stay. Sanbay Fusion currently delivers within Bangkok, subject to address and schedule confirmation." },
  "/reservations": { title: "Schedule a Meeting", description: "Request a meeting with Sanbay Fusion to discuss visitor memberships, private events, catering or partnerships. Requests are subject to team confirmation." },
  "/accessibility": { title: "Accessibility", description: "Read Sanbay Fusion's accessibility information and contact our team for help using the website and arranging services." },
  "/cookie-policy": { title: "Cookie Policy", description: "Learn how Sanbay Fusion uses cookies and related technologies for website functionality, account access and customer preferences." },
  "/privacy-policy": { title: "Privacy Policy", description: "How Sanbay Fusion Foods Company Limited handles account, visitor membership, order, delivery and event enquiry information." },
  "/terms-and-conditions": { title: "Terms & Conditions", description: "Read Sanbay Fusion's terms for eligible international visitor memberships, application approval, payments, services and private event enquiries." },
} as const;
export type PublicPagePath = keyof typeof publicPageSeo;

export function createPageMetadata(path: string, title: string, description: string): Metadata {
  const fullTitle = `${title} | ${site.name}`;
  const url = site.canonicalUrl ? new URL(path, site.canonicalUrl).href : undefined;
  const image = { url: `${site.url}/opengraph-image`, width: 1200, height: 630, alt: `${site.name} — memberships for international visitors and bespoke hospitality` };
  return {
    title: { absolute: fullTitle },
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: { type: "website", locale: "en_US", title: fullTitle, description, siteName: site.name, url, images: [image] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [{ ...image, url: `${site.url}/twitter-image` }] },
  };
}

export function pageMetadata(path: PublicPagePath): Metadata {
  const { title, description } = publicPageSeo[path];
  return createPageMetadata(path, title, description);
}
