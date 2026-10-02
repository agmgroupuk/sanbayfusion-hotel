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
      updated="2 October 2026"
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
          Our sign-in cookie, sbf_customer_session, maintains your authenticated session for up to 30 days. Signing out removes it. Membership checkout uses sbf_membership_checkout and numbered companion cookies to preserve selections for up to 24 hours while you sign in and complete your account. Prices are validated by the server when those selections are restored.
        </p>
        <p>Browser session storage also keeps membership configuration, a submission reference and the return path through Account Center. It is normally cleared when the browser tab or session ends. Deleting browser storage does not delete records already submitted to your account.</p>
        <p>Stripe uses browser technologies for payment functionality and fraud prevention. Google address search and Sanity content requests may involve third-party technologies when configured. The Contact map is currently pending and does not load an embedded map. No separate advertising or site-analytics tracker is included in the current application.</p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can control or delete cookies through your browser settings. Blocking
          essential cookies prevents sign-in or interrupts membership checkout. Blocking third-party services may affect payments or address search. This website does not currently provide a separate cookie-preference panel. See the Privacy Policy for how submitted information is handled.
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
