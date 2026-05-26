export type Lang = "pt" | "en" | "es";

/* ── Translations interface ── */
export interface Translations {
  nav: { sobre: string; funcionalidades: string; comoFunciona: string; precos: string; faq: string; entrar: string };
  hero: { badge: string; h1a: string; h1b: string; p: string; ctaPrimary: string; ctaSecondary: string };
  marquee: readonly string[];
  dashboard: {
    month: string; vsLast: string; income: string; expenses: string; result: string;
    health: string; stable: string; commitment: string; savings: string; history: string;
    months: readonly string[];
    /* KPI values formatted per locale */
    kpiIncome: string; kpiExpenses: string; kpiResult: string;
  };
  sobre: {
    label: string; h2a: string; h2b: string; subtitle: string;
    p1: string; p2: string; p3: string; p4: string; divider: string;
    cards: ReadonlyArray<{ symbol: string; label: string; desc: string; highlight: boolean }>;
    fixedPointLabel: string; fixedPointDesc: string; lifeFixed: string; lifeFixedDesc: string;
  };
  features: { label: string; h2a: string; h2b: string };
  featureItems: ReadonlyArray<{ title: string; desc: string }>;
  mocks: {
    fixedIncome: string; committedExp: string; variableExp: string; investment: string;
    stable: string; goodPerf: string; commitment: string; savings: string; result: string; reserve: string;
    track: string; stableTrack: string;
    pill1: string; pill2: string; pill3: string;
    streakLabel: string; streakVal: string;
    a1msg: string; a1sub: string; a2msg: string; a2sub: string; a3msg: string; a3sub: string;
    l1name: string; l1rate: string; l2name: string; l2rate: string; l3name: string; l3rate: string;
    l1balance: string; l2balance: string; l3balance: string;
    avalanche: string;
    /* DRE feature mockup values */
    dreV1: string; dreV2: string; dreV3: string; dreV4: string;
    a1n: string; a1t: string; a1v: string; a1b: string;
    a2n: string; a2t: string; a2v: string; a2b: string;
    a3n: string; a3t: string; a3v: string; a3b: string;
  };
  howItWorks: {
    label: string; h2: string;
    steps: ReadonlyArray<{ step: string; title: string; desc: string; color: string }>;
  };
  pricing: {
    label: string; h2a: string; h2b: string; p: string;
    planName: string; planBadge: string; currency: string; perMonth: string; planDesc: string;
    featLabel: string; features: readonly string[]; cta: string;
  };
  faq: {
    label: string; h2: string;
    items: ReadonlyArray<{ q: string; a: string }>;
  };
  footer: { backToTop: string; rights: string; marquee: string };
}

export const T: Record<Lang, Translations> = {
  pt: {
    nav: {
      sobre: "Sobre",
      funcionalidades: "Funcionalidades",
      comoFunciona: "Como funciona",
      precos: "Preços",
      faq: "FAQ",
      entrar: "Entrar",
    },
    hero: {
      badge: "Diagnóstico · Controle · Educação",
      h1a: "Sua vida financeira.",
      h1b: "Diagnosticada.",
      p: "DRE pessoal, score de saúde financeira em 4 dimensões, educação adaptada ao seu perfil e alertas proativos. Não só controle, diagnóstico.",
      ctaPrimary: "Acessar o Lyfx",
      ctaSecondary: "Ver como funciona",
    },
    marquee: [
      "DRE Pessoal", "Score de Saúde", "Educação Financeira", "Streak Semanal",
      "Alertas Proativos", "Passivos & Avalanche", "Bens & Imóveis", "Orçamento Inteligente",
      "Lyfx", "Life Fixed", "Contas Fixas", "Metas Financeiras", "Instituições",
    ],
    dashboard: {
      month: "Maio 2026",
      vsLast: "+12% vs mês anterior",
      income: "Receita",
      expenses: "Despesas",
      result: "Resultado",
      health: "SAÚDE FINANCEIRA",
      stable: "Estável",
      commitment: "Comprometimento",
      savings: "Poupança",
      history: "HISTÓRICO",
      months: ["Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai"],
      kpiIncome: "R$ 8.400", kpiExpenses: "R$ 5.210", kpiResult: "R$ 3.190",
    },
    sobre: {
      label: "Sobre",
      h2a: "Ninguém nos ensinou",
      h2b: "a lidar com dinheiro.",
      subtitle: "O Lyfx nasceu desse problema.",
      p1: "A educação financeira nunca foi pauta do currículo escolar. Crescemos aprendendo a resolver equações, mas sem entender o que fazer com o salário no fim do mês.",
      p2: "O resultado é previsível: decisões no achismo, endividamento silencioso, e uma sensação constante de que o dinheiro nunca é suficiente, não por falta de esforço, mas por falta de clareza.",
      p3: "Uma plataforma que traduz a complexidade das finanças pessoais em diagnóstico claro, para que qualquer pessoa, com ou sem formação financeira, possa enxergar onde está e tomar decisões melhores.",
      p4: "Não é sobre perfeição. É sobre progresso mensurável, decisão a decisão.",
      divider: "A matemática por trás do nome",
      cards: [
        { symbol: "f′(x)",   label: "Derivada",  desc: "Taxa de mudança. Os deltas do dashboard mostram quanto você evolui a cada mês.",                                    highlight: false },
        { symbol: "∫f(x)dx", label: "Integral",  desc: "Acumulação ao longo do tempo. Patrimônio, reservas e metas, a área sob a curva da sua vida.",                      highlight: true  },
        { symbol: "lim→∞",   label: "Limite",    desc: "Independência financeira, o ponto onde f(x) converge para a vida que você projetou.",                              highlight: false },
      ],
      fixedPointLabel: "Fixed point",
      fixedPointDesc:  "em matemática, o equilíbrio onde a função retorna a si mesma.",
      lifeFixed:       "Life Fixed",
      lifeFixedDesc:   "é isso: o estado onde sua vida financeira está no controle.",
    },
    features: {
      label: "Funcionalidades",
      h2a: "Mais que controle.",
      h2b: "Inteligência financeira.",
    },
    featureItems: [
      { title: "DRE Pessoal",           desc: "Cada real categorizado com semântica precisa, fixo, variável, comprometido, sazonal. Não apenas quanto você gastou, mas qual tipo de gasto foi." },
      { title: "Score de Saúde",        desc: "4 dimensões analisadas em tempo real: comprometimento da renda, taxa de poupança, resultado mensal e fundo de reserva. Um número, um diagnóstico." },
      { title: "Educação Financeira",   desc: "85 pílulas pedagógicas adaptadas ao seu perfil de saúde financeira. Quiz de fixação, streak semanal e trilhas que evoluem conforme você melhora." },
      { title: "Alertas Proativos",     desc: "O sistema trabalha por você. Alertas de orçamento estourado, metas comprometidas, passivos com taxa crítica e projeções negativas, antes de virar problema." },
      { title: "Passivos & Dívidas",    desc: "Registre todas as dívidas, visualize o custo real de cada uma e use o método avalanche para quitar com o mínimo de juros possível." },
      { title: "Bens & Imóveis",        desc: "Cadastre imóveis, veículos e outros bens. Vincule despesas associadas como IPTU, IPVA, seguro e manutenção. Visão completa do seu patrimônio." },
    ],
    mocks: {
      fixedIncome: "Receita fixa", committedExp: "Desp. comprometida", variableExp: "Desp. variável", investment: "Investimento",
      stable: "Estável", goodPerf: "Bom desempenho geral",
      commitment: "Comprometimento", savings: "Poupança", result: "Resultado", reserve: "Reserva",
      track: "Trilha", stableTrack: "Estável",
      pill1: "Fundo de emergência", pill2: "Custo de vida vs renda", pill3: "Investimento inicial",
      streakLabel: "Streak:", streakVal: "4 semanas",
      a1msg: "Cheque especial ativo · 12% a.m.", a1sub: "Equivale a 290% a.a.",
      a2msg: "Orçamento de Lazer a 130%",        a2sub: "R$ 520 de R$ 400 limite",
      a3msg: "IPVA vence em 18 dias",            a3sub: "R$ 1.240, provisão ok",
      l1name: "Cartão Nubank",  l1rate: "12,9% a.m.",
      l2name: "Financiamento",  l2rate: "1,2% a.m.",
      l3name: "Empréstimo",     l3rate: "3,5% a.m.",
      l1balance: "R$ 3.200", l2balance: "R$ 22.400", l3balance: "R$ 8.000",
      avalanche: "Método avalanche: economize R$ 1.840 em juros",
      dreV1: "R$ 6.000", dreV2: "R$ 2.100", dreV3: "R$ 1.840", dreV4: "R$ 800",
      a1n: "Apartamento SP", a1t: "Imóvel",     a1v: "R$ 420.000", a1b: "IPTU pendente",
      a2n: "Honda Civic 2022", a2t: "Veículo",  a2v: "R$ 98.000",  a2b: "IPVA pago",
      a3n: "Previdência",    a3t: "Outro bem",  a3v: "R$ 34.500",  a3b: "Em dia",
    },
    howItWorks: {
      label: "Como funciona",
      h2: "Do lançamento ao diagnóstico.",
      steps: [
        { step: "01", title: "Crie sua conta",    desc: "Sem cartão, sem burocracia. Só você e sua conta.",                                     color: "#22D3EE" },
        { step: "02", title: "Lance transações",  desc: "Receitas, despesas, parcelas e recorrências. Tudo categorizado.",                       color: "#A3E635" },
        { step: "03", title: "Veja seu score",    desc: "4 dimensões analisadas. Um diagnóstico claro da sua saúde financeira.",                  color: "#A78BFA" },
        { step: "04", title: "Evolua com pílulas",desc: "Educação adaptada ao seu perfil. Aprenda o que você mais precisa.",                     color: "#FBBF24" },
      ],
    },
    pricing: {
      label: "Planos",
      h2a: "Sua equação",
      h2b: "tem solução.",
      p: "Um plano. Acesso completo. Diagnóstico real das suas finanças, sem planilha, sem achismo.",
      planName: "Lyfx Completo", planBadge: "Único plano",
      currency: "R$", perMonth: "/mês",
      planDesc: "Acesso completo a todas as funcionalidades. Sem limites, sem surpresas.",
      featLabel: "O que está incluído",
      features: [
        "DRE Pessoal com categorização semântica",
        "Score de saúde financeira em 4 dimensões",
        "85 pílulas de educação financeira adaptadas ao seu perfil",
        "Quiz de fixação e streak semanal",
        "Alertas proativos de orçamento, metas e passivos",
        "Gestão de passivos com método avalanche",
        "Cadastro de bens, imóveis e veículos",
        "Orçamento mensal por categoria",
        "Controle de parcelamentos",
        "Instituições financeiras vinculadas",
        "Relatórios e histórico completo",
        "Isolamento de dados por usuário",
      ],
      cta: "Começar agora",
    },
    faq: {
      label: "FAQ",
      h2: "Dúvidas frequentes.",
      items: [
        { q: "O que é o score de saúde financeira?",
          a: "É um diagnóstico calculado em 4 dimensões: comprometimento da renda (% gasta em fixos), taxa de poupança, resultado mensal e cobertura do fundo de reserva. O resultado é um número de 0 a 100 com um perfil, de Crítico a Saudável, que orienta o que focar primeiro." },
        { q: "Como funciona a Educação Financeira?",
          a: "O módulo identifica seu perfil de saúde financeira e sugere pílulas pedagógicas específicas para ele. Cada pílula tem conteúdo explicativo e um quiz de fixação. Há um sistema de streak semanal para manter consistência no aprendizado." },
        { q: "Meus dados financeiros ficam seguros?",
          a: "Seus dados são armazenados localmente com isolamento completo por usuário. Toda query exige autenticação. Privacidade é uma prioridade no Lyfx." },
        { q: "O que é o método avalanche de dívidas?",
          a: "É a estratégia matematicamente ótima para quitar dívidas: pague o mínimo em todas e coloque o máximo na dívida com a maior taxa de juros. O Lyfx calcula automaticamente quanto você economizaria comparado ao pagamento mínimo." },
        { q: "É possível importar dados bancários?",
          a: "Em breve. Estamos desenvolvendo importação de extratos em OFX e CSV para lançamento semi-automático de transações." },
        { q: "O que é uma DRE pessoal?",
          a: "DRE (Demonstração do Resultado do Exercício) é o relatório que empresas usam para entender receitas e despesas. O Lyfx traz essa mesma estrutura para as finanças pessoais, cada real vai para uma categoria com semântica precisa, revelando não apenas quanto você gastou, mas qual tipo de gasto foi." },
      ],
    },
    footer: {
      backToTop: "↑ Voltar ao topo",
      rights: "Todos os direitos reservados.",
      marquee: "Pronto para resolver sua equação?",
    },
  },

  /* ─────────────────────────────── ENGLISH ─────────────────────────────── */
  en: {
    nav: {
      sobre: "About",
      funcionalidades: "Features",
      comoFunciona: "How it works",
      precos: "Pricing",
      faq: "FAQ",
      entrar: "Log in",
    },
    hero: {
      badge: "Diagnosis · Control · Education",
      h1a: "Your financial life.",
      h1b: "Diagnosed.",
      p: "Personal P&L, financial health score across 4 dimensions, education tailored to your profile, and proactive alerts. Not just control, diagnosis.",
      ctaPrimary: "Access Lyfx",
      ctaSecondary: "See how it works",
    },
    marquee: [
      "Personal P&L", "Health Score", "Financial Education", "Weekly Streak",
      "Proactive Alerts", "Debts & Avalanche", "Assets & Property", "Smart Budget",
      "Lyfx", "Life Fixed", "Fixed Costs", "Financial Goals", "Institutions",
    ],
    dashboard: {
      month: "May 2026",
      vsLast: "+12% vs last month",
      income: "Income",
      expenses: "Expenses",
      result: "Result",
      health: "FINANCIAL HEALTH",
      stable: "Stable",
      commitment: "Commitment",
      savings: "Savings",
      history: "HISTORY",
      months: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"],
      kpiIncome: "$ 8,400", kpiExpenses: "$ 5,210", kpiResult: "$ 3,190",
    },
    sobre: {
      label: "About",
      h2a: "Nobody taught us",
      h2b: "to handle money.",
      subtitle: "Lyfx was born from this problem.",
      p1: "Financial education was never part of the school curriculum. We grew up learning to solve equations, but without understanding what to do with our paycheck at the end of the month.",
      p2: "The result is predictable: guesswork decisions, silent debt, and a constant feeling that money is never enough, not for lack of effort, but for lack of clarity.",
      p3: "A platform that translates the complexity of personal finance into clear diagnosis, so that anyone, with or without financial background, can see where they stand and make better decisions.",
      p4: "It's not about perfection. It's about measurable progress, decision by decision.",
      divider: "The math behind the name",
      cards: [
        { symbol: "f′(x)",   label: "Derivative", desc: "Rate of change. The dashboard deltas show how much you evolve each month.",                          highlight: false },
        { symbol: "∫f(x)dx", label: "Integral",   desc: "Accumulation over time. Wealth, reserves and goals, the area under the curve of your life.",        highlight: true  },
        { symbol: "lim→∞",   label: "Limit",      desc: "Financial independence, the point where f(x) converges to the life you projected.",                 highlight: false },
      ],
      fixedPointLabel: "Fixed point",
      fixedPointDesc:  "in mathematics, the equilibrium where the function returns to itself.",
      lifeFixed:       "Life Fixed",
      lifeFixedDesc:   "is just that: the state where your financial life is in control.",
    },
    features: {
      label: "Features",
      h2a: "More than control.",
      h2b: "Financial intelligence.",
    },
    featureItems: [
      { title: "Personal P&L",          desc: "Every transaction categorized with precise semantics: fixed, variable, committed, seasonal. Not just how much you spent, but what type of expense it was." },
      { title: "Health Score",          desc: "4 dimensions analyzed in real time: income commitment, savings rate, monthly result and emergency fund. One number, one diagnosis." },
      { title: "Financial Education",   desc: "85 pedagogical pills tailored to your financial health profile. Quizzes, weekly streak and tracks that evolve as you improve." },
      { title: "Proactive Alerts",      desc: "The system works for you. Budget alerts, compromised goals, critical-rate liabilities and negative projections, all before they become a problem." },
      { title: "Debts & Liabilities",   desc: "Log all your debts, visualize the real cost of each, and use the avalanche method to pay off with minimum interest." },
      { title: "Assets & Properties",   desc: "Register properties, vehicles and other assets. Link associated expenses like property tax, insurance and maintenance. Full wealth overview." },
    ],
    mocks: {
      fixedIncome: "Fixed income", committedExp: "Committed exp.", variableExp: "Variable exp.", investment: "Investment",
      stable: "Stable", goodPerf: "Good overall performance",
      commitment: "Commitment", savings: "Savings", result: "Result", reserve: "Reserve",
      track: "Track", stableTrack: "Stable",
      pill1: "Emergency fund", pill2: "Cost of living vs income", pill3: "Initial investment",
      streakLabel: "Streak:", streakVal: "4 weeks",
      a1msg: "Overdraft active · 12% p.m.",  a1sub: "Equivalent to 290% p.a.",
      a2msg: "Entertainment budget at 130%", a2sub: "$ 520 of $ 400 limit",
      a3msg: "Car tax due in 18 days",       a3sub: "$ 1,240, provision ok",
      l1name: "Nubank Card",    l1rate: "12.9% p.m.",
      l2name: "Financing",      l2rate: "1.2% p.m.",
      l3name: "Personal loan",  l3rate: "3.5% p.m.",
      l1balance: "$ 3,200", l2balance: "$ 22,400", l3balance: "$ 8,000",
      avalanche: "Avalanche method: save $ 1,840 in interest",
      dreV1: "$ 6,000", dreV2: "$ 2,100", dreV3: "$ 1,840", dreV4: "$ 800",
      a1n: "São Paulo Apt.", a1t: "Property",    a1v: "$ 420,000", a1b: "Tax due",
      a2n: "Honda Civic 2022", a2t: "Vehicle",   a2v: "$ 98,000",  a2b: "Tax paid",
      a3n: "Pension fund",   a3t: "Other asset", a3v: "$ 34,500",  a3b: "Up to date",
    },
    howItWorks: {
      label: "How it works",
      h2: "From transaction to diagnosis.",
      steps: [
        { step: "01", title: "Create your account", desc: "No card, no hassle. Just you and your account.",                               color: "#22D3EE" },
        { step: "02", title: "Log transactions",    desc: "Income, expenses, installments and recurrences. All categorized.",             color: "#A3E635" },
        { step: "03", title: "See your score",      desc: "4 dimensions analyzed. A clear diagnosis of your financial health.",           color: "#A78BFA" },
        { step: "04", title: "Grow with pills",     desc: "Education tailored to your profile. Learn exactly what you need.",             color: "#FBBF24" },
      ],
    },
    pricing: {
      label: "Pricing",
      h2a: "Your equation",
      h2b: "has a solution.",
      p: "One plan. Full access. Real diagnosis of your finances, no spreadsheets, no guesswork.",
      planName: "Lyfx Complete", planBadge: "Single plan",
      currency: "$", perMonth: "/mo",
      planDesc: "Full access to all features. No limits, no surprises.",
      featLabel: "What's included",
      features: [
        "Personal P&L with semantic categorization",
        "Financial health score across 4 dimensions",
        "85 financial education pills tailored to your profile",
        "Quizzes and weekly streak",
        "Proactive alerts for budget, goals and liabilities",
        "Liability management with avalanche method",
        "Assets, properties and vehicles register",
        "Monthly budget by category",
        "Installments tracker",
        "Linked financial institutions",
        "Full reports and history",
        "Per-user data isolation",
      ],
      cta: "Get started",
    },
    faq: {
      label: "FAQ",
      h2: "Frequently asked questions.",
      items: [
        { q: "What is the financial health score?",
          a: "It's a diagnosis calculated across 4 dimensions: income commitment (% spent on fixed costs), savings rate, monthly result, and emergency fund coverage. The result is a 0–100 number with a profile, from Critical to Healthy, guiding what to focus on first." },
        { q: "How does Financial Education work?",
          a: "The module identifies your financial health profile and suggests targeted educational pills for it. Each pill has explanatory content and a quiz. There's a weekly streak system to maintain consistency." },
        { q: "Is my financial data secure?",
          a: "Your data is stored locally with full per-user isolation. Every query requires authentication. Privacy is a top priority at Lyfx." },
        { q: "What is the debt avalanche method?",
          a: "It's the mathematically optimal strategy to pay off debt: pay the minimum on all debts and put the maximum toward the one with the highest interest rate. Lyfx automatically calculates how much you'd save compared to minimum payments." },
        { q: "Can I import bank data?",
          a: "Coming soon. We're building OFX and CSV statement import for semi-automatic transaction entry." },
        { q: "What is a personal P&L?",
          a: "P&L (Profit & Loss) is the report companies use to understand revenue and expenses. Lyfx applies this same framework to personal finance: every transaction is assigned to a precisely-labeled category, revealing not just how much you spent, but what type of expense it was." },
      ],
    },
    footer: {
      backToTop: "↑ Back to top",
      rights: "All rights reserved.",
      marquee: "Ready to solve your equation?",
    },
  },

  /* ─────────────────────────────── SPANISH ─────────────────────────────── */
  es: {
    nav: {
      sobre: "Acerca de",
      funcionalidades: "Funcionalidades",
      comoFunciona: "Cómo funciona",
      precos: "Precios",
      faq: "FAQ",
      entrar: "Iniciar sesión",
    },
    hero: {
      badge: "Diagnóstico · Control · Educación",
      h1a: "Tu vida financiera.",
      h1b: "Diagnosticada.",
      p: "Estado de Resultados personal, score de salud financiera en 4 dimensiones, educación adaptada a tu perfil y alertas proactivas. No solo control, diagnóstico.",
      ctaPrimary: "Acceder a Lyfx",
      ctaSecondary: "Ver cómo funciona",
    },
    marquee: [
      "Estado de Resultados", "Score de Salud", "Educación Financiera", "Racha Semanal",
      "Alertas Proactivas", "Pasivos & Avalancha", "Bienes & Inmuebles", "Presupuesto Inteligente",
      "Lyfx", "Life Fixed", "Gastos Fijos", "Metas Financieras", "Instituciones",
    ],
    dashboard: {
      month: "Mayo 2026",
      vsLast: "+12% vs mes anterior",
      income: "Ingresos",
      expenses: "Gastos",
      result: "Resultado",
      health: "SALUD FINANCIERA",
      stable: "Estable",
      commitment: "Compromiso",
      savings: "Ahorro",
      history: "HISTORIAL",
      months: ["Nov", "Dic", "Ene", "Feb", "Mar", "Abr", "May"],
      kpiIncome: "€ 8.400", kpiExpenses: "€ 5.210", kpiResult: "€ 3.190",
    },
    sobre: {
      label: "Acerca de",
      h2a: "Nadie nos enseñó",
      h2b: "a manejar el dinero.",
      subtitle: "Lyfx nació de este problema.",
      p1: "La educación financiera nunca fue parte del currículo escolar. Crecimos aprendiendo a resolver ecuaciones, pero sin entender qué hacer con el sueldo a fin de mes.",
      p2: "El resultado es predecible: decisiones a la deriva, endeudamiento silencioso, y una sensación constante de que el dinero nunca alcanza, no por falta de esfuerzo, sino por falta de claridad.",
      p3: "Una plataforma que traduce la complejidad de las finanzas personales en un diagnóstico claro, para que cualquier persona, con o sin formación financiera, pueda ver dónde está y tomar mejores decisiones.",
      p4: "No se trata de perfección. Se trata de progreso medible, decisión a decisión.",
      divider: "Las matemáticas detrás del nombre",
      cards: [
        { symbol: "f′(x)",   label: "Derivada",  desc: "Tasa de cambio. Los deltas del dashboard muestran cuánto evolucionas cada mes.",                                      highlight: false },
        { symbol: "∫f(x)dx", label: "Integral",  desc: "Acumulación a lo largo del tiempo. Patrimonio, reservas y metas, el área bajo la curva de tu vida.",                 highlight: true  },
        { symbol: "lim→∞",   label: "Límite",    desc: "Independencia financiera, el punto donde f(x) converge hacia la vida que proyectaste.",                              highlight: false },
      ],
      fixedPointLabel: "Fixed point",
      fixedPointDesc:  "en matemáticas, el equilibrio donde la función retorna a sí misma.",
      lifeFixed:       "Life Fixed",
      lifeFixedDesc:   "es eso: el estado donde tu vida financiera está bajo control.",
    },
    features: {
      label: "Funcionalidades",
      h2a: "Más que control.",
      h2b: "Inteligencia financiera.",
    },
    featureItems: [
      { title: "Estado de Resultados",  desc: "Cada transacción categorizada con semántica precisa: fija, variable, comprometida, estacional. No solo cuánto gastaste, sino qué tipo de gasto fue." },
      { title: "Score de Salud",        desc: "4 dimensiones analizadas en tiempo real: compromiso de ingresos, tasa de ahorro, resultado mensual y fondo de reserva. Un número, un diagnóstico." },
      { title: "Educación Financiera",  desc: "85 píldoras pedagógicas adaptadas a tu perfil de salud financiera. Cuestionarios, racha semanal y rutas que evolucionan a medida que mejoras." },
      { title: "Alertas Proactivas",    desc: "El sistema trabaja por ti. Alertas de presupuesto excedido, metas comprometidas, pasivos con tasa crítica y proyecciones negativas, antes de que sea problema." },
      { title: "Pasivos & Deudas",      desc: "Registra todas tus deudas, visualiza el costo real de cada una y usa el método avalancha para liquidarlas con el mínimo de intereses posible." },
      { title: "Bienes & Inmuebles",    desc: "Registra inmuebles, vehículos y otros activos. Vincula gastos asociados como impuestos, seguros y mantenimiento. Visión completa de tu patrimonio." },
    ],
    mocks: {
      fixedIncome: "Ingreso fijo", committedExp: "Gasto comprometido", variableExp: "Gasto variable", investment: "Inversión",
      stable: "Estable", goodPerf: "Buen rendimiento general",
      commitment: "Compromiso", savings: "Ahorro", result: "Resultado", reserve: "Reserva",
      track: "Ruta", stableTrack: "Estable",
      pill1: "Fondo de emergencia", pill2: "Costo de vida vs ingresos", pill3: "Inversión inicial",
      streakLabel: "Racha:", streakVal: "4 semanas",
      a1msg: "Sobregiro activo · 12% m.m.",    a1sub: "Equivale a 290% anual",
      a2msg: "Presupuesto de Ocio al 130%",    a2sub: "€ 520 de € 400 límite",
      a3msg: "Impuesto vence en 18 días",      a3sub: "€ 1.240, provisión ok",
      l1name: "Tarjeta Nubank",    l1rate: "12,9% m.m.",
      l2name: "Financiamiento",    l2rate: "1,2% m.m.",
      l3name: "Préstamo personal", l3rate: "3,5% m.m.",
      l1balance: "€ 3.200", l2balance: "€ 22.400", l3balance: "€ 8.000",
      avalanche: "Método avalancha: ahorra € 1.840 en intereses",
      dreV1: "€ 6.000", dreV2: "€ 2.100", dreV3: "€ 1.840", dreV4: "€ 800",
      a1n: "Piso Madrid",      a1t: "Inmueble",    a1v: "€ 420.000", a1b: "Impuesto pendiente",
      a2n: "Honda Civic 2022", a2t: "Vehículo",    a2v: "€ 98.000",  a2b: "Impuesto pagado",
      a3n: "Plan de pensión",  a3t: "Otro activo", a3v: "€ 34.500",  a3b: "Al día",
    },
    howItWorks: {
      label: "Cómo funciona",
      h2: "Del registro al diagnóstico.",
      steps: [
        { step: "01", title: "Crea tu cuenta",          desc: "Sin tarjeta, sin burocracia. Solo tú y tu cuenta.",                                   color: "#22D3EE" },
        { step: "02", title: "Registra transacciones",  desc: "Ingresos, gastos, cuotas y recurrencias. Todo categorizado.",                          color: "#A3E635" },
        { step: "03", title: "Ve tu score",             desc: "4 dimensiones analizadas. Un diagnóstico claro de tu salud financiera.",                color: "#A78BFA" },
        { step: "04", title: "Evoluciona con píldoras", desc: "Educación adaptada a tu perfil. Aprende lo que más necesitas.",                        color: "#FBBF24" },
      ],
    },
    pricing: {
      label: "Precios",
      h2a: "Tu ecuación",
      h2b: "tiene solución.",
      p: "Un plan. Acceso completo. Diagnóstico real de tus finanzas, sin planillas, sin suposiciones.",
      planName: "Lyfx Completo", planBadge: "Plan único",
      currency: "€", perMonth: "/mes",
      planDesc: "Acceso completo a todas las funcionalidades. Sin límites, sin sorpresas.",
      featLabel: "Qué está incluido",
      features: [
        "Estado de Resultados con categorización semántica",
        "Score de salud financiera en 4 dimensiones",
        "85 píldoras de educación financiera adaptadas a tu perfil",
        "Cuestionarios y racha semanal",
        "Alertas proactivas de presupuesto, metas y pasivos",
        "Gestión de pasivos con método avalancha",
        "Registro de bienes, inmuebles y vehículos",
        "Presupuesto mensual por categoría",
        "Control de cuotas",
        "Instituciones financieras vinculadas",
        "Informes e historial completo",
        "Aislamiento de datos por usuario",
      ],
      cta: "Comenzar ahora",
    },
    faq: {
      label: "FAQ",
      h2: "Preguntas frecuentes.",
      items: [
        { q: "¿Qué es el score de salud financiera?",
          a: "Es un diagnóstico calculado en 4 dimensiones: compromiso de ingresos (% gastado en fijos), tasa de ahorro, resultado mensual y cobertura del fondo de reserva. El resultado es un número de 0 a 100 con un perfil, de Crítico a Saludable, que orienta qué priorizar primero." },
        { q: "¿Cómo funciona la Educación Financiera?",
          a: "El módulo identifica tu perfil de salud financiera y sugiere píldoras pedagógicas específicas. Cada píldora tiene contenido explicativo y un cuestionario. Hay un sistema de racha semanal para mantener la consistencia." },
        { q: "¿Mis datos financieros están seguros?",
          a: "Tus datos se almacenan localmente con aislamiento completo por usuario. Toda consulta requiere autenticación. La privacidad es una prioridad en Lyfx." },
        { q: "¿Qué es el método avalancha de deudas?",
          a: "Es la estrategia matemáticamente óptima para liquidar deudas: paga el mínimo en todas y destina el máximo a la deuda con mayor tasa de interés. Lyfx calcula automáticamente cuánto ahorrarías en comparación con el pago mínimo." },
        { q: "¿Es posible importar datos bancarios?",
          a: "Próximamente. Estamos desarrollando importación de extractos en OFX y CSV para el registro semi-automático de transacciones." },
        { q: "¿Qué es un Estado de Resultados personal?",
          a: "El Estado de Resultados (también conocido como P&G, Pérdidas y Ganancias) es el informe que las empresas usan para entender ingresos y gastos. Lyfx aplica esta misma estructura a las finanzas personales: cada transacción va a una categoría con semántica precisa, revelando no solo cuánto gastaste, sino qué tipo de gasto fue." },
      ],
    },
    footer: {
      backToTop: "↑ Volver arriba",
      rights: "Todos los derechos reservados.",
      marquee: "¿Listo para resolver tu ecuación?",
    },
  },
};
