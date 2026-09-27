import "server-only";

export type GeocodedAddress = {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
};

type GoogleGeocodeResult = {
  place_id?: string;
  formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  address_components?: Array<{ long_name: string; types: string[] }>;
};

function addressComponent(place: GoogleGeocodeResult, types: string[]) {
  return place.address_components?.find((component) => types.some((type) => component.types.includes(type)))?.long_name;
}

export async function geocodeGoogleAddress({ address, placeId }: { address?: string; placeId?: string }) {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!key) return { ok: false as const, reason: "not_configured" as const };
  if (!address && !placeId) return { ok: false as const, reason: "not_found" as const };

  const parameters = new URLSearchParams({ key });
  if (placeId) parameters.set("place_id", placeId);
  else parameters.set("address", address!);
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${parameters}`, { cache: "no-store" });
  if (!response.ok) return { ok: false as const, reason: "unavailable" as const };
  const payload = await response.json() as { status?: string; results?: GoogleGeocodeResult[] };
  if (payload.status !== "OK") return { ok: false as const, reason: payload.status === "ZERO_RESULTS" ? "not_found" as const : "unavailable" as const };

  const result = payload.results?.[0];
  const location = result?.geometry?.location;
  if (!result || !location) return { ok: false as const, reason: "not_found" as const };

  return {
    ok: true as const,
    place: {
      placeId: result.place_id ?? placeId ?? "",
      formattedAddress: result.formatted_address ?? address ?? "",
      latitude: location.lat,
      longitude: location.lng,
      province: addressComponent(result, ["administrative_area_level_1"]),
      district: addressComponent(result, ["administrative_area_level_2"]),
      subdistrict: addressComponent(result, ["sublocality_level_1", "locality"]),
      postalCode: addressComponent(result, ["postal_code"]),
    } satisfies GeocodedAddress,
  };
}