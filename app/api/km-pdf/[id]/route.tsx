/**
 * GET /api/km-pdf/[id]
 *
 * Gera o PDF de reembolso KM server-side com @react-pdf/renderer.
 * As imagens dos mapas são pré-buscadas diretamente da Google Static Maps API
 * (sem proxy HTTP self-referencial) e embeddadas como data URLs no PDF.
 *
 * Prioridade do polyline para cada trajeto:
 *   1. KmRoute.routePolyline (salvo pelo frontend ao arrastar o mapa)
 *   2. KmPlace.routeGoing / routeReturn (trajeto configurado no lugar salvo)
 *   3. Fallback: Directions API do Google (rota padrão)
 */
import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { getKmPeriod, getKmConfig, getCurrentUserName } from "@/app/actions/km-reimbursement";
import { PeriodPdfDocument } from "@/components/km-reimbursement/PeriodPdf";

// ── Extrai polyline de um DirectionsResult serializado (JSON do banco) ─────────
function extractPolylineFromJson(json: unknown): string | null {
  if (!json) return null;
  const poly = (json as { routes?: { overview_polyline?: unknown }[] })
    ?.routes?.[0]?.overview_polyline;
  if (!poly) return null;
  if (typeof poly === "string") return poly;
  return (poly as { points?: string })?.points ?? null;
}

// ── Busca polyline: KmPlace > Directions API ───────────────────────────────────
async function resolvePolyline(
  routePolyline: string | null,
  placeId: string | null,
  direction: string | null,
  origin: string,
  destination: string,
  apiKey: string,
): Promise<string | null> {
  // 1. Polyline do Lugar salvo — fonte da verdade quando o trajeto vem de um Lugar
  //    (o Lugar é configurado cuidadosamente no modal; edições inline no período
  //     podem gerar polylines incorretos a partir da rota padrão do Google)
  if (placeId) {
    const place = await db.kmPlace.findUnique({ where: { id: placeId } });
    if (place) {
      const json = direction === "return" ? place.routeReturn : place.routeGoing;
      const poly = extractPolylineFromJson(json);
      if (poly) return poly;
    }
  }

  // 2. Polyline salvo diretamente no trajeto (rotas manuais sem placeId)
  if (routePolyline) return routePolyline;

  // 3. Fallback: Directions API do Google
  try {
    const params = new URLSearchParams({ origin, destination, key: apiKey });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    );
    if (res.ok) {
      const data = await res.json() as {
        status?: string;
        routes?: { overview_polyline?: { points?: string } }[];
      };
      if (data.status === "OK") {
        return data?.routes?.[0]?.overview_polyline?.points ?? null;
      }
    }
  } catch { /* fallback silencioso */ }

  return null;
}

// ── Busca imagem do mapa como base64 ──────────────────────────────────────────
async function fetchMapDataUrl(
  polyline: string | null,
  origin: string,
  destination: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      size:    "515x140",
      scale:   "2",
      maptype: "roadmap",
      key:     apiKey,
    });
    if (polyline)     params.append("path",    `color:0x4DB6E4ff|weight:4|enc:${polyline}`);
    if (origin)       params.append("markers", `color:0xFF4136ff|label:A|${origin}`);
    if (destination)  params.append("markers", `color:0x2ECC40ff|label:B|${destination}`);

    const mapRes = await fetch(
      `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
    );
    if (!mapRes.ok) return null;

    const buf = await mapRes.arrayBuffer();
    return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const [period, config, userName] = await Promise.all([
    getKmPeriod(id),
    getKmConfig(),
    getCurrentUserName(),
  ]);

  if (!period) {
    return NextResponse.json({ error: "Período não encontrado" }, { status: 404 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  // Resolve polylines e busca imagens em paralelo
  const mapImages = await Promise.all(
    period.routes.map(async r => {
      const poly = await resolvePolyline(
        r.routePolyline,
        r.placeId,
        r.direction,
        r.origin,
        r.destination,
        apiKey,
      );
      return fetchMapDataUrl(poly, r.origin, r.destination, apiKey);
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(PeriodPdfDocument, {
    period,
    config,
    userName,
    mapImages,
  }) as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer: any = await pdf(element).toBuffer();

  const safeName = period.name.toLowerCase().replace(/\s+/g, "-");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="reembolso-km-${safeName}.pdf"`,
      "Cache-Control":       "private, no-cache",
    },
  });
}
