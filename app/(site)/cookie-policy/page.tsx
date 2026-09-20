import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `How cookies and similar technologies are used on the ${site.name} website.`,
  alternates: { canonical: "/cookie-policy" },
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      lead="A clear look at the small files and technologies that help this website work."
      updated="20 September 2026"
    >
      <LegalSection title="What cookies are">
        <p>
          Cookies are small text files stored on your device. Similar technologies may
          remember preferences, help pages load correctly, or provide information about
          how the site is used.
        </p>
      </LegalSection>

      <LegalSection title="How we use them">
        <p>
          We may use essential cookies to provide core website functions, maintain
          security, and remember choices. If analytics, embedded maps, video, or other
          third-party services are enabled, those providers may set their own cookies.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can control or delete cookies through your browser settings. Blocking
          essential cookies may affect reservations, forms, maps, or other website
          features. Any consent controls shown on this website take priority for the
          services they cover.
        </p>
      </LegalSection>

      <LegalSection title="Questions">
        <p>
          For questions about cookies or privacy, contact{" "}
          <a className="text-gold underline decoration-gold/50 underline-offset-4" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}