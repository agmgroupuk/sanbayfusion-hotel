import { site } from "../site";
import { emailFooterHtml, emailFooterText, securityEmailAliases } from "./footer";
/** Shared source for application emails and the matching Resend dashboard templates. */
export type ManagedEmailTemplate = {
  alias: string;
  name: string;
  subject: string;
  heading: string;
  introduction: string;
  details: Array<[string, string]>;
  action?: { label: string; url: string };
  note: string;
};

const applicationDetails: Array<[string, string]> = [
  ["Reference", "{{{REQUEST_NUMBER}}}"],
  ["Membership", "{{{PLAN_NAME}}}"],
  ["Selected service months", "{{{SERVICE_MONTHS}}}"],
  ["Purchase type", "{{{PURCHASE_MODE}}}"],
  ["Application total", "{{{TOTAL_AMOUNT}}}"],
];
const meetingDetails: Array<[string, string]> = [
  ["Reference", "{{{REQUEST_NUMBER}}}"], ["Date", "{{{MEETING_DATE}}}"],
  ["Time", "{{{MEETING_TIME}}}"], ["Attendees", "{{{ATTENDEES}}}"],
  ["Purpose / notes", "{{{NOTES}}}"],
];

const accountAction = { label: "Open Account Center", url: "https://sanbayfusion.com/dashboard" };
const membershipAction = { label: "View your membership", url: "https://sanbayfusion.com/dashboard/membership" };
const securityNote = `If you did not make this change, contact ${site.emails.account} immediately. We will never ask you to email your password, authentication codes or card details.`;
const membershipReference: Array<[string, string]> = [["Reference", "{{{REQUEST_NUMBER}}}"], ["Membership", "{{{PLAN_NAME}}}"]];
const deliveryDetails: Array<[string, string]> = [["Reference", "{{{REQUEST_NUMBER}}}"], ["Service", "{{{MEAL_NAME}}}"], ["Delivery date", "{{{DELIVERY_DATE}}}"], ["Delivery time", "{{{DELIVERY_TIME}}} (Bangkok)"]];
const orderDetails: Array<[string, string]> = [["Order", "{{{ORDER_NUMBER}}}"], ["Total", "{{{TOTAL_AMOUNT}}}"], ["Order status", "{{{ORDER_STATUS}}}"], ["Payment status", "{{{PAYMENT_STATUS}}}"]];

export const managedEmailTemplates: ManagedEmailTemplate[] = [
  {
    alias: "sanbay-welcome", name: "Sanbay Fusion - Welcome", subject: "Welcome to Sanbay Fusion", heading: "Welcome to Sanbay Fusion",
    introduction: "Hello {{{CUSTOMER_NAME}}}, your account is ready. Complete your personal details, addresses and payment settings in Account Center when you are ready to apply for membership.",
    details: [], action: accountAction, note: "Creating an account does not purchase or activate a membership. Thank you for joining our community.",
  },
  {
    alias: "sanbay-password-changed", name: "Sanbay Fusion - Password changed", subject: "Your Sanbay Fusion password was changed", heading: "Password changed",
    introduction: "The password for your Sanbay Fusion account has been changed successfully. Previous signed-in sessions have been revoked.",
    details: [], action: accountAction, note: securityNote,
  },
  {
    alias: "sanbay-email-changed", name: "Sanbay Fusion - Email changed", subject: "Your Sanbay Fusion account email was changed", heading: "Email address updated",
    introduction: "Your verified email change is complete. Your account, membership and payment history remain linked to the same account. A security notice has been sent to both the previous and new addresses.",
    details: [], action: accountAction, note: securityNote,
  },
  {
    alias: "sanbay-security", name: "Sanbay Fusion - Security notification", subject: "Sanbay Fusion account security update", heading: "Security update",
    introduction: "A security setting or recovery action was recorded for your account.", details: [["Update", "{{{UPDATE_MESSAGE}}}"]], action: accountAction, note: securityNote,
  },
  {
    alias: "sanbay-account-notice", name: "Sanbay Fusion - Important account notice", subject: "Important update about your Sanbay Fusion account", heading: "Account update",
    introduction: "Please review this update to your account.", details: [["Update", "{{{UPDATE_MESSAGE}}}"]], action: accountAction, note: securityNote,
  },
  {
    alias: "sanbay-membership-under-review", name: "Sanbay Fusion - Application under review", subject: "Your Sanbay Fusion application is under review", heading: "Your application is under review",
    introduction: "Your application is in our review queue. Our team will check the saved agreement and account details, and contact you if more information is needed.",
    details: membershipReference, action: membershipAction, note: "Your membership is not active and this review notification does not confirm payment or approval.",
  },
  {
    alias: "sanbay-membership-approved", name: "Sanbay Fusion - Membership approved", subject: "Your Sanbay Fusion membership application is approved", heading: "Application approved",
    introduction: "Your application has been approved. Payment will follow the agreement you accepted. We will confirm successful payment and membership activation separately.",
    details: [...membershipReference, ["Agreed total", "{{{TOTAL_AMOUNT}}}"]], action: membershipAction, note: "Approval alone does not mean your card was charged or your membership is active.",
  },
  {
    alias: "sanbay-membership-declined", name: "Sanbay Fusion - Membership declined", subject: "An update on your Sanbay Fusion application", heading: "Application update",
    introduction: `We are unable to approve this application. Please contact ${site.emails.support} if you would like to discuss the decision or a future application.`,
    details: membershipReference, action: membershipAction, note: "This notice is not a payment receipt. Any separate card verification transaction follows its own refund process.",
  },
  {
    alias: "sanbay-membership-paid", name: "Sanbay Fusion - Membership payment successful", subject: "Sanbay Fusion membership payment received", heading: "Payment successful",
    introduction: "We have verified your membership payment. Thank you. Your activation details will arrive separately once membership setup is complete.",
    details: [...membershipReference, ["Amount paid", "{{{TOTAL_AMOUNT}}}"]], action: membershipAction, note: "Your account contains your payment record and membership status. This is a payment confirmation, not a tax invoice.",
  },
  {
    alias: "sanbay-membership-active", name: "Sanbay Fusion - Membership activated", subject: "Your Sanbay Fusion membership is activated", heading: "Membership activated",
    introduction: "Your approved, paid membership is now set up. Benefits are available during the service months shown in your saved agreement.",
    details: [...membershipReference, ["Service months", "{{{SERVICE_MONTHS}}}"], ["Membership ends", "{{{EXPIRY_DATE}}} at 00:00 Bangkok time"]], action: membershipAction, note: "Selected service months define your entitlement. Unselected months between them do not provide benefits. View Account Center for delivery and Standard Meal scheduling.",
  },
  {
    alias: "sanbay-membership-id", name: "Sanbay Fusion - Membership ID issued", subject: "Your Sanbay Fusion membership ID", heading: "Your membership ID",
    introduction: "Your membership ID has been issued. Use this reference when contacting our team about your membership.",
    details: [...membershipReference, ["Membership ID", "{{{MEMBER_ID}}}"]], action: membershipAction, note: "Your membership ID identifies your record. Access to benefits depends on your current membership status and selected service months.",
  },
  {
    alias: "sanbay-membership-expiry-reminder", name: "Sanbay Fusion - Membership expiry reminder", subject: "Your Sanbay Fusion membership ends soon", heading: "Your membership ends soon",
    introduction: "Your membership is approaching the end of its agreed term. Check any remaining eligible benefits and delivery arrangements in your account.",
    details: [...membershipReference, ["Membership ends", "{{{EXPIRY_DATE}}} at 00:00 Bangkok time"]], action: membershipAction, note: "There is no automatic renewal implied by this email. A new membership requires a new application and agreement.",
  },
  {
    alias: "sanbay-membership-expired", name: "Sanbay Fusion - Membership expired", subject: "Your Sanbay Fusion membership term has ended", heading: "Membership term completed",
    introduction: "Your membership term has ended. Thank you for being part of Sanbay Fusion. Your past membership and payment records remain available in your account.",
    details: [...membershipReference, ["Membership ended", "{{{EXPIRY_DATE}}} at 00:00 Bangkok time"]], action: membershipAction, note: "Expired benefits are no longer available. Contact our team if you would like help with a new application.",
  },
  {
    alias: "sanbay-meal-scheduled", name: "Sanbay Fusion - Standard Meal scheduled", subject: "Your Sanbay Fusion Standard Meal schedule", heading: "Standard Meal scheduled",
    introduction: "Your Standard Meal delivery preference has been saved. Review the date and time below, and open your account to check the meal selection and any payable extras.",
    details: deliveryDetails, action: membershipAction, note: "Scheduling does not spend your meal allowance or confirm payment for extra food. The saved order and fulfillment status in your account remain authoritative.",
  },
  {
    alias: "sanbay-delivery-reminder", name: "Sanbay Fusion - Delivery reminder", subject: "Your Sanbay Fusion delivery is tomorrow", heading: "Your delivery is coming up",
    introduction: "This is a reminder of your saved delivery schedule for tomorrow. Please check your delivery address and availability, and contact our team if you need assistance.",
    details: deliveryDetails, action: membershipAction, note: "A schedule reminder does not confirm dispatch. Orders with unpaid extras must complete payment before fulfillment.",
  },
  {
    alias: "sanbay-order-confirmation", name: "Sanbay Fusion - Order confirmation", subject: "Your Sanbay Fusion order is confirmed", heading: "Order confirmed",
    introduction: "Thank you for your order. Its payable amount has been settled, including any eligible Standard Meal allowance. Your order details are saved in your account.",
    details: orderDetails, action: accountAction, note: `This confirms your order, not delivery completion. Contact ${site.emails.support} and quote your order reference for assistance.`,
  },
  {
    alias: "sanbay-order-update", name: "Sanbay Fusion - Order status update", subject: "An update on your Sanbay Fusion order", heading: "Order update",
    introduction: "The status of your order or delivery has changed. Please review the details below.",
    details: orderDetails, action: accountAction, note: "Payment and fulfillment are separate. A cancellation is not a refund confirmation unless the payment status explicitly says refunded.",
  },
  {
    alias: "sanbay-contact-received", name: "Sanbay Fusion - Support acknowledgement", subject: "We received your Sanbay Fusion enquiry", heading: "Thank you for getting in touch",
    introduction: "Hello {{{CUSTOMER_NAME}}}, your message has been received by our support team. We will review your enquiry and reply using the contact details you provided.",
    details: [], note: "For follow-up, reply to this email. Please do not send passwords, authentication codes or full payment card details.",
  },
  {
    alias: "sanbay-password-reset", name: "Sanbay Fusion - Password reset",
    subject: "Reset your Sanbay Fusion password", heading: "Reset your password",
    introduction: "We received a request to reset your Sanbay Fusion password. Use the secure link below to choose a new password.",
    details: [], action: { label: "Reset password", url: "{{{SECURE_URL}}}" },
    note: "This link expires in one hour and can only be used once. If you did not request this change, ignore this email. Your password remains unchanged.",
  },
  {
    alias: "sanbay-email-verification", name: "Sanbay Fusion - Confirm email change",
    subject: "Confirm your Sanbay Fusion email change", heading: "Confirm your new email",
    introduction: "Confirm this address while signed in to your existing Sanbay Fusion account to complete your requested email change.",
    details: [], action: { label: "Confirm email address", url: "{{{SECURE_URL}}}" },
    note: "This link expires in 30 minutes. If you did not request this change, ignore this email. Your current email address remains unchanged.",
  },
  {
    alias: "sanbay-membership-received", name: "Sanbay Fusion - Membership application received",
    subject: "Your Sanbay Fusion membership application was received", heading: "Application received",
    introduction: "Hello {{{CUSTOMER_NAME}}}, thank you for submitting your membership application. Our team will review your information and may contact you before approval.",
    details: applicationDetails,
    action: { label: "View your application", url: "https://sanbayfusion.com/dashboard/membership" },
    note: "Status: Pending review. The membership amount has not been charged and your membership is not active. Your saved application shows the agreed amount and selected service months.",
  },
  {
    alias: "sanbay-membership-review", name: "Sanbay Fusion - Staff membership review",
    subject: "Sanbay Fusion membership application requires review", heading: "Membership review required",
    introduction: "A customer has submitted a membership application. Review the saved account information, payment verification and agreement before approving it.",
    details: [["Customer", "{{{CUSTOMER_NAME}}}"], ["Email", "{{{CUSTOMER_EMAIL}}}"], ["Phone", "{{{CUSTOMER_PHONE}}}"], ...applicationDetails],
    action: { label: "Open staff review", url: "https://sanbayfusion.com/admin/activate-membership" },
    note: "Status: Pending review. The membership amount has not been charged and the membership is not active. Only authorized staff can approve the application.",
  },
  {
    alias: "sanbay-meeting-received", name: "Sanbay Fusion - Meeting request received",
    subject: "Your Sanbay Fusion meeting request was received", heading: "Meeting request received",
    introduction: "Hello {{{CUSTOMER_NAME}}}, thank you for contacting Sanbay Fusion. We have received your meeting request and will contact you to confirm the details.",
    details: meetingDetails,
    note: "This is a request acknowledgement, not a confirmed booking. Our team will review the details and confirm your meeting directly.",
  },
  {
    alias: "sanbay-meeting-staff", name: "Sanbay Fusion - Staff meeting notification",
    subject: "New Sanbay Fusion meeting request", heading: "New meeting request",
    introduction: "A customer has requested a meeting. Review the details below and contact the customer to confirm availability.",
    details: [["Customer", "{{{CUSTOMER_NAME}}}"], ["Email", "{{{CUSTOMER_EMAIL}}}"], ["Phone", "{{{CUSTOMER_PHONE}}}"], ...meetingDetails],
    note: "This meeting has not been automatically confirmed. Confirm availability with the customer before treating it as a booking.",
  },
  {
    alias: "sanbay-contact-staff", name: "Sanbay Fusion - Staff contact enquiry",
    subject: "New Sanbay Fusion enquiry", heading: "New customer enquiry",
    introduction: "A customer sent an enquiry through the Sanbay Fusion website.",
    details: [["Customer", "{{{CUSTOMER_NAME}}}"], ["Email", "{{{CUSTOMER_EMAIL}}}"], ["Phone", "{{{CUSTOMER_PHONE}}}"], ["Message", "{{{MESSAGE}}}"]],
    note: "Respond using the customer's supplied contact details. Website enquiry text is customer-provided content.",
  },
];

export function escapeEmailHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function managedTemplateContent(template: ManagedEmailTemplate) {
  const escape = escapeEmailHtml;
  const paragraph = "font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#3f392e;";
  const details = template.details.map(([label, value]) => `<tr><td bgcolor="#ffffff" style="${paragraph}padding-top:10px;padding-bottom:10px;padding-left:16px;padding-right:16px;"><strong>${escape(label)}</strong><br>${escape(value)}</td></tr>`).join("");
  const action = template.action ? `<tr><td bgcolor="#faf8f3" style="padding-top:24px;padding-bottom:12px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#1a1712" style="padding-top:14px;padding-bottom:14px;padding-left:22px;padding-right:22px;"><a href="${escape(template.action.url)}" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#e6c17a;text-decoration:none;">${escape(template.action.label)}</a></td></tr></table></td></tr>` : "";
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>${escape(template.subject)}</title></head><body style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;background-color:#eeeae2;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#eeeae2" style="padding-top:24px;padding-bottom:24px;padding-left:12px;padding-right:12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;"><tr><td align="center" bgcolor="#1a1712" style="padding-top:24px;padding-bottom:24px;"><img src="${site.url}${site.logo}" width="240" height="120" border="0" alt="Sanbay Fusion" style="display:block;"></td></tr><tr><td bgcolor="#faf8f3" style="padding-top:30px;padding-bottom:30px;padding-left:28px;padding-right:28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#faf8f3"><h1 style="font-family:Georgia,Arial,serif;font-size:28px;line-height:36px;color:#1a1712;margin-top:0;margin-bottom:16px;">${escape(template.heading)}</h1><p style="${paragraph}margin-top:0;margin-bottom:24px;">${escape(template.introduction)}</p></td></tr>${details}${action}<tr><td bgcolor="#faf8f3"><p style="${paragraph}font-size:14px;line-height:22px;margin-top:24px;margin-bottom:0;">${escape(template.note)}</p></td></tr></table></td></tr><tr><td align="center" bgcolor="#1a1712" style="padding-top:18px;padding-bottom:18px;">${emailFooterHtml(securityEmailAliases.has(template.alias))}</td></tr></table></td></tr></table></body></html>`;
  const text = ["SANBAY FUSION", template.heading, template.introduction, ...template.details.map(([label, value]) => `${label}: ${value}`), template.action ? `${template.action.label}: ${template.action.url}` : "", template.note, emailFooterText(securityEmailAliases.has(template.alias))].filter(Boolean).join("\n\n");
  const variables = [...new Set([...`${html}\n${text}`.matchAll(/\{\{\{([A-Z_]+)\}\}\}/g)].map(match => match[1]))].map(key => ({ key, type: "string" as const }));
  return { html, text, variables };
}

/** Escape customer values in HTML while keeping the plain-text version readable. */
export function renderManagedEmail(alias: string, values: Record<string, string>) {
  const template = managedEmailTemplates.find(item => item.alias === alias);
  if (!template) throw new Error("Unknown transactional email template");
  const content = managedTemplateContent(template);
  for (const variable of content.variables) {
    if (typeof values[variable.key] !== "string" || !values[variable.key]) {
      throw new Error(`Missing email variable: ${variable.key}`);
    }
  }
  if (values.SECURE_URL) {
    const url = new URL(values.SECURE_URL);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
      throw new Error("Invalid account email link");
    }
  }
  return {
    subject: template.subject,
    html: content.html.replace(/\{\{\{([A-Z_]+)\}\}\}/g, (_, key: string) => escapeEmailHtml(values[key])),
    text: content.text.replace(/\{\{\{([A-Z_]+)\}\}\}/g, (_, key: string) => values[key]),
  };
}
