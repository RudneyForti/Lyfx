/**
 * GET /api/km-pdf/[id]
 *
 * Gera o PDF de reembolso KM server-side com @react-pdf/renderer.
 * As imagens dos mapas são pré-buscadas diretamente da Google Static Maps API
 * (sem proxy HTTP self-referencial) e embeddadas como data URLs no PDF.
 */
import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import { getSessionUserId } from "@/lib/session";
import { getKmPeriod, getKmConfig, getCurrentUserName } from "@/app/actions/km-reimbursement";
import { PeriodPdfDocument } from "@/components/km-reimbursement/PeriodPdf";

// ── Busca imagem do mapa diretamente da Google Static Maps API ────────────────

async function fetchMapDataUrl(
  polyline: string | null,
  origin: string,
  destination: string,
  apiKey: string,
): Promise<string | null> {
  try {
    let resolvedPoly = polyline;

    // Se não há polyline salvo, busca via Directions API
    if (!resolvedPoly && origin && destination) {
      const dirParams = new URLSearchParams({ origin, destination, key: apiKey });
      const dirRes = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?${dirParams.toString()}`
      );
      if (dirRes.ok) {
        const dirData = await dirRes.json() as {
          routes?: { overview_polyline?: { points?: string } }[];
        };
        resolvedPoly = dirData?.routes?.[0]?.overview_polyline?.points ?? null;
      }
    }

    // Monta URL da imagem estática
    const params = new URLSearchParams({
      size:    "515x140",
      scale:   "2",
      maptype: "roadmap",
      key:     apiKey,
    });
    if (resolvedPoly) params.append("path", `color:0x4DB6E4ff|weight:4|enc:${resolvedPoly}`);
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

  // Pré-busca todas as imagens em paralelo
  const mapImages = await Promise.all(
    period.routes.map(r =>
      fetchMapDataUrl(r.routePolyline, r.origin, r.destination, apiKey)
    )
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
