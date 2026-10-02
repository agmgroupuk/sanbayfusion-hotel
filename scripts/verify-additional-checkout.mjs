import { build } from "esbuild";
import { chromium } from "playwright";
import { readdirSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

const css = readdirSync(".next/static/chunks").filter(file=>file.endsWith(".css")).map(file=>readFileSync(`.next/static/chunks/${file}`,"utf8")).join("\n");
const props = {items:[{category:"Thai soups",name:"Tom Yum Goong",quantity:2,price:320,lineTotal:640}],notes:"Please call on arrival",addresses:[{id:"11111111-1111-4111-8111-111111111111",kind:"delivery",isDefault:true,details:{name:"Test Member",line1:"123 Test Road",district:"Pathum Wan",province:"Bangkok",postalCode:"10330"}}],cards:[{id:"pm_default",brand:"visa",last4:"4242",expMonth:12,expYear:2030,isDefault:true},{id:"pm_alternate",brand:"mastercard",last4:"4444",expMonth:12,expYear:2030,isDefault:false}],dates:["2027-01-10","2027-01-11"],publishableKey:"pk_test_fixture"};
let stripeCalls = 0;
const bundle = await build({stdin:{contents:`import React from "react";import {createRoot} from "react-dom/client";import {AdditionalCheckout} from "./components/orders/additional-checkout";createRoot(document.getElementById("root")).render(<AdditionalCheckout {...${JSON.stringify(props)}} />);`,resolveDir:process.cwd(),loader:"tsx"},bundle:true,write:false,platform:"browser",jsx:"automatic",define:{"process.env":"{}","process.env.NODE_ENV":'"production"',"process.env.NEXT_PUBLIC_CONNECTED_SUBDOMAINS":'"false"'},plugins:[{name:"mock-stripe-browser",setup(build){build.onResolve({filter:/^@stripe\/stripe-js$/},()=>({path:"mock-stripe",namespace:"fixture"}));build.onLoad({filter:/.*/,namespace:"fixture"},()=>({contents:'export async function loadStripe(){return {async confirmCardPayment(){window.stripeCalls=(window.stripeCalls||0)+1;return window.failCard ? {error:{message:"Authentication required. Please retry."}} : {paymentIntent:{status:"succeeded"}};}};}',loader:"js"}));}}]});
const browser = await chromium.launch({channel:"msedge",headless:true});
let checks=0;
try{
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:1000}});
  const page=await context.newPage();const errors=[];page.on("pageerror",error=>errors.push(error.message));
  const attempts=[];let confirmationCalls=0;
  await page.route("https://checkout-preview.invalid/**",async route=>{
   const path=new URL(route.request().url()).pathname;
   if(path==="/api/orders/payment-intent"){const body=route.request().postDataJSON();attempts.push(body);assert.equal(body.paymentMethodId,"pm_alternate");assert.equal(body.deliveryDate,"2027-01-10");return route.fulfill({contentType:"application/json",body:JSON.stringify({clientSecret:"test_only",orderNumber:"SBF-O-TEST",total:640,paymentStatus:"requires_confirmation"})});}
   if(path==="/api/orders/confirm"){confirmationCalls++;return route.fulfill({contentType:"application/json",body:'{"orderNumber":"SBF-O-TEST","total":640}'});}
   return route.fulfill({contentType:"text/html",body:`<html class="dark"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style><body><main style="max-width:800px;margin:auto;padding:20px"><div id="root"></div></main><script>${bundle.outputFiles[0].text}</script></body></html>`});
  });
  await page.goto("https://checkout-preview.invalid/dashboard/checkout");
  await page.getByLabel("Delivery date").selectOption("2027-01-10");
  await page.getByRole("button",{name:"Continue",exact:true}).click();
  assert.ok(await page.getByRole("radio",{name:/4242/}).isChecked());checks++;
  await page.getByRole("radio",{name:/4444/}).check();
  await page.getByRole("button",{name:"Continue",exact:true}).click();
  assert.ok((await page.locator("body").innerText()).includes("Tom Yum Goong"));checks++;
  assert.ok(!(await page.locator("body").innerText()).includes("[object Object]"));checks++;
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks++;
  if(width===390) await page.screenshot({path:".next/additional-checkout-mobile.png",fullPage:true});
  await page.evaluate(()=>{window.failCard=true;});
  await page.getByRole("button",{name:"Pay ฿640",exact:true}).click();
  await page.getByRole("status").filter({hasText:"Authentication required"}).waitFor();
  assert.equal(confirmationCalls,0);checks++;
  await page.reload();
  await page.getByRole("button",{name:"Pay ฿640",exact:true}).click();
  await page.getByRole("heading",{name:"Order confirmed",exact:true}).waitFor();
  assert.equal(attempts[0].requestId,attempts[1].requestId);checks++;
  assert.equal(confirmationCalls,1);checks++;
  assert.deepEqual(errors,[]);checks++;
  stripeCalls+=await page.evaluate(()=>window.stripeCalls||0);
  await context.close();
 }
 console.log(`${checks} browser assertions passed at 390, 768 and 1440 pixels; saved-card selection, failure/authentication message, refresh retry and confirmation. Stripe is mocked (${stripeCalls} post-refresh confirmations), not a live 3DS test.`);
}finally{await browser.close();}
