/**
 * Builds the /api/km-map proxy URL for use with @react-pdf/renderer.
 * The proxy fetches the image server-side (no CORS) and relays it to the browser.
 */
export function buildKmMapUrl({
  polyline,
  origin,
  destination,
  baseUrl,
  width = 560,
  height = 180,
}: {
  polyline?: string | null;
  origin?: string;
  destination?: string;
  /** window.location.origin em componentes cliente */
  baseUrl: string;
  width?: number;
  height?: number;
}): string {
  const params = new URLSearchParams();
  params.set("w", String(width));
  params.set("h", String(height));
  if (polyline)    params.set("polyline", polyline);
  if (origin)      params.set("origin",   origin);
  if (destination) params.set("destination", destination);
  return `${baseUrl}/api/km-map?${params.toString()}`;
}

/**
 * Extracts the encoded polyline from a serialized DirectionsResult (DB JSON)
 * or from a live Google Maps SDK instance.
 */
export function extractPolyline(result: unknown): string | null {
  if (!result) return null;
  const raw = (result as { routes?: { overview_polyline?: unknown }[] })
    ?.routes?.[0]?.overview_polyline;
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  return (raw as { points?: string })?.points ?? null;
}
