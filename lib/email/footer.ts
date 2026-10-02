import { site, socialProfiles } from "../site";

const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
export const securityEmailAliases = new Set(["sanbay-password-reset", "sanbay-password-changed", "sanbay-email-verification", "sanbay-email-changed", "sanbay-security", "sanbay-account-notice"]);

export function emailFooterHtml(security = false) {
  const email = security ? site.emails.account : site.email;
  const links = security ? "" : socialProfiles.filter(profile => profile.url).map(profile => `<a href="${escape(profile.url!)}" target="_blank" rel="noopener noreferrer" title="${profile.name}" style="display:inline-block;padding:10px;text-decoration:none;"><img src="${site.url}/brand/social/${profile.id}.png" alt="${profile.name}" width="24" height="24" border="0" style="display:inline-block;vertical-align:middle;"></a>`).join("");
  return `<div style="background-color:#1a1712;padding:20px 16px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:22px;color:#e6c17a;"><p style="margin:0;">${escape(site.legalName)}${security ? "" : `<br>Manager: ${escape(site.managerName)}`}<br><a href="tel:${site.phone.replace(/\s/g, "")}" style="color:#e6c17a;">${site.phone}</a><br><a href="mailto:${email}" style="color:#e6c17a;">${email}</a><br><a href="${site.url}/contact" style="color:#e6c17a;">Contact Sanbay Fusion</a></p>${links ? `<div style="margin-top:12px;">${links}</div><p style="margin:8px 0 0;">LINE ID: ${site.socialHandle}<br>WhatsApp username: ${site.socialHandle}</p>` : ""}</div>`;
}

export function emailFooterText(security = false) {
  return [site.legalName, security ? "" : `Manager: ${site.managerName}`, `Tel: ${site.phone}`, security ? site.emails.account : site.email, `${site.url}/contact`, ...(!security ? [...socialProfiles.filter(profile => profile.url).map(profile => `${profile.name}: ${profile.url}`), `LINE ID: ${site.socialHandle}`, `WhatsApp username: ${site.socialHandle}`] : [])].filter(Boolean).join("\n");
}
