import { describe, expect, it } from "vitest";
import { managedEmailTemplates, managedTemplateContent } from "./managed-templates";
import { securityEmailAliases } from "./footer";
import { site, socialProfiles } from "../site";
import { businessStructuredData } from "../business-schema";

describe("shared official contact and social footer", () => {
  it("keeps unconfirmed messaging destinations out of links and structured data", () => {
    expect(site.social.lineUrl).toBeNull();
    expect(site.social.whatsappUrl).toBeNull();
    expect(businessStructuredData()["@graph"][0]).toMatchObject({ sameAs: [site.social.facebookUrl, site.social.instagramUrl, site.social.tiktokUrl] });
    for (const profile of socialProfiles) if (profile.url) {
      expect(new URL(profile.url).protocol).toBe("https:");
      expect(profile.url).not.toContain("#");
    }
  });
  it("updates every transactional footer without promoting social profiles in security messages", () => {
    for (const template of managedEmailTemplates) {
      const { html, text } = managedTemplateContent(template);
      expect(html).toContain(site.legalName);
      expect(html).toContain('href="tel:+66808972129"');
      expect(text).toContain(site.phone);
      expect(html).not.toMatch(/href="#"|wa\.me|line\.me|api\.whatsapp/);
      if (securityEmailAliases.has(template.alias)) {
        expect(html).not.toContain("/brand/social/");
        expect(html).not.toContain(site.managerName);
        expect(html).toContain(`mailto:${site.emails.account}`);
      } else {
        expect(text).toContain(`Manager: ${site.managerName}`);
        expect(text).toContain("WhatsApp username: sanbayfusion");
        expect(text).not.toMatch(/WhatsApp username:.*\+66/);
        for (const profile of socialProfiles.filter(profile => profile.url)) {
          expect(html).toContain(`href="${profile.url}"`);
          expect(html).toContain(`alt="${profile.name}"`);
        }
      }
    }
  });
});
