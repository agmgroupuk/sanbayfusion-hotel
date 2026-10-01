import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
try {
 const page=await browser.newPage();
 for(const path of ["/dashboard","/dashboard/personal","/dashboard/addresses","/dashboard/payment-methods","/dashboard/security","/dashboard/membership","/dashboard/payments"]){
  await page.goto(`http://localhost:3103${path}`);assert.equal(new URL(page.url()).pathname,"/signin");assert.equal(new URL(page.url()).searchParams.get("next"),path);
 }
 const response=await page.request.post("http://localhost:3103/api/account",{data:{action:"profile",accountId:"untrusted"}});assert.equal(response.status(),401);
 console.log("Production-server browser checks passed: all seven account routes require sign-in and preserve the destination; unauthenticated account mutations return 401.");
} finally {await browser.close();}
