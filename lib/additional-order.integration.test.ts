import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import * as schema from "./db/schema";
const state = vi.hoisted(()=>({db:null as typeof import("./db").db,create:vi.fn(),retrieve:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("./db",()=>({get db(){return state.db;}}));
vi.mock("./stripe",()=>({stripe:{paymentIntents:{create:state.create,retrieve:state.retrieve}}}));
const addressId="11111111-1111-4111-8111-111111111111";
vi.mock("./account/service",()=>({
  stripeCustomer:async()=>({id:"cus_test"}),
  listCards:async()=>[{id:"pm_default",verificationStatus:"verified",isDefault:true},{id:"pm_alternate",verificationStatus:"verified"}],
  addresses:async()=>[{id:"11111111-1111-4111-8111-111111111111",kind:"delivery",isDefault:true,details:{name:"Test Member",phone:"+66812345678",country:"TH",line1:"123 Test Road",subdistrict:"Lumphini",district:"Pathum Wan",province:"Bangkok",postalCode:"10330"}}],
}));
import { createAdditionalOrder } from "./additional-order";
import { recordOrderPayment, reconcileOrderPayment } from "./order-payment";
let client:PGlite;
let database:ReturnType<typeof drizzle<typeof schema>>;
let account:schema.CustomerAccount;
let membership:schema.MembershipRequest;
const intents=new Map<string,Stripe.PaymentIntent>();
const input=()=>({requestId:crypto.randomUUID(),cart:[{category:"Thai soups",name:"Tom Yum Goong",quantity:2,price:1}],total:1,deliveryDate:"2027-01-10",deliveryTime:"11:00",addressId,paymentMethodId:"pm_default"});
beforeAll(async()=>{client=new PGlite();for(const file of readdirSync("drizzle").filter(file=>file.endsWith(".sql")).sort())await client.exec(readFileSync(`drizzle/${file}`,"utf8"));database=drizzle(client,{schema});state.db=database as unknown as NonNullable<typeof state.db>;},60000);
beforeEach(async()=>{
  vi.useFakeTimers({toFake:["Date"]});vi.setSystemTime(new Date("2027-01-05T12:00:00+07:00"));
  await client.exec("TRUNCATE customer_accounts, email_outbox CASCADE");
  [account]=await database.insert(schema.customerAccounts).values({email:"checkout@example.invalid",passwordHash:"TEST_ONLY",stripeCustomerId:"cus_test"}).returning();
  [membership]=await database.insert(schema.membershipRequests).values({customerAccountId:account.id,requestNumber:crypto.randomUUID().slice(0,25),planId:"duration-1",planName:"1 Month",planSnapshot:{},annualFee:6000,estimatedTotal:6000,durationMonths:1,deliveryDays:0,annualDeliveryDays:0,fullName:"Test",phone:"12345678",email:account.email,address:{},contactPreferences:{},configuration:{},selectedServiceMonths:["2027-01"],status:"active",invoiceStatus:"paid",membershipExpiryDate:"2027-02-01"}).returning();
  intents.clear();vi.clearAllMocks();
  state.create.mockImplementation(async(params,options)=>{if(!intents.has(options.idempotencyKey))intents.set(options.idempotencyKey,{...params,id:`pi_${crypto.randomUUID().replaceAll("-","")}`,livemode:false,status:"requires_confirmation",client_secret:"sandbox_only"} as Stripe.PaymentIntent);return intents.get(options.idempotencyKey);});
  state.retrieve.mockImplementation(async(id)=>[...intents.values()].find(intent=>intent.id===id));
});
afterEach(()=>vi.useRealTimers());afterAll(async()=>client.close());
describe("connected additional orders",()=>{
  it("recalculates prices, shares the customer/card and deduplicates retry, webhook and email",async()=>{
    const raw=input();const first=await createAdditionalOrder(account,membership.id,raw);const retry=await createAdditionalOrder(account,membership.id,raw);
    expect(first.total).toBe(640);expect(retry.orderNumber).toBe(first.orderNumber);expect(intents.size).toBe(1);
    const intent=[...intents.values()][0];expect(intent.customer).toBe("cus_test");expect(intent.payment_method).toBe("pm_default");
    expect(await recordOrderPayment(intent)).toBeNull();intent.status="succeeded";intent.amount_received=64000;
    expect((await recordOrderPayment(intent))?.status).toBe("confirmed");await recordOrderPayment(intent);
    expect(await database.select().from(schema.customerOrders)).toHaveLength(1);
    expect((await database.select().from(schema.emailOutbox)).filter(row=>row.template==="sanbay-order-confirmation")).toHaveLength(1);
  });
  it("accepts an alternate verified card",async()=>{await createAdditionalOrder(account,membership.id,{...input(),paymentMethodId:"pm_alternate"});expect([...intents.values()][0].payment_method).toBe("pm_alternate");});
  it("rejects retired products from a manipulated request before creating a PaymentIntent",async()=>{
    for (const item of [
      {category:"Beer",name:"Imported Beer",quantity:1},
      {category:"Soft drinks, coffee, tea & juices",name:"Vodka",quantity:1},
    ]) {
      await expect(createAdditionalOrder(account,membership.id,{...input(),cart:[item]})).rejects.toThrow();
    }
    expect(state.create).not.toHaveBeenCalled();
    expect(await database.select().from(schema.customerOrders)).toHaveLength(0);
  });
  it.each(["pm_otheruser","pm_unverified"])("rejects %s before creating a payment",async paymentMethodId=>{await expect(createAdditionalOrder(account,membership.id,{...input(),paymentMethodId})).rejects.toThrow("verified saved card");expect(state.create).not.toHaveBeenCalled();});
  it("rejects another user's address",async()=>{await expect(createAdditionalOrder(account,membership.id,{...input(),addressId:crypto.randomUUID()})).rejects.toThrow("saved delivery address");});
  it.each([{cart:[]},{cart:[{category:"bad",name:"invalid",quantity:1}]},{cart:[{category:"Thai soups",name:"Tom Yum Goong",quantity:51}]}])("rejects invalid carts",async ({cart})=>{await expect(createAdditionalOrder(account,membership.id,{...input(),cart})).rejects.toThrow();expect(state.create).not.toHaveBeenCalled();});
  it("rejects short notice and inactive membership on the server",async()=>{await expect(createAdditionalOrder(account,membership.id,{...input(),deliveryDate:"2027-01-07"})).rejects.toThrow("3 days");await database.update(schema.membershipRequests).set({status:"cancelled"}).where(eq(schema.membershipRequests.id,membership.id));await expect(createAdditionalOrder(account,membership.id,input())).rejects.toThrow("active membership");});
  it("does not confirm failed or action-required payments and permits later success",async()=>{await createAdditionalOrder(account,membership.id,input());const intent=[...intents.values()][0];for(const status of ["requires_action","requires_payment_method"] as const){intent.status=status;await reconcileOrderPayment(intent.id);expect((await database.select().from(schema.customerOrders))[0].status).toBe("pending_payment");}intent.status="succeeded";intent.amount_received=intent.amount;await reconcileOrderPayment(intent.id);expect((await database.select().from(schema.customerOrders))[0].status).toBe("confirmed");});
  it("holds a successful payment for review if eligibility was revoked",async()=>{await createAdditionalOrder(account,membership.id,input());const intent=[...intents.values()][0];intent.status="succeeded";intent.amount_received=intent.amount;await database.update(schema.membershipRequests).set({status:"cancelled"}).where(eq(schema.membershipRequests.id,membership.id));expect(await recordOrderPayment(intent)).toMatchObject({paymentStatus:"paid",status:"pending_payment"});});
  it("rejects a mismatched payment customer",async()=>{await createAdditionalOrder(account,membership.id,input());const intent=[...intents.values()][0];intent.status="succeeded";intent.amount_received=intent.amount;intent.customer="cus_other";expect(await recordOrderPayment(intent)).toBeNull();});
});
