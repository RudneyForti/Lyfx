/**
 * GET /api/km-pdf/[id]
 *
 * Generates the km reimbursement PDF server-side with @react-pdf/renderer.
 * Map images are pre-fetched directly from the Google Static Maps API
 * (no self-referencing HTTP proxy) and embedded as data URLs in the PDF.
 *
 * Polyline priority for each route:
 *   1. KmRoute.routePolyline (saved by the frontend when dragging the map)
 *   2. KmPlace.routeGoing / routeReturn (route configured on the saved Place)
 *   3. Fallback: Google's Directions API (default route)
 */
import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { getKmPeriod, getKmConfig, getCurrentUserName } from "@/app/actions/km-reimbursement";
import { PeriodPdfDocument } from "@/components/km-reimbursement/PeriodPdf";

// ── Extracts the polyline from a serialized DirectionsResult (DB JSON) ────────
function extractPolylineFromJson(json: unknown): string | null {
  if (!json) return null;
  const poly = (json as { routes?: { overview_polyline?: unknown }[] })
    ?.routes?.[0]?.overview_polyline;
  if (!poly) return null;
  if (typeof poly === "string") return poly;
  return (poly as { points?: string })?.points ?? null;
}

// ── Resolves the polyline: KmPlace > Directions API ───────────────────────────
async function resolvePolyline(
  routePolyline: string | null,
  placeId: string | null,
  direction: string | null,
  origin: string,
  destination: string,
  apiKey: string,
): Promise<string | null> {
  // 1. Polyline from the saved Place — source of truth when the route comes from a Place
  //    (the Place is carefully configured in the modal; inline edits on the
  //     period can produce incorrect polylines from Google's default route)
  if (placeId) {
    const place = await db.kmPlace.findUnique({ where: { id: placeId } });
    if (place) {
      const json = direction === "return" ? place.routeReturn : place.routeGoing;
      const poly = extractPolylineFromJson(json);
      if (poly) return poly;
    }
  }

  // 2. Polyline saved directly on the route (manual routes without placeId)
  if (routePolyline) return routePolyline;

  // 3. Fallback: Google's Directions API
  try {
    const params = new URLSearchParams({ origin, destination, key: apiKey });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
      { signal: AbortSignal.timeout(5000) }
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
  } catch { /* silent fallback */ }

  return null;
}

// ── Fetches the map image as base64 ───────────────────────────────────────────
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
      `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!mapRes.ok) return null;

    const buf = await mapRes.arrayBuffer();
    return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

// ── Handler ─────────────────────────────────────────────────────────────────

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

  // Resolve polylines and fetch images in parallel
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

  const element = React.createElement(PeriodPdfDocument, {
    period,
    config,
    userName,
    mapImages,
  }) as React.ReactElement<import("@react-pdf/renderer").DocumentProps>;

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
