import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy server-side para a Google Static Maps API.
 * Evita CORS ao gerar PDFs no browser com @react-pdf/renderer.
 *
 * GET /api/km-map?polyline=...&origin=...&destination=...&w=560&h=180
 */
export async function GET(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key não configurada" }, { status: 500 });

  const sp   = req.nextUrl.searchParams;
  const poly = sp.get("polyline");
  const orig = sp.get("origin");
  const dest = sp.get("destination");
  const w    = sp.get("w") ?? "560";
  const h    = sp.get("h") ?? "180";

  // Se não veio polyline mas temos origin+destination, busca traçado real via Directions API
  let resolvedPoly = poly;
  if (!resolvedPoly && orig && dest) {
    try {
      const dirParams = new URLSearchParams({ origin: orig, destination: dest, key: apiKey });
      const dirRes = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?${dirParams.toString()}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (dirRes.ok) {
        const dirData = await dirRes.json();
        resolvedPoly = (dirData as { routes?: { overview_polyline?: { points?: string } }[] })
          ?.routes?.[0]?.overview_polyline?.points ?? null;
      }
    } catch {
      // fallback silencioso — exibe só os marcadores A e B
    }
  }

  const params = new URLSearchParams();
  params.set("size", `${w}x${h}`);
  params.set("scale", "2");
  params.set("maptype", "roadmap");
  params.set("key", apiKey);

  if (resolvedPoly) {
    params.append("path", `color:0x4DB6E4ff|weight:4|enc:${resolvedPoly}`);
  }
  if (orig) params.append("markers", `color:0xFF4136ff|label:A|${orig}`);
  if (dest) params.append("markers", `color:0x2ECC40ff|label:B|${dest}`);

  const url = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return NextResponse.json({ error: "Google Maps retornou erro" }, { status: 502 });
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type":  "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar mapa" }, { status: 502 });
  }
}
