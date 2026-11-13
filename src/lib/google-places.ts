/**
 * Google Places API (New) — oficjalne źródło oceny i liczby opinii.
 * Wymaga zmiennej GOOGLE_MAPS_API_KEY (klucz z włączonym „Places API (New)”). Bez klucza dane wpisuje się ręcznie w panelu.
 */
const BASE = "https://places.googleapis.com/v1";
const FIELDS = ["id", "displayName", "formattedAddress", "rating", "userRatingCount", "googleMapsUri"];

export type PlaceInfo = { placeId: string; name: string; address: string; rating: number | null; reviews: number | null; url: string | null };
type RawPlace = { id: string; displayName?: { text?: string }; formattedAddress?: string; rating?: number; userRatingCount?: number; googleMapsUri?: string };

const map = (p: RawPlace): PlaceInfo => ({
  placeId: p.id, name: p.displayName?.text ?? "", address: p.formattedAddress ?? "",
  rating: typeof p.rating === "number" ? p.rating : null, reviews: typeof p.userRatingCount === "number" ? p.userRatingCount : null, url: p.googleMapsUri ?? null,
});

export const googleKeyConfigured = () => !!process.env.GOOGLE_MAPS_API_KEY;

async function call(path: string, mask: string, init: RequestInit = {}) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("Brak klucza GOOGLE_MAPS_API_KEY");
  const res = await fetch(`${BASE}${path}`, {
    ...init, cache: "no-store", signal: AbortSignal.timeout(10_000),
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": mask, ...init.headers },
  });
  if (!res.ok) throw new Error(`Google Places API: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

export async function searchPlace(query: string): Promise<PlaceInfo | null> {
  const data = await call("/places:searchText", FIELDS.map((f) => `places.${f}`).join(","), {
    method: "POST", body: JSON.stringify({ textQuery: query, languageCode: "pl", regionCode: "PL", pageSize: 1 }),
  }) as { places?: RawPlace[] };
  return data.places?.[0] ? map(data.places[0]) : null;
}

export async function getPlace(placeId: string): Promise<PlaceInfo> {
  return map(await call(`/places/${encodeURIComponent(placeId)}?languageCode=pl`, FIELDS.join(",")) as RawPlace);
}
