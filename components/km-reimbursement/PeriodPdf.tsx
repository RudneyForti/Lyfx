// @react-pdf/renderer — used server-side via /api/km-pdf/[id]
import {
  Document, Page, Text, View, Image, StyleSheet, Svg, Circle,
} from "@react-pdf/renderer";
import type { KmPeriodDetail, KmConfigData } from "@/app/actions/km-reimbursement";

// ── Paleta ────────────────────────────────────────────────────────────────────

const C = {
  cyan:      "#0EA5E9",
  cyanLight: "#BAE6FD",
  dark:      "#1A1E23",   // header bg
  darkLine:  "rgba(255,255,255,0.1)",
  text:      "#1F2937",
  muted:     "#6B7280",
  light:     "#9CA3AF",
  border:    "#E2E5EA",
  pageBg:    "#F5F6F9",   // page bg — não branco puro
  card:      "#FFFFFF",
  green:     "#16A34A",
  amber:     "#D97706",
  dot:       "#DDE1EA",   // cor dos pontinhos do pattern
};

// ── Dot pattern (generated once) ──────────────────────────────────────────────

const DOT_SPACING = 30;
const DOT_POSITIONS: { x: number; y: number }[] = [];
for (let row = 0; row * DOT_SPACING <= 842 + DOT_SPACING; row++) {
  for (let col = 0; col * DOT_SPACING <= 595 + DOT_SPACING; col++) {
    DOT_POSITIONS.push({ x: col * DOT_SPACING, y: row * DOT_SPACING });
  }
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Page — paddingTop 56 to leave room for the mini-header on pages 2+
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.text,
    backgroundColor: C.pageBg,
    paddingHorizontal: 40,
    paddingTop: 56,
    paddingBottom: 44,
  },

  // ── Full header (1st page, in flow)
  headerBox: {
    backgroundColor: C.dark,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 18,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  // typographic logo: "Ly" white + "fx" cyan, Times-BoldItalic
  logoMark: {
    flexDirection: "row",
    alignItems: "baseline",
    marginRight: 10,
  },
  logoLy: {
    fontFamily: "Times-BoldItalic",
    fontSize: 18,
    color: "#FFFFFF",
  },
  logoFx: {
    fontFamily: "Times-BoldItalic",
    fontSize: 18,
    color: "#22D3EE",
  },
  // mini version of the logo (pages 2+)
  miniLogoLy: {
    fontFamily: "Times-BoldItalic",
    fontSize: 12,
    color: C.muted,
  },
  miniLogoFx: {
    fontFamily: "Times-BoldItalic",
    fontSize: 12,
    color: C.cyan,
  },
  docTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  headerDivider: {
    height: 1,
    backgroundColor: C.darkLine,
    marginBottom: 14,
  },
  headerInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  periodName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    marginBottom: 3,
  },
  periodDates: {
    fontSize: 8,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  badge: {
    fontSize: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.65)",
    borderRadius: 3,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 7,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.cyan,
    marginBottom: 6,
  },
  kmTotalLabel: {
    fontSize: 7,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
    textAlign: "right",
  },
  kmTotalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "rgba(255,255,255,0.75)",
    textAlign: "right",
  },

  // ── Mini-header (pages 2+ — fixed)
  // Posicionado dentro do paddingTop (56pt) — a linha fica em top≈42
  miniHeader: {
    position: "absolute",
    top: 12,
    left: 40,
    right: 40,
  },
  miniHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  miniHeaderLine: {
    height: 1,
    backgroundColor: C.border,
  },
  miniLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  miniTitle: {
    fontSize: 8,
    color: C.muted,
  },
  miniPeriod: {
    fontSize: 7,
    color: C.light,
  },

  // ── Section
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },

  // ── Bloco de trajeto
  routeBlock: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: C.card,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: C.cyan,
  },
  routeMeta: {
    fontSize: 7,
    color: C.light,
    marginBottom: 5,
  },
  routeTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    marginBottom: 7,
  },
  routeAddrRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  routeAddrLabel: {
    fontSize: 7,
    color: C.light,
    width: 30,
    paddingTop: 0.5,
  },
  routeAddr: {
    fontSize: 8,
    color: C.muted,
    flex: 1,
  },
  routeKmRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  routeKm: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.cyan,
  },
  mapImg: {
    width: "100%",
    height: 128,
    marginTop: 9,
    borderRadius: 4,
    objectFit: "cover",
  },

  // ── Tabelas
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 5,
  },
  th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase" },
  td: { fontSize: 8, color: C.text },

  // ── Resumo
  summaryCard: {
    marginTop: 8,
    padding: 14,
    backgroundColor: C.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  summaryLabel: { fontSize: 8, color: C.muted },
  summaryValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.text },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  summaryTotalLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.text },
  summaryTotalValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.cyan },

  // ── Footer
  footer: {
    position: "absolute",
    bottom: 16,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 7, color: C.light },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR");
}
function fmtDateLong(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

const EXPENSE_LABELS: Record<string, string> = {
  toll: "Pedágio", parking: "Estacionamento", accommodation: "Hospedagem",
  food: "Refeição", taxi: "Taxi / Uber", other: "Outro",
};

// ── Documento PDF ─────────────────────────────────────────────────────────────

interface Props {
  period:    KmPeriodDetail;
  config:    KmConfigData;
  userName:  string;
  mapImages: (string | null)[];
}

export function PeriodPdfDocument({ period, config, userName, mapImages }: Props) {
  const totalFuelAmount = period.receipts.reduce((a, r) => a + r.totalAmount, 0);
  const minRequired     = period.kmAmount * config.minFuelPct;
  const fuelOk          = totalFuelAmount >= minRequired;

  const ethanolL   = period.receipts.filter(r => r.fuelType === "ethanol").reduce((a, r) => a + r.liters, 0);
  const gasolineL  = period.receipts.filter(r => r.fuelType === "gasoline").reduce((a, r) => a + r.liters, 0);
  const fuelLabel  = ethanolL > gasolineL ? "Etanol" : "Gasolina";
  const taxaPct    = ethanolL > gasolineL
    ? (config.ethanolRate * 100).toFixed(0)
    : (config.gasolineRate * 100).toFixed(0);

  const byType = period.expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + e.amount; return acc;
  }, {});

  const generatedAt = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <Document title={`Demonstrativo de Rotas — ${period.name}`} author={userName}>
      <Page size="A4" style={s.page}>

        {/* ── Background de bolinhas (todas as páginas) ── */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} fixed>
          <Svg width={595} height={842} viewBox="0 0 595 842">
            {DOT_POSITIONS.map((d, i) => (
              <Circle key={i} cx={d.x} cy={d.y} r={1.2} fill={C.dot} />
            ))}
          </Svg>
        </View>

        {/* ── Mini-header — páginas 2+ (fixed, dentro do paddingTop) ── */}
        <View
          fixed
          style={s.miniHeader}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          render={({ pageNumber }: any) => pageNumber > 1 ? (
            <>
              <View style={s.miniHeaderRow}>
                <View style={s.miniLeft}>
                  {/* Logotipo tipográfico mini */}
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text style={s.miniLogoLy}>Ly</Text>
                    <Text style={s.miniLogoFx}>fx</Text>
                  </View>
                  <Text style={s.miniTitle}>Demonstrativo de Rotas</Text>
                </View>
                <Text style={s.miniPeriod}>{period.name}</Text>
              </View>
              <View style={s.miniHeaderLine} />
            </>
          ) : null}
        />

        {/* ── Header completo — 1ª página ── */}
        <View style={s.headerBox}>
          {/* Logo tipográfico + título do documento */}
          <View style={s.headerTopRow}>
            <View style={s.logoMark}>
              <Text style={s.logoLy}>Ly</Text>
              <Text style={s.logoFx}>fx</Text>
            </View>
            <Text style={s.docTitle}>Demonstrativo de Rotas</Text>
          </View>

          <View style={s.headerDivider} />

          {/* Informações do período */}
          <View style={s.headerInfoRow}>
            <View style={s.headerLeft}>
              <Text style={s.periodName}>{period.name}</Text>
              <Text style={s.periodDates}>
                {fmtDateLong(period.startDate)} → {fmtDateLong(period.endDate)}
              </Text>
              <View style={s.badgeRow}>
                {userName ? <Text style={s.badge}>{userName}</Text> : null}
                {config.vehicleType  ? <Text style={s.badge}>{config.vehicleType}</Text>  : null}
                {config.vehicleBrand ? <Text style={s.badge}>{config.vehicleBrand}</Text> : null}
                {config.vehiclePlate ? <Text style={s.badge}>Placa {config.vehiclePlate}</Text> : null}
              </View>
            </View>
            <View style={s.headerRight}>
              <Text style={s.totalLabel}>Total geral</Text>
              <Text style={s.totalValue}>{fmt(period.grandTotal)}</Text>
              <Text style={s.kmTotalLabel}>KM percorrido</Text>
              <Text style={s.kmTotalValue}>
                {period.totalKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
              </Text>
            </View>
          </View>
        </View>

        {/* ── Trajetos ── */}
        {period.routes.length > 0 && (
          <View>
            <Text style={s.sectionLabel}>
              Trajetos — {period.routes.length} {period.routes.length === 1 ? "deslocamento" : "deslocamentos"}
            </Text>
            {period.routes.map((r, i) => {
              const routeTitle = r.notes || `Deslocamento #${i + 1}`;
              const imgSrc = mapImages[i];
              return (
                <View key={r.id} style={s.routeBlock} wrap={false}>
                  <Text style={s.routeMeta}>
                    #{i + 1} · {fmtDate(r.date)}
                  </Text>
                  <Text style={s.routeTitle}>{routeTitle}</Text>
                  <View style={s.routeAddrRow}>
                    <Text style={s.routeAddrLabel}>Origem</Text>
                    <Text style={s.routeAddr}>{r.origin}</Text>
                  </View>
                  <View style={s.routeAddrRow}>
                    <Text style={s.routeAddrLabel}>Destino</Text>
                    <Text style={s.routeAddr}>{r.destination}</Text>
                  </View>
                  <View style={s.routeKmRow}>
                    <Text style={s.routeKm}>
                      {r.km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
                    </Text>
                  </View>
                  {imgSrc && <Image style={s.mapImg} src={imgSrc} />}
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
              <Text style={[s.th, { width: "28%" }]}>Tipo</Text>
              <Text style={[s.th, { flex: 1 }]}>Observações</Text>
              <Text style={[s.th, { width: "20%", textAlign: "right" }]}>Valor</Text>
            </View>
            {period.expenses.map(e => (
              <View key={e.id} style={s.tableRow}>
                <Text style={[s.td, { width: "18%" }]}>{fmtDate(e.date)}</Text>
                <Text style={[s.td, { width: "28%" }]}>{EXPENSE_LABELS[e.type] ?? e.type}</Text>
                <Text style={[s.td, { flex: 1, color: C.muted }]}>{e.notes ?? "—"}</Text>
                <Text style={[s.td, { width: "20%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                  {fmt(e.amount)}
                </Text>
              </View>
            ))}
            <View style={s.divider} />
          </View>
        )}

        {/* ── Resumo financeiro — wrap={false} garante que não quebra entre páginas ── */}
        <View wrap={false}>
          <Text style={s.sectionLabel}>Resumo</Text>
          <View style={s.summaryCard}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Combustível</Text>
              <Text style={s.summaryValue}>
                {fuelLabel} · Preço médio R$ {period.fuelPriceAvg.toFixed(3)}/L
              </Text>
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

          {/* Validação combustível */}
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
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Demonstrativo de Rotas</Text>
          <Text style={s.footerText}>Gerado em {generatedAt}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>

      </Page>
    </Document>
  );
}
