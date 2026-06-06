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

  const params = new URLSearchParams();
  params.set("size", `${w}x${h}`);
  params.set("scale", "2");
  params.set("maptype", "roadmap");
  params.set("key", apiKey);

  if (poly) {
    params.append("path", `color:0x4DB6E4ff|weight:4|enc:${poly}`);
  }
  if (orig) params.append("markers", `color:0xFF4136ff|label:A|${orig}`);
  if (dest) params.append("markers", `color:0x2ECC40ff|label:B|${dest}`);

  const url = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  try {
    const res = await fetch(url);
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
