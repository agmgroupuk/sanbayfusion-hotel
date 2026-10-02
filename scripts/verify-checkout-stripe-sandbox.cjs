async function main() {
  const {default: assert} = await import("node:assert/strict");
  const {default: Stripe} = await import("stripe");
  const key = process.env.STRIPE_SECRET_KEY || "";
  assert.ok(key.startsWith("sk_test_"), "Sandbox credentials required");
  const stripe = new Stripe(key);
  const run = `checkout-probe-${crypto.randomUUID()}`;
  const customer = await stripe.customers.create({name:"Sanbay checkout Sandbox fixture",metadata:{fixture:run}});
  assert.equal(customer.livemode,false);
  const intents=[];
  const results={};
  try {
    const cards=[];
    for(const method of ["pm_card_visa","pm_card_mastercard"]){
      const setup=await stripe.setupIntents.create({customer:customer.id,payment_method:method,payment_method_types:["card"],confirm:true,metadata:{fixture:run}});
      assert.equal(setup.status,"succeeded");cards.push(setup.payment_method);
    }
    await stripe.customers.update(customer.id,{invoice_settings:{default_payment_method:cards[0]}});
    const saved=await stripe.paymentMethods.list({customer:customer.id,type:"card"});assert.equal(saved.data.length,2);
    for(let i=0;i<cards.length;i++){
      const params={amount:10000,currency:"thb",customer:customer.id,payment_method:cards[i],payment_method_types:["card"],metadata:{fixture:run}};
      const options={idempotencyKey:`${run}-${i}`};
      const intent=await stripe.paymentIntents.create(params,options);intents.push(intent.id);
      assert.equal((await stripe.paymentIntents.create(params,options)).id,intent.id);
      const paid=await stripe.paymentIntents.confirm(intent.id);
      assert.equal(paid.livemode,false);assert.equal(paid.status,"succeeded");assert.equal(paid.customer,customer.id);assert.equal(paid.payment_method,cards[i]);
      results[i===0?"defaultCard":"alternateCard"]=paid.status;
    }
    try{await stripe.paymentIntents.create({amount:10000,currency:"thb",customer:customer.id,payment_method:"pm_card_chargeDeclined",payment_method_types:["card"],confirm:true,metadata:{fixture:run}});throw new Error("Expected decline");}
    catch(error){assert.equal(error.code,"card_declined");if(error.payment_intent)intents.push(error.payment_intent.id);results.declined="card_declined";}
    const authentication=await stripe.paymentIntents.create({amount:10000,currency:"thb",customer:customer.id,payment_method:"pm_card_authenticationRequired",payment_method_types:["card"],confirm:true,use_stripe_sdk:true,metadata:{fixture:run}});
    intents.push(authentication.id);assert.equal(authentication.status,"requires_action");results.authentication=authentication.status;
    results.idempotency="same PaymentIntent";
  } finally {
    for(const id of intents){const intent=await stripe.paymentIntents.retrieve(id);assert.equal(intent.livemode,false);assert.equal(intent.metadata.fixture,run);if(intent.status==="succeeded")await stripe.refunds.create({payment_intent:id},{idempotencyKey:`${run}-refund-${id}`});else if(intent.status!=="canceled")await stripe.paymentIntents.cancel(id);}
    await stripe.customers.del(customer.id);
  }
  console.log(JSON.stringify({sandbox:true,results,cleanup:"successful fixture payments refunded; remaining intents cancelled; fixture customer deleted",limit:"Provider-state checks only; browser 3DS challenge completion is not covered"}));
}
main().catch(error=>{console.error(JSON.stringify({error:"Sandbox checkout probe failed",code:error.code || error.name}));process.exitCode=1;});
