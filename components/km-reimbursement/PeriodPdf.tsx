// @react-pdf/renderer — renderiza apenas no cliente (importado via dynamic import)
import {
  Document, Page, Text, View, Image, StyleSheet,
} from "@react-pdf/renderer";
import type { KmPeriodDetail, KmConfigData } from "@/app/actions/km-reimbursement";
import { buildKmMapUrl } from "@/lib/km-static-map";

// ── Paleta ────────────────────────────────────────────────────────────────────

const C = {
  cyan:    "#0891B2",
  cyanBg:  "#E0F2FE",
  text:    "#111827",
  muted:   "#6B7280",
  light:   "#9CA3AF",
  border:  "#E5E7EB",
  bg:      "#F9FAFB",
  white:   "#FFFFFF",
  green:   "#16A34A",
  amber:   "#D97706",
};

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page:         { fontFamily: "Helvetica", fontSize: 9, color: C.text, paddingHorizontal: 40, paddingVertical: 36 },
  // Header
  headerRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  title:        { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.text },
  periodDates:  { fontSize: 8, color: C.muted, marginTop: 2 },
  badgeRow:     { flexDirection: "row", gap: 8, marginTop: 6 },
  badge:        { fontSize: 7, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: C.cyanBg, color: C.cyan, borderRadius: 4 },
  totalBox:     { alignItems: "flex-end" },
  totalLabel:   { fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  totalValue:   { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.cyan, marginTop: 2 },
  // Divider
  divider:      { height: 1, backgroundColor: C.border, marginVertical: 10 },
  // Section
  sectionLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  // Route block
  routeBlock:   { marginBottom: 14, padding: 10, backgroundColor: C.bg, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: C.cyan },
  routeMeta:    { fontSize: 7, color: C.light, marginBottom: 3 },
  routeAddr:    { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 2 },
  routeArrow:   { fontSize: 8, color: C.muted },
  routeKmRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  routeKm:      { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.cyan },
  routeNote:    { fontSize: 8, color: C.muted, fontStyle: "italic" },
  mapImg:       { width: "100%", height: 140, marginTop: 8, borderRadius: 4, objectFit: "cover" },
  // Table
  tableHeader:  { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 4, marginBottom: 2 },
  tableRow:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 5 },
  th:           { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase" },
  td:           { fontSize: 8, color: C.text },
  // Summary card
  summaryCard:  { marginTop: 8, padding: 12, backgroundColor: C.bg, borderRadius: 6 },
  summaryRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  summaryLabel: { fontSize: 8, color: C.muted },
  summaryValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.text },
  summaryTotal: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: C.border },
  summaryTotalLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.text },
  summaryTotalValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.cyan },
  // Footer
  footer:       { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText:   { fontSize: 7, color: C.light },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function fmtDate(d: Date | string) { return new Date(d).toLocaleDateString("pt-BR"); }
function fmtDateLong(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

const EXPENSE_LABELS: Record<string, string> = {
  toll: "Pedágio", parking: "Estacionamento", accommodation: "Hospedagem",
  food: "Refeição", taxi: "Taxi / Uber", other: "Outro",
};

// ── Documento PDF ─────────────────────────────────────────────────────────────

interface Props {
  period:   KmPeriodDetail;
  config:   KmConfigData;
  userName: string;
  baseUrl:  string;
}

export function PeriodPdfDocument({ period, config, userName, baseUrl }: Props) {
  const totalFuelAmount = period.receipts.reduce((s, r) => s + r.totalAmount, 0);
  const minRequired     = period.kmAmount * config.minFuelPct;
  const fuelOk          = totalFuelAmount >= minRequired;

  const gasolineL  = period.receipts.filter(r => r.fuelType === "gasoline").reduce((s, r) => s + r.liters, 0);
  const ethanolL   = period.receipts.filter(r => r.fuelType === "ethanol").reduce((s, r) => s + r.liters, 0);
  const fuelLabel  = ethanolL > gasolineL ? "Etanol" : "Gasolina";
  const taxaPct    = ethanolL > gasolineL
    ? (config.ethanolRate * 100).toFixed(0)
    : (config.gasolineRate * 100).toFixed(0);

  const byType = period.expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + e.amount; return acc;
  }, {});

  const generatedAt = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <Document title={`Reembolso KM — ${period.name}`} author={userName}>
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>{period.name}</Text>
            <Text style={s.periodDates}>
              {fmtDateLong(period.startDate)} → {fmtDateLong(period.endDate)}
            </Text>
            <View style={s.badgeRow}>
              {userName ? <Text style={s.badge}>{userName}</Text> : null}
              {config.vehicleType ? <Text style={s.badge}>{config.vehicleType}</Text> : null}
              {config.vehicleBrand ? <Text style={s.badge}>{config.vehicleBrand}</Text> : null}
              {config.vehiclePlate ? <Text style={s.badge}>Placa: {config.vehiclePlate}</Text> : null}
            </View>
          </View>
          <View style={s.totalBox}>
            <Text style={s.totalLabel}>Total geral</Text>
            <Text style={s.totalValue}>{fmt(period.grandTotal)}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Trajetos ── */}
        {period.routes.length > 0 && (
          <View>
            <Text style={s.sectionLabel}>Trajetos — {period.totalKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km no total</Text>
            {period.routes.map((r, i) => {
              const mapUrl = buildKmMapUrl({
                polyline:    r.routePolyline ?? undefined,
                origin:      r.origin,
                destination: r.destination,
                baseUrl,
                width: 515,
                height: 140,
              });
              return (
                <View key={r.id} style={s.routeBlock} wrap={false}>
                  <Text style={s.routeMeta}>#{i + 1} · {fmtDate(r.date)}{r.notes ? ` · ${r.notes}` : ""}</Text>
                  <Text style={s.routeAddr}>{r.origin}</Text>
                  <Text style={s.routeArrow}>↓</Text>
                  <Text style={s.routeAddr}>{r.destination}</Text>
                  <View style={s.routeKmRow}>
                    <Text style={s.routeKm}>{r.km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km</Text>
                  </View>
                  <Image style={s.mapImg} src={mapUrl} />
                </View>
              );
            })}
            <View style={s.divider} />
          </View>
        )}

        {/* ── Combustível ── */}
        {period.receipts.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={s.sectionLabel}>Notas de Combustível</Text>
            <View style={s.tableHeader}>
              <Text style={[s.th, { width: "18%" }]}>Data</Text>
              <Text style={[s.th, { width: "22%" }]}>Tipo</Text>
              <Text style={[s.th, { width: "20%", textAlign: "right" }]}>Litros</Text>
              <Text style={[s.th, { width: "20%", textAlign: "right" }]}>Preço/L</Text>
              <Text style={[s.th, { flex: 1, textAlign: "right" }]}>Total</Text>
            </View>
            {period.receipts.map(r => (
              <View key={r.id} style={s.tableRow}>
                <Text style={[s.td, { width: "18%" }]}>{fmtDate(r.date)}</Text>
                <Text style={[s.td, { width: "22%" }]}>{r.fuelType === "ethanol" ? "Etanol" : "Gasolina"}</Text>
                <Text style={[s.td, { width: "20%", textAlign: "right" }]}>
                  {r.liters.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} L
                </Text>
                <Text style={[s.td, { width: "20%", textAlign: "right" }]}>
                  R$ {(r.totalAmount / r.liters).toFixed(3)}
                </Text>
                <Text style={[s.td, { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                  {fmt(r.totalAmount)}
                </Text>
              </View>
            ))}
            <View style={s.divider} />
          </View>
        )}

        {/* ── Despesas extras ── */}
        {period.expenses.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={s.sectionLabel}>Despesas Extras</Text>
            <View style={s.tableHeader}>
              <Text style={[s.th, { width: "18%" }]}>Data</Text>
              <Text style={[s.th, { width: "30%" }]}>Tipo</Text>
              <Text style={[s.th, { flex: 1 }]}>Observações</Text>
              <Text style={[s.th, { width: "20%", textAlign: "right" }]}>Valor</Text>
            </View>
            {period.expenses.map(e => (
              <View key={e.id} style={s.tableRow}>
                <Text style={[s.td, { width: "18%" }]}>{fmtDate(e.date)}</Text>
                <Text style={[s.td, { width: "30%" }]}>{EXPENSE_LABELS[e.type] ?? e.type}</Text>
                <Text style={[s.td, { flex: 1, color: C.muted }]}>{e.notes ?? "—"}</Text>
                <Text style={[s.td, { width: "20%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                  {fmt(e.amount)}
                </Text>
              </View>
            ))}
            <View style={s.divider} />
          </View>
        )}

        {/* ── Resumo financeiro ── */}
        <Text style={s.sectionLabel}>Resumo</Text>
        <View style={s.summaryCard}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Combustível</Text>
            <Text style={s.summaryValue}>{fuelLabel} · Preço médio R$ {period.fuelPriceAvg.toFixed(3)}/L</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Taxa por km</Text>
            <Text style={s.summaryValue}>
              R$ {period.ratePerKm.toFixed(4)} ({taxaPct}% × R$ {period.fuelPriceAvg.toFixed(3)})
            </Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>KM rodados</Text>
            <Text style={s.summaryValue}>
              {period.totalKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
            </Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Valor km</Text>
            <Text style={s.summaryValue}>{fmt(period.kmAmount)}</Text>
          </View>
          {Object.entries(byType).map(([type, total]) => (
            <View key={type} style={s.summaryRow}>
              <Text style={s.summaryLabel}>{EXPENSE_LABELS[type] ?? type}</Text>
              <Text style={s.summaryValue}>{fmt(total)}</Text>
            </View>
          ))}
          <View style={s.summaryTotal}>
            <Text style={s.summaryTotalLabel}>TOTAL GERAL</Text>
            <Text style={s.summaryTotalValue}>{fmt(period.grandTotal)}</Text>
          </View>
        </View>

        {/* Notas combustível */}
        <View style={{ marginTop: 8, flexDirection: "row", gap: 4 }}>
          <Text style={{ fontSize: 8, color: fuelOk ? C.green : C.amber }}>
            {fuelOk ? "✓" : "✗"}
          </Text>
          <Text style={{ fontSize: 8, color: C.muted }}>
            Notas apresentadas: {fmt(totalFuelAmount)} · Mínimo exigido ({(config.minFuelPct * 100).toFixed(0)}%): {fmt(minRequired)}
          </Text>
        </View>

        {/* Datas de envio */}
        {period.submittedAt && (
          <View style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 8, color: C.muted }}>
              Enviado em: {fmtDate(period.submittedAt)}
              {period.expectedPayAt ? ` · Pagamento previsto: ${fmtDate(period.expectedPayAt)}` : ""}
            </Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Lyfx · Reembolso KM</Text>
          <Text style={s.footerText}>Gerado em {generatedAt}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}
