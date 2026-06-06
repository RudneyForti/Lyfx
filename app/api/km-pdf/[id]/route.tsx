/**
 * GET /api/km-pdf/[id]
 *
 * Gera o PDF de reembolso KM server-side com @react-pdf/renderer.
 * Rodar no servidor evita que o Turbopack tente compilar
 * @react-pdf/renderer (que usa módulos nativos) para o browser.
 */
import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import { getSessionUserId } from "@/lib/session";
import { getKmPeriod, getKmConfig, getCurrentUserName } from "@/app/actions/km-reimbursement";
import { PeriodPdfDocument } from "@/components/km-reimbursement/PeriodPdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Autenticação via cookie de sessão
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  // Busca dados em paralelo — as actions já validam userId internamente
  const [period, config, userName] = await Promise.all([
    getKmPeriod(id),
    getKmConfig(),
    getCurrentUserName(),
  ]);

  if (!period) {
    return NextResponse.json({ error: "Período não encontrado" }, { status: 404 });
  }

  // baseUrl para o proxy /api/km-map que renderiza as imagens dos trajetos
  const baseUrl = new URL(req.url).origin;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(PeriodPdfDocument, { period, config, userName, baseUrl }) as any;

  // toBuffer() retorna ReadableStream nos tipos do v4 — em runtime é Buffer no Node.js
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer: any = await pdf(element).toBuffer();

  const safeName = period.name.toLowerCase().replace(/\s+/g, "-");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reembolso-km-${safeName}.pdf"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
