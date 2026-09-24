"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { deliveryZones, type DeliveryAvailability, type DeliveryPlace } from "@/lib/delivery";
import { districtsForProvince, provinces, subdistrictsForDistrict } from "@/lib/thailand-locations";
import { membershipPlans } from "@/lib/membership-plans";

type GooglePlace = { place_id?: string; formatted_address?: string; geometry?: { location?: { lat: () => number; lng: () => number } }; address_components?: Array<{ long_name: string; types: string[] }> };
type GoogleMapsApi = { maps: { Map: new (element: HTMLElement, options: { center: { lat: number; lng: number }; zoom: number; mapTypeControl: boolean; streetViewControl: boolean }) => GoogleMap; Marker: new (options: { map: GoogleMap; position: { lat: number; lng: number } }) => GoogleMarker; Polygon: new (options: { map: GoogleMap; paths: Array<{ lat: number; lng: number }>; strokeColor: string; fillColor: string; fillOpacity: number }) => unknown; Geocoder: new () => { geocode: (request: { location: { lat: number; lng: number } }, callback: (results: GooglePlace[], status: string) => void) => void }; places: { Autocomplete: new (input: HTMLInputElement, options: { componentRestrictions: { country: string[] }; fields: string[] }) => GoogleAutocomplete } } };
type GoogleMap = { setCenter: (center: { lat: number; lng: number }) => void; setZoom: (zoom: number) => void };
type GoogleMarker = { setMap: (map: GoogleMap | null) => void };
type GoogleAutocomplete = { addListener: (event: string, callback: () => void) => void; getPlace: () => GooglePlace };
type GoogleWindow = Window & { google?: GoogleMapsApi };

type EligibilityResponse = DeliveryAvailability & { address?: string; province?: string; district?: string; subdistrict?: string; postalCode?: string };

function addressComponent(place: GooglePlace, types: string[]) {
  return place.address_components?.find((component) => types.some((type) => component.types.includes(type)))?.long_name;
}

export function DeliveryCheck() {
  const [address, setAddress] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<DeliveryPlace | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [result, setResult] = useState<EligibilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const mapsConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const [mapsStatus, setMapsStatus] = useState<"loading" | "ready" | "not-configured" | "error">(mapsConfigured ? "loading" : "not-configured");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<GoogleMap | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return;
    const browser = window as GoogleWindow;
    const initialize = () => {
      if (!browser.google || !mapRef.current || !inputRef.current) { setMapsStatus("error"); return; }
      const api = browser.google;
      const map = new api.maps.Map(mapRef.current, { center: { lat: 13.7563, lng: 100.5018 }, zoom: 11, mapTypeControl: false, streetViewControl: false });
      mapInstanceRef.current = map;
      deliveryZones.filter((zone) => zone.active).forEach((zone) => zone.polygons.forEach((polygon) => new api.maps.Polygon({ map, paths: polygon.map((point) => ({ lat: point.latitude, lng: point.longitude })), strokeColor: "#c9a86a", fillColor: "#c9a86a", fillOpacity: 0.16 })));
      const autocomplete = new api.maps.places.Autocomplete(inputRef.current, { componentRestrictions: { country: ["th"] }, fields: ["place_id", "formatted_address", "geometry", "address_components"] });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const location = place.geometry?.location;
        if (!location || !place.place_id) return;
        const nextPlace: DeliveryPlace = { placeId: place.place_id, formattedAddress: place.formatted_address ?? inputRef.current?.value ?? "", latitude: location.lat(), longitude: location.lng(), province: addressComponent(place, ["administrative_area_level_1"]), district: addressComponent(place, ["administrative_area_level_2", "administrative_area_level_1"]), subdistrict: addressComponent(place, ["sublocality_level_1", "locality"]), postalCode: addressComponent(place, ["postal_code"]) };
        setAddress(nextPlace.formattedAddress); setSelectedPlace(nextPlace); setProvince(nextPlace.province ?? ""); setDistrict(nextPlace.district ?? ""); setSubdistrict(nextPlace.subdistrict ?? ""); setPostalCode(nextPlace.postalCode ?? ""); setResult(null); map.setCenter({ lat: nextPlace.latitude!, lng: nextPlace.longitude! }); map.setZoom(15); markerRef.current?.setMap(null); markerRef.current = new api.maps.Marker({ map, position: { lat: nextPlace.latitude!, lng: nextPlace.longitude! } });
      });
      setMapsStatus("ready");
    };
    if (browser.google) { initialize(); return; }
    const existing = document.getElementById("google-maps-script");
    if (existing) { existing.addEventListener("load", initialize); return () => existing.removeEventListener("load", initialize); }
    const script = document.createElement("script"); script.id = "google-maps-script"; script.async = true; script.defer = true; script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly`; script.addEventListener("load", initialize); script.addEventListener("error", () => setMapsStatus("error")); document.head.appendChild(script);
    return () => script.removeEventListener("load", initialize);
  }, []);

  async function checkAddress(place: DeliveryPlace | null) {
    if (!place) { setResult({ status: "needs_review", title: "Select an address from the map", detail: "Choose a Google Maps result or complete the manual area fields so the server can check the location." }); return; }
    setLoading(true); setResult(null);
    try { const response = await fetch("/api/delivery/eligibility", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...place, selectedPlanId: selectedPlanId || undefined }) }); const payload = await response.json(); setResult(response.ok ? payload : { status: "needs_review", title: "We couldn't verify this address automatically right now", detail: payload.error ?? "Please use the manual area checker below." }); } catch { setResult({ status: "needs_review", title: "Delivery availability requires confirmation", detail: "We couldn't reach the eligibility service. Please use the manual area checker or try again shortly." }); } finally { setLoading(false); }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { setResult({ status: "needs_review", title: "Location access is unavailable", detail: "Please search for your address or use the manual area checker." }); return; }
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords; const browser = window as GoogleWindow; const api = browser.google; if (!api || !mapInstanceRef.current) { setResult({ status: "needs_review", title: "Map services are not configured", detail: "Please search for your address or use the manual area checker." }); return; }
      const map = mapInstanceRef.current; map.setCenter({ lat: latitude, lng: longitude }); map.setZoom(15); markerRef.current?.setMap(null); markerRef.current = new api.maps.Marker({ map, position: { lat: latitude, lng: longitude } });
      new api.maps.Geocoder().geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => { const first = results[0]; if (status !== "OK" || !first) { setResult({ status: "needs_review", title: "We couldn't identify that location", detail: "Please search for the address manually or use the area selectors." }); return; } const place: DeliveryPlace = { placeId: first.place_id ?? `geo:${latitude},${longitude}`, formattedAddress: first.formatted_address ?? "Current location", latitude, longitude, province: addressComponent(first, ["administrative_area_level_1"]), district: addressComponent(first, ["administrative_area_level_2"]), subdistrict: addressComponent(first, ["sublocality_level_1", "locality"]), postalCode: addressComponent(first, ["postal_code"]) }; setAddress(place.formattedAddress); setSelectedPlace(place); setProvince(place.province ?? ""); setDistrict(place.district ?? ""); setSubdistrict(place.subdistrict ?? ""); setPostalCode(place.postalCode ?? ""); });
    }, () => setResult({ status: "needs_review", title: "Location permission was not granted", detail: "Search for your address or use the manual area checker instead." }));
  }

  function checkManualArea() {
    if (!province || !district || !subdistrict || !postalCode) { setManualMessage("Select a province, district, subdistrict, and postal code first."); return; }
    setManualMessage(""); setSelectedPlace({ placeId: `manual:${province}:${district}:${subdistrict}:${postalCode}`, formattedAddress: `${subdistrict}, ${district}, ${province} ${postalCode}`, province, district, subdistrict, postalCode }); checkAddress({ placeId: `manual:${province}:${district}:${subdistrict}:${postalCode}`, formattedAddress: `${subdistrict}, ${district}, ${province} ${postalCode}`, province, district, subdistrict, postalCode });
  }

  const districts = districtsForProvince(province); const subdistricts = subdistrictsForDistrict(province, district); const postalOptions = subdistricts.find((item) => item.name === subdistrict)?.postalCodes ?? [];
  return <div className="space-y-10"><section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div className="rounded-sm border border-border/60 bg-card/30 p-6 sm:p-8"><div className="flex items-center gap-3"><MapPin className="size-5 text-gold" /><p className="text-eyebrow text-gold">Address autocomplete</p></div><h2 className="mt-5 font-display text-3xl font-light italic">Check delivery availability</h2><p className="mt-4 text-sm leading-relaxed text-foreground/70">Enter your delivery address to see whether Sanbay Fusion currently delivers to your area. Google supplies the location; Sanbay Fusion coverage rules make the decision.</p><form onSubmit={(event) => { event.preventDefault(); checkAddress(selectedPlace); }} className="mt-7"><label className="text-sm"><span className="text-xs text-muted-foreground">Address, condo, building or area</span><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input ref={inputRef} value={address} onChange={(event) => { setAddress(event.target.value); setSelectedPlace(null); setResult(null); }} placeholder="Search your address" className="mt-2 h-12 w-full rounded-sm border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40" /></div></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-eyebrow text-gold-foreground disabled:opacity-60"><Search className="size-4" />{loading ? "Checking..." : "Check Availability"}</button><button type="button" onClick={useCurrentLocation} className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/30 px-5 py-3 text-eyebrow"><LocateFixed className="size-4" />Use My Current Location</button></div></form><p className="mt-4 text-xs leading-relaxed text-muted-foreground">{mapsStatus === "ready" ? "Google autocomplete is active for Thailand." : mapsStatus === "not-configured" ? "Google Maps is not configured yet. Use the manual area checker below." : mapsStatus === "error" ? "Google Maps could not be loaded. Use the manual area checker below." : "Loading Google Maps services..."}</p></div><div ref={mapRef} className="relative min-h-72 overflow-hidden rounded-sm border border-border/60 bg-card/30"><div className="absolute inset-0 grid place-items-center p-8 text-center text-sm text-muted-foreground">{mapsStatus === "ready" ? "Select an address to place it on the map." : "Interactive map preview appears when the browser Google Maps key is configured."}</div></div></section>
    {result && <section className={`rounded-sm border p-6 sm:p-8 ${result.status === "available" ? "border-gold/70 bg-gold/10" : "border-border/60 bg-card/30"}`}><p className="text-eyebrow text-gold">{result.title}</p><p className="mt-4 max-w-3xl text-sm leading-relaxed text-foreground/75">{result.detail}</p><dl className="mt-7 grid gap-5 border-t border-border/40 pt-6 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-muted-foreground">Delivery address</dt><dd className="mt-1">{result.address ?? selectedPlace?.formattedAddress ?? "Not selected"}</dd></div><div><dt className="text-muted-foreground">Coverage zone</dt><dd className="mt-1">{result.zone ?? "Not confirmed"}</dd></div><div><dt className="text-muted-foreground">Province / district</dt><dd className="mt-1">{[result.province ?? selectedPlace?.province, result.district ?? selectedPlace?.district].filter(Boolean).join(" · ") || "Not identified"}</dd></div><div><dt className="text-muted-foreground">Delivery fee</dt><dd className="mt-1">{typeof result.deliveryFee === "number" ? `฿${result.deliveryFee.toLocaleString("en-US")}` : "Calculated at order"}</dd></div></dl><p className="mt-7 text-sm leading-relaxed text-muted-foreground">Delivery eligibility does not confirm an order. Active members still need an eligible plan, available delivery entitlement, an eligible date, at least 3 days of advance notice, applicable order payment, and confirmation.</p></section>}
    <section className="rounded-sm border border-border/60 bg-card/30 p-6 sm:p-8"><p className="text-eyebrow text-gold">Membership plan check</p><p className="mt-3 text-sm text-muted-foreground">Optional: check whether a selected membership level can use the matched zone.</p><select value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)} className="mt-5 h-11 w-full max-w-md rounded-sm border border-input bg-background px-3 text-sm"><option value="">No plan selected</option>{membershipPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {plan.level}</option>)}</select></section>
    <section className="rounded-sm border border-border/60 bg-card/30 p-6 sm:p-8"><p className="text-eyebrow text-gold">Check by area</p><p className="mt-3 text-sm text-muted-foreground">If Google Maps is unavailable, use the same server-side eligibility rules with structured location data.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm"><span className="text-xs text-muted-foreground">Province</span><select value={province} onChange={(event) => { setProvince(event.target.value); setDistrict(""); setSubdistrict(""); setPostalCode(""); }} className="mt-2 h-11 w-full rounded-sm border border-input bg-background px-3"><option value="">Select Province</option>{provinces.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm"><span className="text-xs text-muted-foreground">District</span><select value={district} onChange={(event) => { setDistrict(event.target.value); setSubdistrict(""); setPostalCode(""); }} disabled={!province} className="mt-2 h-11 w-full rounded-sm border border-input bg-background px-3"><option value="">Select District</option>{districts.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label className="text-sm"><span className="text-xs text-muted-foreground">Subdistrict</span><select value={subdistrict} onChange={(event) => { setSubdistrict(event.target.value); setPostalCode(""); }} disabled={!district} className="mt-2 h-11 w-full rounded-sm border border-input bg-background px-3"><option value="">Select Subdistrict</option>{subdistricts.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label className="text-sm"><span className="text-xs text-muted-foreground">Postal Code</span><select value={postalCode} onChange={(event) => setPostalCode(event.target.value)} disabled={!subdistrict} className="mt-2 h-11 w-full rounded-sm border border-input bg-background px-3"><option value="">Auto / Select</option>{postalOptions.map((item) => <option key={item}>{item}</option>)}</select></label></div><button type="button" onClick={checkManualArea} className="mt-6 rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground">Check Area</button>{manualMessage && <p className="mt-3 text-sm text-gold">{manualMessage}</p>}</section>
    <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground"><span className="text-eyebrow text-gold">Coverage legend</span>{deliveryZones.filter((zone) => zone.active).map((zone) => <span key={zone.id} className="flex items-center gap-2"><span className="size-2 rounded-full bg-gold" />{zone.title}</span>)}{deliveryZones.every((zone) => !zone.active) && <span>Coverage boundaries will appear when active zones are configured.</span>}</div><div className="rounded-sm border border-gold/40 bg-gold/5 p-6 text-sm leading-relaxed text-foreground/75"><strong className="text-gold">Important:</strong> Membership determines benefits and delivery frequency. Coverage determines whether the physical location can be serviced. Both may need to be satisfied before a delivery is confirmed.</div></div>;
}