export type Coordinate = { latitude: number; longitude: number };

export type DeliveryZone = {
  id: string;
  code: string;
  title: string;
  summary: string;
  coverage: string;
  conditions: string[];
  deliveryRange: string;
  additionalCharge: string;
  active: boolean;
  province?: string;
  districts: string[];
  subdistricts: string[];
  postalCodes: string[];
  polygons: Coordinate[][];
  blockedPolygons: Coordinate[][];
  minimumPlanLevel?: "budget" | "standard" | "premium" | "vip";
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  maxDrivingDistanceKm?: number;
  estimatedDeliveryWindow?: string;
};

export type DeliveryPlace = {
  placeId: string;
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
};

export type DeliveryEligibilityRequest = DeliveryPlace & { selectedPlanId?: string };

export type DeliveryAvailability = {
  status: "available" | "unavailable" | "needs_review";
  title: string;
  detail: string;
  zone?: string;
  zoneId?: string;
  distanceKm?: number;
  deliveryFee?: number;
  planEligible?: boolean;
  reasonCode?: "NO_ACTIVE_ZONE" | "BLOCKED_LOCATION" | "OUTSIDE_COVERAGE" | "PLAN_RESTRICTION" | "COVERED";
};

export const deliveryZones: DeliveryZone[] = [
  {
    id: "central",
    code: "ZONE_A",
    title: "Central delivery zone",
    summary: "The first priority for reliable city routes.",
    coverage: "Dense urban routes inside the central service area. Final boundaries are controlled by the configured map polygons and administrative rules.",
    conditions: ["Scheduled delivery windows", "Eligible memberships only", "Address access and delivery instructions required"],
    deliveryRange: "Planned window shown after address confirmation",
    additionalCharge: "Included with eligible memberships",
    active: false,
    districts: [],
    subdistricts: [],
    postalCodes: [],
    polygons: [],
    blockedPolygons: [],
    estimatedDeliveryWindow: "Confirmed after route review",
  },
  {
    id: "extended",
    code: "ZONE_B",
    title: "Extended delivery zone",
    summary: "Selected urban districts beyond the central route network.",
    coverage: "City and metropolitan routes that can be served within the operating schedule. Exact coverage remains configurable.",
    conditions: ["Route confirmation required", "Longer lead time may apply", "A delivery supplement may apply"],
    deliveryRange: "Confirmed case by case",
    additionalCharge: "Small supplement may apply",
    active: false,
    districts: [],
    subdistricts: [],
    postalCodes: [],
    polygons: [],
    blockedPolygons: [],
    deliveryFee: 0,
    estimatedDeliveryWindow: "Confirmed after route review",
  },
  {
    id: "business",
    code: "ZONE_C",
    title: "Business delivery",
    summary: "Planned delivery for offices, hospitality, events, and teams.",
    coverage: "Urban business addresses with volume, access, and schedule requirements agreed in advance.",
    conditions: ["Volume and access review", "Named delivery contact", "Schedule agreed before activation"],
    deliveryRange: "Planned around the event or team schedule",
    additionalCharge: "Quoted after route and volume review",
    active: false,
    districts: [],
    subdistricts: [],
    postalCodes: [],
    polygons: [],
    blockedPolygons: [],
    estimatedDeliveryWindow: "Agreed with the business customer",
  },
];

function pointInPolygon(point: Coordinate, polygon: Coordinate[]) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const intersects = currentPoint.longitude > point.longitude !== previousPoint.longitude > point.longitude
      && point.latitude < ((previousPoint.latitude - currentPoint.latitude) * (point.longitude - currentPoint.longitude)) / (previousPoint.longitude - currentPoint.longitude) + currentPoint.latitude;
    if (intersects) inside = !inside;
  }
  return inside;
}

function polygonContains(point: Coordinate, polygons: Coordinate[][]) {
  return polygons.some((polygon) => polygon.length >= 3 && pointInPolygon(point, polygon));
}

function zoneMatchesAdministrativeData(zone: DeliveryZone, place: DeliveryEligibilityRequest) {
  const provinceMatches = !zone.province || !place.province || zone.province === place.province;
  const districtMatches = zone.districts.length > 0 && !!place.district && zone.districts.includes(place.district);
  const subdistrictMatches = zone.subdistricts.length > 0 && !!place.subdistrict && zone.subdistricts.includes(place.subdistrict);
  const postalMatches = zone.postalCodes.length > 0 && !!place.postalCode && zone.postalCodes.includes(place.postalCode);
  return provinceMatches && (districtMatches || subdistrictMatches || postalMatches);
}

export function checkDeliveryEligibility(request: DeliveryEligibilityRequest, selectedPlanLevel?: string): DeliveryAvailability {
  const activeZones = deliveryZones.filter((zone) => zone.active);
  const hasCoordinates = typeof request.latitude === "number" && typeof request.longitude === "number";
  const blockedZone = hasCoordinates ? activeZones.find((zone) => polygonContains(request as Required<Pick<DeliveryPlace, "latitude" | "longitude">>, zone.blockedPolygons)) : undefined;
  if (blockedZone) return { status: "unavailable", title: "Currently outside our delivery area", detail: "This location is explicitly excluded from the configured delivery coverage.", zone: blockedZone.title, zoneId: blockedZone.id, planEligible: false, reasonCode: "BLOCKED_LOCATION" };

  const matchingZone = (hasCoordinates ? activeZones.find((zone) => polygonContains(request as Required<Pick<DeliveryPlace, "latitude" | "longitude">>, zone.polygons)) : undefined) ?? activeZones.find((zone) => zoneMatchesAdministrativeData(zone, request));
  if (!matchingZone) return activeZones.length === 0
    ? { status: "needs_review", title: "Delivery availability requires confirmation", detail: "Sanbay Fusion has not activated final delivery boundaries yet. Your selected location was received, but no coverage rule can safely confirm it.", planEligible: false, reasonCode: "NO_ACTIVE_ZONE" }
    : { status: "unavailable", title: "Currently outside our delivery area", detail: "This selected location does not match an active Sanbay Fusion coverage polygon or administrative delivery rule.", planEligible: false, reasonCode: "OUTSIDE_COVERAGE" };

  const levels = ["budget", "standard", "premium", "vip"];
  const planEligible = !matchingZone.minimumPlanLevel || !selectedPlanLevel || levels.indexOf(selectedPlanLevel) >= levels.indexOf(matchingZone.minimumPlanLevel);
  if (!planEligible) return { status: "unavailable", title: "Your address is covered, but this plan is not eligible", detail: `${matchingZone.title} requires a ${matchingZone.minimumPlanLevel} membership or above.`, zone: matchingZone.title, zoneId: matchingZone.id, planEligible: false, deliveryFee: matchingZone.deliveryFee, reasonCode: "PLAN_RESTRICTION" };
  return { status: "available", title: "Eligible for delivery", detail: "This location matches an active Sanbay Fusion delivery rule. Final confirmation still depends on your membership entitlement, order notice, availability, and payment.", zone: matchingZone.title, zoneId: matchingZone.id, planEligible: true, deliveryFee: matchingZone.deliveryFee, reasonCode: "COVERED" };
}