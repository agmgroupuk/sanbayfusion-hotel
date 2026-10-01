from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'components/orders/checkout-payment.tsx'
s=p.read_text(encoding='utf-8').replace('CardElement, ','')
s=s.replace('  const [clientSecret, setClientSecret] = useState("");','  const [clientSecret, setClientSecret] = useState("");\n  const [orderNumber, setOrderNumber] = useState("");')
s=s.replace('setClientSecret(data.clientSecret);','setClientSecret(data.clientSecret); setOrderNumber(data.orderNumber);')
s=s.replace('{props.orderNumber}', '{orderNumber}').replace('<PaymentForm {...props} onConfirmed=', '<PaymentForm {...props} orderNumber={orderNumber} onConfirmed=')
s=s.replace('const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");','const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;\nconst stripePromise = publishableKey ? loadStripe(publishableKey) : null;')
s=s.replace('const result = await stripe.confirmPayment({ elements, redirect: "if_required" });','const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}/dashboard` }, redirect: "if_required" });')
s=s.replace('  const [error, setError] = useState("");\n\n  async function pay', '  const [error, setError] = useState("");\n  const address = delivery && typeof delivery === "object" ? delivery as Record<string, unknown> : {};\n  const deliveryAddress = address.delivery && typeof address.delivery === "object" ? address.delivery as Record<string, unknown> : address;\n  const addressText = [deliveryAddress.line1, deliveryAddress.line2, deliveryAddress.subdistrict, deliveryAddress.district, deliveryAddress.province, deliveryAddress.postalCode].filter(value => typeof value === "string").join(", ");\n\n  async function pay')
s=s.replace('<p className="text-eyebrow text-gold">Order summary</p>', '<p className="text-eyebrow text-gold">Order summary</p><p className="mt-4 text-sm text-muted-foreground">Delivery: {addressText || "Contact the team to confirm your address"}</p>')
p.write_text(s,encoding='utf-8')
p=root/'app/api/orders/payment-intent/route.ts';s=p.read_text(encoding='utf-8').replace('import { NextResponse }','import { randomUUID } from "node:crypto";\nimport { NextResponse }').replace('`SBF-O-${Date.now().toString().slice(-8)}`','`SBF-O-${randomUUID().slice(0, 18)}`');p.write_text(s,encoding='utf-8')
