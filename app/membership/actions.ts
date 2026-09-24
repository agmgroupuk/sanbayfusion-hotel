"use server";

import { db } from "@/lib/db";
import { membershipRequests } from "@/lib/db/schema";
import { sendMembershipRequestEmails } from "@/lib/email/membership-request";
import {
  membershipApplicationSchema,
  validateMembershipConfiguration,
  type MembershipApplicationInput,
} from "@/lib/membership-request";

export type MembershipApplicationResult =
  | { ok: true; requestNumber: string; demo?: boolean }
  | { ok: false; error: string };

function createRequestNumber() {
  const year = new Date().getFullYear();
  const suffix = `${Date.now()}`.slice(-6);
  return `SBF-${year}-${suffix}`;
}

export async function submitMembershipApplication(raw: unknown): Promise<MembershipApplicationResult> {
  const parsed = membershipApplicationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your request details." };

  const data: MembershipApplicationInput = parsed.data;
  const checked = validateMembershipConfiguration(data.configuration);
  if (!checked.ok) return checked;

  if (data.configuration.alcoholEnabled && !data.confirmsAlcoholLaw) {
    return { ok: false, error: "Please confirm the alcohol age and legal notice." };
  }

  const requestNumber = createRequestNumber();
  const planSnapshot = {
    id: checked.plan.id,
    slug: checked.plan.slug,
    name: checked.plan.name,
    price: checked.plan.price,
    validityMonths: checked.plan.validityMonths,
    deliveryDays: checked.plan.deliveryDays,
    deliveryDaysPerYear: checked.plan.deliveryDaysPerYear,
    foodLevel: checked.plan.foodLevel,
    items: checked.plan.items,
    exampleMenu: checked.plan.exampleMenu,
    foodValueRange: checked.plan.foodValueRange,
  };

  try {
    if (db) {
      await db.insert(membershipRequests).values({
        requestNumber,
        planId: checked.plan.id,
        planName: checked.plan.name,
        planSnapshot,
        annualFee: checked.plan.price,
        addOnTotal: checked.addOnTotal,
        estimatedTotal: checked.total,
        validityMonths: checked.plan.validityMonths,
        deliveryDays: checked.plan.deliveryDays,
        annualDeliveryDays: checked.plan.deliveryDaysPerYear,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        lineId: data.lineId || null,
        address: {
          line1: data.addressLine1,
          line2: data.addressLine2 || null,
          subdistrict: data.subdistrict || null,
          district: data.district || null,
          province: data.province,
          postalCode: data.postalCode,
          country: data.country,
          deliveryInstructions: data.deliveryInstructions || null,
          area: data.configuration.deliveryArea,
        },
        contactPreferences: {
          methods: data.contactPreferences,
          values: {
            email: data.email,
            phone: data.phone,
            lineId: data.lineId || null,
            whatsappNumber: data.whatsappNumber,
          },
        },
        configuration: data.configuration,
        notes: data.notes || null,
        allergies: data.allergies || null,
      });
    }
  } catch (error) {
    console.error("[membership] application insert failed", error);
    return { ok: false, error: "We couldn't submit your request. Please try again." };
  }

  try {
    await sendMembershipRequestEmails({
      name: data.fullName,
      email: data.email,
      requestNumber,
      planName: checked.plan.name,
      deliveryDays: checked.plan.deliveryDays,
      estimatedTotal: checked.total,
    });
  } catch (error) {
    console.error("[membership] confirmation email failed", error);
  }

  return { ok: true, requestNumber, demo: !db };
}