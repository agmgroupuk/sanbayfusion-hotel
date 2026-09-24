import { NextResponse } from "next/server";
import { z } from "zod";
import { checkDeliveryEligibility } from "@/lib/delivery";
import { membershipPlans } from "@/lib/membership-plans";

const eligibilitySchema = z.object({
  placeId: z.string().min(1),
  formattedAddress: z.string().min(1),
  latitude: z.number().finite().min(-90).max(90).optional(),
  longitude: z.number().finite().min(-180).max(180).optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postalCode: z.string().optional(),
  selectedPlanId: z.string().optional(),
}).refine((data) => (typeof data.latitude === "number" && typeof data.longitude === "number") || Boolean(data.province && data.district && data.subdistrict), "Coordinates or complete administrative location is required.");

export async function POST(request: Request) {
  const parsed = eligibilitySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "A complete selected address and location are required." }, { status: 400 });
  const data = parsed.data;
  const selectedPlan = data.selectedPlanId ? membershipPlans.find((plan) => plan.id === data.selectedPlanId || plan.slug === data.selectedPlanId) : undefined;
  const result = checkDeliveryEligibility(data, selectedPlan?.level);
  return NextResponse.json({ ...result, address: data.formattedAddress, province: data.province, district: data.district, subdistrict: data.subdistrict, postalCode: data.postalCode });
}