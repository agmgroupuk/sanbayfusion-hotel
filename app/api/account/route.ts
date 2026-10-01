import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountError } from "@/lib/account/types";
import { addCardSetup, completeCardSetup, changeCard, listCards, updateProfile, saveAddress, changeAddress, requestEmailChange, confirmEmailChange } from "@/lib/account/service";
import { beginTwoFactor, enableTwoFactor, disableTwoFactor, changePassword, rateLimit, securityStatus } from "@/lib/account/security";
export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account || !db) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    await rateLimit("account-mutation", account.id, 100);
    const body = await request.json();
    const password = typeof body.currentPassword === "string" ? body.currentPassword.slice(0, 200) : "";
    const code = typeof body.code === "string" ? body.code.slice(0, 50) : "";
    let data: object = {};
    let message = "Changes saved.";
    switch (body.action) {
      case "profile": await updateProfile(account.id, body.profile); message = "Profile updated successfully."; break;
      case "address-save": await saveAddress(account.id, body.address); message = "Address saved."; break;
      case "address-default": await changeAddress(account.id, body.id, false); message = "Default address updated."; break;
      case "address-delete": await changeAddress(account.id, body.id, true); message = "Address deleted."; break;
      case "card-add": data = await addCardSetup(account.id, body.requestId); message = "Secure card setup ready. No charge will be made."; break;
      case "card-complete": data = { cards: await completeCardSetup(account.id, body.setupId) }; message = "Payment method saved securely."; break;
      case "card-default": await changeCard(account.id, body.id, "default"); data = { cards: await listCards(account.id) }; message = "Default payment method updated."; break;
      case "card-remove": await changeCard(account.id, body.id, "remove"); data = { cards: await listCards(account.id) }; message = "Payment method removed."; break;
      case "email-request": await requestEmailChange(account.id, body.email, password, code); message = "Check your new email for a verification link. Your current email has not changed."; break;
      case "email-confirm": await confirmEmailChange(account.id, body.token); message = "Email changed successfully. Your account and membership links are unchanged."; break;
      case "password": await changePassword(account.id, password, body.password, code); message = "Password changed successfully. Other sessions have been signed out."; break;
      case "2fa-begin": { const setup = await beginTwoFactor(account.id, password); data = { secret: setup.secret, qrCode: await QRCode.toDataURL(setup.uri, { width: 240, margin: 2 }) }; message = "Scan the QR code, then enter the authenticator code to enable 2FA."; break; }
      case "2fa-enable": data = await enableTwoFactor(account.id, code); message = "Two-factor authentication enabled. Save your recovery codes now."; break;
      case "2fa-disable": await disableTwoFactor(account.id, password, code); message = "Two-factor authentication disabled."; break;
      default: throw new AccountError("Unknown account action.");
    }
    if (["password", "2fa-enable", "2fa-disable"].includes(body.action)) data = { ...data, security: await securityStatus(account.id) };
    return NextResponse.json({ ...data, message }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof AccountError ? error.message : "We could not save this change. Please try again." }, { status: error instanceof AccountError ? error.status : 500, headers: { "Cache-Control": "no-store" } });
  }
}
