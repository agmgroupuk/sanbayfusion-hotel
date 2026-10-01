import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import type { CustomerAccount } from "@/lib/db/schema";
import Stripe from "stripe";
import { build } from "esbuild";
import { globSync, readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
const state = vi.hoisted(() => ({ db: null as typeof import("@/lib/db").db, cookies: new Map<string,string>(), emails: [] as { to: string; text: string }[] }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ get db() { return state.db; } }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (key: string) => state.cookies.has(key) ? { value: state.cookies.get(key)! } : undefined, set: (key: string, value: string) => state.cookies.set(key,value), delete: (key: string) => state.cookies.delete(key) }) }));
vi.mock("@/lib/email/client", () => ({ FROM_EMAIL: "test@example.invalid", resend: { emails: { send: async (email: { to: string; text: string }) => { state.emails.push(email); return { data: { id: "fixture" }, error: null }; } } } }));
import { hashPassword, verifyPassword, createCustomerSession, getCurrentAccount } from "@/lib/auth";
import { decryptSecret, totp, beginTwoFactor, enableTwoFactor, consumeSecondFactor, disableTwoFactor, changePassword, securityStatus, rateLimit } from "@/lib/account/security";
import { addresses, saveAddress, changeAddress, addCardSetup, completeCardSetup, listCards, changeCard, accountMemberships, accountPayments, requestEmailChange, confirmEmailChange, accountDefaults } from "@/lib/account/service";
import { POST } from "@/app/api/account/route";
import { signIn } from "@/app/auth/actions";
const suite = process.env.RUN_ACCOUNT_SANDBOX_E2E === "true" ? describe : describe.skip;
let client: ReturnType<typeof postgres>; let database: NonNullable<typeof state.db>; let stripe: Stripe;
const password = "FixtureOnlyPassword123"; const rollback = new Error("ROLLBACK_ACCOUNT_FIXTURES");
async function fixture(work: (a: CustomerAccount,b: CustomerAccount) => Promise<void>) {
 try { await database.transaction(async tx => {
  state.db = tx as unknown as typeof database; state.cookies.clear(); state.emails = [];
  const accounts = await tx.insert(schema.customerAccounts).values([0,1].map(i => ({ email: `account-${i}-${crypto.randomUUID()}@example.invalid`, fullName: "Sandbox Account Verification", phone: "+66812345678", passwordHash: "pending" }))).returning();
  for (const account of accounts) { account.passwordHash = await hashPassword(password); await tx.update(schema.customerAccounts).set({ passwordHash: account.passwordHash }).where(eq(schema.customerAccounts.id,account.id)); }
  await createCustomerSession(accounts[0].id); await work(accounts[0], accounts[1]); throw rollback;
 }); } catch (error) { if (error === rollback) return; if (error instanceof Stripe.errors.StripeError) throw new Error(`Sandbox provider failure: ${error.code ?? error.type}`); throw error; }
 finally { state.db = null; state.cookies.clear(); vi.restoreAllMocks(); }
}
const address = { kind: "delivery", isDefault: true, details: { name: "Fixture Recipient", phone: "+66812345678", country: "TH", line1: "999 Rama I Road", line2: "", city: "", state: "", subdistrict: "Pathum Wan", district: "Pathum Wan", province: "Bangkok", postalCode: "10330" } };
const api = (body: object, origin = "http://localhost") => POST(new Request("http://localhost/api/account", { method: "POST", headers: { origin }, body: JSON.stringify(body) }));
suite("Account Center with Railway DB rollback and real Stripe Sandbox", () => {
 beforeAll(() => { if (process.env.RAILWAY_PROJECT_ID !== "ea31f46e-5f06-4394-8580-22f343c28132" || !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") || !/^[a-f0-9]{64}$/i.test(process.env.ACCOUNT_SECURITY_KEY ?? "")) throw new Error("Authorized Sandbox and encryption key required"); client=postgres(process.env.DATABASE_URL!, { prepare:false,max:1 }); database=drizzle(client,{schema}); stripe=new Stripe(process.env.STRIPE_SECRET_KEY,{apiVersion:"2026-08-26.dahlia"}); });
 afterAll(async () => { if(client) await client.end(); });
 it("authorizes profile mutations from the session, not browser identity", async () => fixture(async(a,b) => {
  expect((await api({ action:"profile", accountId:b.id,profile:{fullName:"Changed Fixture",displayName:"Fixture",phone:"+66812345678"} })).status).toBe(200);
  expect((await getCurrentAccount())?.fullName).toBe("Changed Fixture");
  expect((await state.db!.select().from(schema.customerAccounts).where(eq(schema.customerAccounts.id,b.id)))[0].fullName).toBe(b.fullName);
  expect((await api({action:"profile"},"https://attacker.invalid")).status).toBe(403);
  state.cookies.clear(); expect((await api({action:"profile"})).status).toBe(401);
 }),30000);
 it("manages international billing and Thailand addresses with isolated defaults and ownership", async () => fixture(async(a,b) => {
  await saveAddress(a.id,address); await saveAddress(a.id,{...address,isDefault:false,details:{...address.details,line1:"Another address"}});
  await saveAddress(a.id,{...address,kind:"billing",details:{...address.details,country:"GB",city:"London",postalCode:"SW1A 1AA"}});
  const rows=await addresses(a.id); expect(rows).toHaveLength(3); expect(rows.filter(row=>row.kind==="delivery"&&row.isDefault)).toHaveLength(1); expect(await addresses(b.id)).toHaveLength(0);
  await expect(changeAddress(b.id,rows[0].id,true)).rejects.toThrow("not found");
  const other=rows.find(row=>row.kind==="delivery"&&!row.isDefault)!; await changeAddress(a.id,other.id,false); expect((await addresses(a.id)).find(row=>row.kind==="delivery"&&row.isDefault)?.id).toBe(other.id);
  await changeAddress(a.id,other.id,true); expect((await addresses(a.id)).filter(row=>row.kind==="delivery"&&row.isDefault)).toHaveLength(1);
  await expect(saveAddress(a.id,{...address,details:{...address.details,country:"US"}})).rejects.toThrow("Thailand");
  expect(await accountMemberships(b.id)).toHaveLength(0); expect(await accountPayments(b.id)).toHaveLength(0);
 }),30000);
 it("requires email verification, preserves account identity and prevents token replay", async () => fixture(async(a) => {
  const [membership] = await state.db!.insert(schema.membershipRequests).values({ customerAccountId:a.id, requestNumber:`FIX-${crypto.randomUUID().slice(0,20)}`,planId:"duration-1",planName:"1-Month Membership",planSnapshot:{durationMonths:1},annualFee:6000,addOnTotal:0,estimatedTotal:6000,durationMonths:1,deliveryDays:0,annualDeliveryDays:0,fullName:a.fullName!,phone:a.phone!,email:a.email,address:{},contactPreferences:{},configuration:{},purchaseSnapshot:{historical:"unchanged"},invoiceNumber:`INV-${crypto.randomUUID().slice(0,20)}`,invoiceStatus:"paid" }).returning();
  const legacyCustomer = await stripe.customers.create({ email:a.email, name:a.fullName!, metadata:{sanbayAccountId:a.id,purpose:"account_email_verification_test"} });
  await state.db!.update(schema.customerAccounts).set({ stripeCustomerId:legacyCustomer.id }).where(eq(schema.customerAccounts.id,a.id));
  await state.db!.update(schema.membershipRequests).set({ customerAccountId:null, stripeCustomerId:legacyCustomer.id }).where(eq(schema.membershipRequests.id,membership.id));
  expect((await accountMemberships(a.id))[0].id).toBe(membership.id);
  const target=`verified-${crypto.randomUUID()}@example.invalid`;
  await expect(requestEmailChange(a.id,target,"wrong","")).rejects.toThrow("incorrect");
  await requestEmailChange(a.id,target,password,""); expect((await getCurrentAccount())?.email).toBe(a.email);
  const token=new URL(state.emails[0].text.match(/https?:\/\/\S+/)![0]).searchParams.get("emailToken")!;
  await expect(confirmEmailChange(a.id,"x".repeat(43))).rejects.toThrow("invalid");
  await confirmEmailChange(a.id,token); const current=await getCurrentAccount(); expect(current?.id).toBe(a.id);expect(current?.email).toBe(target);expect(current?.stripeCustomerId).toBe(legacyCustomer.id);
  const updatedCustomer=await stripe.customers.retrieve(legacyCustomer.id);if(updatedCustomer.deleted)throw new Error("Unexpected deleted fixture customer");expect(updatedCustomer.email).toBe(target);
  const memberships=await accountMemberships(a.id); expect(memberships).toHaveLength(1); expect(memberships[0].id).toBe(membership.id); expect(memberships[0].purchaseSnapshot).toEqual({historical:"unchanged"}); expect(await accountMemberships(crypto.randomUUID())).toHaveLength(0); expect(await accountPayments(crypto.randomUUID())).toHaveLength(0); expect(await accountPayments(a.id)).toHaveLength(1);
  await expect(confirmEmailChange(a.id,token)).rejects.toThrow("invalid");
 }),30000);
 it("encrypts TOTP secrets, verifies enrollment, rejects replay and consumes recovery codes once", async () => fixture(async(a,b) => {
  const setup=await beginTwoFactor(a.id,password); expect((await securityStatus(a.id)).enabled).toBe(false);
  const row=(await state.db!.select().from(schema.accountSecurity).where(eq(schema.accountSecurity.accountId,a.id)))[0]; expect(row.pendingSecret).not.toContain(setup.secret); expect(()=>decryptSecret(row.pendingSecret!,b.id)).toThrow();
  await expect(enableTwoFactor(a.id,"invalid")).rejects.toThrow("valid");
  const token=totp(setup.secret).generate(); const enabled=await enableTwoFactor(a.id,token); expect(enabled.recoveryCodes).toHaveLength(10); expect((await securityStatus(a.id)).enabled).toBe(true);
  state.cookies.clear(); const login=new FormData(); login.set("email",a.email);login.set("password",password);
  expect(await signIn(login)).toMatchObject({ok:false});expect(await getCurrentAccount()).toBeNull();
  login.set("code",enabled.recoveryCodes[9]);await expect(signIn(login)).rejects.toThrow("NEXT_REDIRECT");expect((await getCurrentAccount())?.id).toBe(a.id);
  expect(await consumeSecondFactor(a.id,token)).toBe(false); expect(await consumeSecondFactor(a.id,"000000")).toBe(false);
  const now=Date.now(); vi.spyOn(Date,"now").mockReturnValue(now+31000); const next=totp(setup.secret).generate(); expect(await consumeSecondFactor(a.id,next)).toBe(true); expect(await consumeSecondFactor(a.id,next)).toBe(false); vi.restoreAllMocks();
  expect(await consumeSecondFactor(a.id,enabled.recoveryCodes[0])).toBe(true);expect(await consumeSecondFactor(a.id,enabled.recoveryCodes[0])).toBe(false);
  await expect(changePassword(a.id,password,"NewFixturePassword123","")).rejects.toThrow("incorrect");
  await changePassword(a.id,password,"NewFixturePassword123",enabled.recoveryCodes[1]); expect(await verifyPassword("NewFixturePassword123",(await getCurrentAccount())!.passwordHash)).toBe(true);
  await disableTwoFactor(a.id,"NewFixturePassword123",enabled.recoveryCodes[2]);expect((await securityStatus(a.id)).enabled).toBe(false);
 }),60000);
 it("enforces durable attempt limits", async()=>fixture(async(a)=>{ for(let i=0;i<3;i++) await rateLimit("fixture",a.id,3); await expect(rateLimit("fixture",a.id,3)).rejects.toThrow("Too many"); }),30000);
 it("verifies and refunds multiple cards, reuses one customer, changes defaults and removes safely", async()=>fixture(async(a,b)=>{
  let customerId: string|null=null; const ids:string[]=[];
  for(const pm of ["pm_card_visa","pm_card_mastercard","pm_card_visa_debit"]) {
   const setup=await addCardSetup(a.id,crypto.randomUUID()); const intent=await stripe.paymentIntents.confirm(setup.paymentIntentId,{payment_method:pm}); expect(intent.status).toBe("succeeded");
   if(customerId)expect(intent.customer).toBe(customerId);else customerId=intent.customer as string;
   const cards=await completeCardSetup(a.id,setup.paymentIntentId); ids.push((intent.payment_method as string)); expect(cards.filter(card=>card.isDefault)).toHaveLength(1); expect((await stripe.refunds.list({payment_intent:intent.id})).data[0].amount).toBe(200);
  }
  const cards=await listCards(a.id);expect(cards).toHaveLength(3); expect(JSON.stringify(cards)).not.toContain("client_secret");expect(JSON.stringify(cards)).not.toContain("4242424242424242");
  await expect(changeCard(b.id,ids[0],"remove")).rejects.toThrow();
  await changeCard(a.id,ids[1],"default");expect((await listCards(a.id)).find(card=>card.isDefault)?.id).toBe(ids[1]);
  await changeCard(a.id,ids[1],"remove"); expect((await listCards(a.id)).filter(card=>card.isDefault)).toHaveLength(1);
  await changeCard(a.id,ids[0],"remove");await changeCard(a.id,ids[2],"remove"); expect(await listCards(a.id)).toHaveLength(0);
  expect((await stripe.paymentIntents.list({customer:customerId!,limit:10})).data).toHaveLength(3);
  expect((await accountDefaults(a.id)).paymentMethod).toBeNull();
 }),120000);
 it("browser: responsive account forms and secure Stripe card saving",async()=>fixture(async(a)=>{
  const { chromium }=await import("playwright");
  const bundle=await build({entryPoints:["scripts/account-browser-harness.tsx"],bundle:true,write:false,platform:"browser",jsx:"automatic",alias:{"next/navigation":path.resolve("scripts/account-browser-navigation.ts")},define:{"process.env.NODE_ENV":'"production"',"process.env":"{}",global:"globalThis"}});
  const css=globSync(".next/static/chunks/*.css").map(file=>readFileSync(file,"utf8")).join("\n");
  expect(css.length).toBeGreaterThan(1000);
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(20000); const errors:string[]=[]; page.on("pageerror",error=>errors.push(error.message));
  const origin="http://localhost:3102";
  try {
   await page.route(`${origin}/**`,async route=>{
    if(route.request().url().includes("/api/account")){
     const body=route.request().postData()!; expect(body).not.toContain("4242424242424242"); expect(body).not.toContain('"cvc"');
     const response=await POST(new Request(`${origin}/api/account`,{method:"POST",headers:{origin},body}));
     await route.fulfill({status:response.status,contentType:"application/json",body:await response.text()});return;
    }
    await route.fulfill({contentType:"text/html",body:`<html class="dark"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>`});
   });
   mkdirSync(".next/verification/account",{recursive:true});
   await page.goto(`${origin}/dashboard/security`);
   expect(errors).toEqual([]);
   await page.evaluate(email=>window.mountSecurity({enabled:false,email,recoveryCount:0}),a.email);
   await page.getByRole("heading",{name:"Security",exact:true}).waitFor();
   for(const width of [1440,820,390]){
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`.next/verification/account/security-${width}.png`,fullPage:true});
   }
   await page.goto(`${origin}/dashboard/personal`);
   await page.evaluate(account=>window.mountProfile({account}),{fullName:a.fullName!,displayName:"",email:a.email,phone:a.phone!});
   await page.getByRole("textbox",{name:"Display name"}).fill("Browser Account");
   await page.getByRole("button",{name:"Save personal information"}).click();
   await page.getByText("Profile updated successfully.").waitFor();
   expect((await getCurrentAccount())?.displayName).toBe("Browser Account");
   await page.goto(`${origin}/dashboard/addresses`);
   await page.evaluate(props=>window.mountAddresses(props),{initial:await addresses(a.id),name:a.fullName!,phone:a.phone!});
   await page.getByRole("button",{name:"Add delivery address"}).click();
   await page.getByRole("textbox",{name:"Address",exact:true}).fill("999 Rama I Road");
   await page.getByRole("textbox",{name:/^Subdistrict/}).fill("Pathum Wan");await page.getByRole("textbox",{name:/^District/}).fill("Pathum Wan");await page.getByRole("textbox",{name:"Province",exact:true}).fill("Bangkok");await page.getByRole("textbox",{name:"Postal code",exact:true}).fill("10330");
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.getByRole("button",{name:"Save address",exact:true}).click();await page.getByText("Address saved.", {exact:true}).waitFor();expect(await addresses(a.id)).toHaveLength(1);
   await page.goto(`${origin}/dashboard/payment-methods`);
   await page.evaluate(props=>window.mountCards(props),{initial:[],publishableKey:process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!});
   await page.getByRole("button",{name:"Add payment method"}).click();
   let frame=page.mainFrame();
   for(let i=0;i<60;i++){let found=false;for(const child of page.frames())if(await child.locator('input[name="number"]').count()){frame=child;found=true;break;}if(found)break;await new Promise(resolve=>setTimeout(resolve,500));}
   await frame.locator('input[name="number"]').fill("4242424242424242");await frame.locator('input[name="expiry"]').fill("1234");await frame.locator('input[name="cvc"]').fill("123");
   const postal=frame.locator('input[name="postalCode"]');if(await postal.count())await postal.fill("10330");
   await page.getByRole("button",{name:"Verify card · USD $2.00",exact:true}).click();await page.getByText("Card verified. Your USD $2 refund has been initiated; your issuer may take additional time to display it.",{exact:true}).waitFor({timeout:45000});
   expect(await listCards(a.id)).toHaveLength(1);
   for(const width of [1440,820,390]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`.next/verification/account/cards-${width}.png`,fullPage:true});}
   const [current]=await state.db!.select().from(schema.customerAccounts).where(eq(schema.customerAccounts.id,a.id));expect((await stripe.paymentIntents.list({customer:current.stripeCustomerId!,limit:10})).data).toMatchObject([{amount:200,currency:"usd",status:"succeeded"}]);
  }finally{await browser.close();}
 }),180000);

});
