import { build } from "esbuild";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

// Exercise the real final-review component without accounts, Stripe calls or email sends.
const folder = path.resolve(".next/eligibility-ux-check");
await mkdir(folder, { recursive: true });
await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
import {MembershipCheckoutForm} from './components/membership/membership-checkout-form';
import {membershipPlans} from './lib/membership-plans'; import {calculateMembershipQuote} from './lib/membership-request';
const plan=membershipPlans[0];const configuration={planSlug:plan.slug,selectedServiceMonths:[(new Date().getFullYear()+1)+'-02'],purchaseMode:'membership_only',foodPreferences:[],deliveryArea:'Bangkok',preferredDay:'Monday',preferredTime:'09:00\u201312:00',alcoholEnabled:false,selectedProducts:[],selectedAddOns:[]};
const snapshot=calculateMembershipQuote(configuration,plan).purchaseSnapshot;
window.__prepared={review:{complete:true,customer:{fullName:'Visitor Example',email:'visitor@example.invalid',phone:'+441234567890'},billingAddress:{line1:'10 Test Road',city:'London',country:'GB'},deliveryAddress:{line1:'Bangkok accommodation',country:'Thailand'},cards:[{id:'pm_fixture',brand:'visa',last4:'4242',expMonth:12,expYear:2030,isDefault:true,verificationStatus:'verified'}],requirements:[]},applicationId:'7a198e0b-4a1e-4d01-8b24-80f471fa8bc1',purchaseSnapshot:snapshot,quoteHash:'a'.repeat(64),reviewHash:'b'.repeat(64)};
createRoot(document.getElementById('app')).render(<MembershipCheckoutForm plan={plan} purchaseSnapshot={snapshot}/>);`, resolveDir: process.cwd(), loader: "tsx" },
 bundle: true, platform: "browser", format: "esm", outdir: folder, entryNames: "form", jsx: "automatic",
 define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" },
 plugins: [{ name: "offline-membership-api", setup(build) {
  build.onResolve({filter:/saved-payment-setup$/},()=>({path:'api',namespace:'fixture'}));
  build.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`export async function applicationRequest(action,body){if(action==='prepare')return window.__prepared;window.__submitted=body;throw new Error('Submission captured by offline test');}` }));
 }}],
});
const chunks=path.resolve('.next/static/chunks');
const css=(await Promise.all((await readdir(chunks)).filter(f=>f.endsWith('.css')).map(f=>readFile(path.join(chunks,f),'utf8')))).join('\n');
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/'||url.pathname==='/membership/checkout') {res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><main id="app" style="padding-top:32px"></main><script type="module" src="/form.js"></script></body></html>');return;}
 if(url.pathname==='/styles.css'){res.setHeader('Content-Type','text/css');res.end(css);return;}
 try{res.setHeader('Content-Type','text/javascript');res.end(await readFile(path.join(folder,path.basename(url.pathname))));}catch{res.statusCode=404;res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'msedge',headless:true});
let checks=0;const check=(ok,label)=>{assert.ok(ok,label);checks++;};
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:'+server.address().port);
  const submit=page.getByRole('button',{name:'SUBMIT MEMBERSHIP REQUEST',exact:true});await submit.waitFor();
  const eligibility=page.getByRole('checkbox',{name:/I confirm that I am a foreign visitor/});
  check(!(await eligibility.isChecked()),'eligibility starts unchecked');
  check(await submit.isDisabled(),'submission starts disabled');
  for(const box of await page.getByRole('checkbox').all()) { if(!(await box.evaluate(el=>el.closest('label').textContent.includes('I confirm that I am a foreign visitor')))) await box.check(); }
  check(await submit.isDisabled(),'other agreements cannot bypass eligibility');
  await eligibility.focus();await page.keyboard.press('Space');check(await eligibility.isChecked(),'keyboard toggles eligibility');
  check(await submit.isEnabled(),'all agreements enable submission');
  await eligibility.uncheck();check(await submit.isDisabled(),'unchecking eligibility disables submission');
  await eligibility.check();await submit.click();await page.getByText('Submission captured by offline test').waitFor();
  const payload=await page.evaluate(()=>window.__submitted);
  check(payload.confirmInternationalVisitor===true&&payload.eligibilityVersion==='international-visitors-2026-10-02','request contains explicit versioned declaration');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal page overflow');
  await page.screenshot({path:path.join(folder,'application-'+width+'.png'),fullPage:true});
 }
 check(errors.length===0,'no browser errors');
 await writeFile(path.join(folder,'results.json'),JSON.stringify({checks,result:'PASS'},null,2));
 console.log(JSON.stringify({checks,result:'PASS',evidence:folder}));
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
