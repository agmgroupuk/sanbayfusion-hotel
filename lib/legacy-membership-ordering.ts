/** Recognize older membership IDs that remain eligible for food orders. */
export function isLegacyOrderingPlanId(planId: string) {
  return /^(0[1-9]|1[0-9]|20)$/.test(planId);
}
