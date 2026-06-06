/**
 * Constrói a URL do proxy /api/km-map para uso em @react-pdf/renderer.
 * O proxy busca a imagem no servidor (sem CORS) e a repassa ao browser.
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
 * Extrai o encoded polyline de um DirectionsResult serializado (JSON do banco)
 * ou de uma instância ao vivo do Google Maps SDK.
 */
export function extractPolyline(result: unknown): string | null {
  if (!result) return null;
  const raw = (result as { routes?: { overview_polyline?: unknown }[] })
    ?.routes?.[0]?.overview_polyline;
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  return (raw as { points?: string })?.points ?? null;
}
