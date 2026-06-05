"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconLock,
  IconRefresh,
  IconCalendarEvent,
  IconStar,
  IconAlertTriangle,
  IconHeart,
  IconChartBar,
  IconTarget,
  IconCoin,
  IconScale,
  IconBulb,
  IconBook2,
} from "@tabler/icons-react";

interface Article {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  content: React.ReactNode;
}

interface Section {
  id: string;
  label: string;
  articles: Article[];
}

// ─── Content ─────────────────────────────────────────────────────────────────

const CategoryCard = ({
  icon: Icon,
  color,
  name,
  description,
  examples,
}: {
  icon: React.ElementType;
  color: string;
  name: string;
  description: string;
  examples: string[];
}) => (
  <div className="bg-[var(--color-bg3)] border border-[var(--color-border)] rounded-[12px] p-4">
    <div className="flex items-center gap-2.5 mb-2">
      <div className="w-7 h-7 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="text-[13px] font-semibold text-[var(--color-f1)]">{name}</div>
    </div>
    <p className="text-[12px] text-[var(--color-f3)] leading-relaxed mb-3">{description}</p>
    <div className="flex flex-wrap gap-1.5">
      {examples.map(ex => (
        <span key={ex} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-bg4)] text-[var(--color-f4)] border border-[var(--color-border)]">
          {ex}
        </span>
      ))}
    </div>
  </div>
);

const Callout = ({ type, children }: { type: "tip" | "warning" | "info"; children: React.ReactNode }) => {
  const styles = {
    tip:     { bg: "var(--color-green-dim)",  border: "var(--color-green-border)",  text: "var(--color-green)", icon: IconBulb },
    warning: { bg: "var(--color-red-dim)",    border: "var(--color-red-border)",    text: "var(--color-red)",   icon: IconAlertTriangle },
    info:    { bg: "var(--color-cyan-dim)",   border: "var(--color-cyan-border)",   text: "var(--color-cyan)",  icon: IconBook2 },
  };
  const s = styles[type];
  const Icon = s.icon;
  return (
    <div
      className="flex gap-3 p-4 rounded-[10px] mt-4 mb-4 text-[12px] leading-relaxed"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <Icon size={14} style={{ color: s.text, flexShrink: 0, marginTop: 1 }} />
      <span style={{ color: s.text }}>{children}</span>
    </div>
  );
};

const SECTIONS: Section[] = [
  {
    id: "foundation",
    label: "Fundamentos",
    articles: [
      {
        id: "dre",
        title: "O que é o DRE Pessoal",
        subtitle: "A lógica por trás do Lyfx",
        icon: IconChartBar,
        color: "#22D3EE",
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              O <strong className="text-[var(--color-f1)]">Demonstrativo de Resultado do Exercício (DRE)</strong> é um conceito do mundo empresarial adaptado para as finanças pessoais. Empresas o usam para enxergar, mês a mês, quanto entraram de receitas, quanto saíram de despesas e qual foi o resultado líquido.
            </p>
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              No Lyfx, cada transação é classificada com um <strong className="text-[var(--color-f1)]">tipo</strong> (receita ou despesa) e uma <strong className="text-[var(--color-f1)]">categoria</strong> que revela a natureza daquela movimentação financeira. Essa granularidade é o que permite enxergar padrões que um extrato bancário comum nunca mostraria.
            </p>
            <Callout type="info">
              O dashboard do Lyfx constrói seu DRE em tempo real. Cada transação que você registra alimenta o resultado do mês automaticamente.
            </Callout>
            <div className="bg-[var(--color-bg3)] border border-[var(--color-border)] rounded-[12px] p-4">
              <div className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-3">Fórmula do resultado</div>
              <div className="font-mono text-[13px] text-[var(--color-f2)] space-y-1">
                <div>Total Receitas</div>
                <div className="text-[var(--color-red)]">− Total Despesas</div>
                <div className="border-t border-[var(--color-border)] pt-2 mt-2 font-semibold text-[var(--color-f1)]">= Resultado do Mês</div>
              </div>
            </div>
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              Um resultado positivo significa que você <strong className="text-[var(--color-f1)]">gerou riqueza</strong> naquele mês — sua vida financeira avançou. Um resultado negativo é um alerta de que o padrão de gastos precisa ser revisado.
            </p>
          </div>
        ),
      },
      {
        id: "recurrence",
        title: "Recorrência de transações",
        subtitle: "Única, mensal ou anual",
        icon: IconRefresh,
        color: "#A78BFA",
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              Toda transação no Lyfx tem uma <strong className="text-[var(--color-f1)]">recorrência</strong> que define como ela se comporta no tempo. Classificar isso corretamente é o que permite que as <strong className="text-[var(--color-f1)]">Projeções</strong> funcionem com precisão.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  title: "Única (once)",
                  color: "#94A3B8",
                  desc: "Aconteceu uma vez e não se repete. Um presente, uma viagem, um conserto emergencial. Impacta apenas o mês em que foi registrada."
                },
                {
                  title: "Mensal (monthly)",
                  color: "#22D3EE",
                  desc: "Ocorre todo mês. Aluguel, streaming, salário, academia. Pode ter uma data de encerramento para modelar parcelas de cartão ou financiamentos."
                },
                {
                  title: "Anual (annual)",
                  color: "#A78BFA",
                  desc: "Ocorre uma vez por ano no mesmo mês. IPTU, IPVA, seguro anual. Aparece nas Projeções apenas no mês correspondente."
                },
              ].map(item => (
                <div key={item.title} className="bg-[var(--color-bg3)] border border-[var(--color-border)] rounded-[10px] p-3.5">
                  <div className="text-[12px] font-semibold mb-1.5" style={{ color: item.color }}>{item.title}</div>
                  <p className="text-[11.5px] text-[var(--color-f3)] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <Callout type="tip">
              Use recorrência mensal com data de encerramento para registrar parcelas do cartão de crédito. As Projeções vão mostrar exatamente quando a dívida termina.
            </Callout>
          </div>
        ),
      },
    ],
  },
  {
    id: "categories",
    label: "Categorias",
    articles: [
      {
        id: "income-categories",
        title: "Categorias de receita",
        subtitle: "Como classificar o que entra",
        icon: IconArrowUpRight,
        color: "#4ADE80",
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              Receitas no Lyfx são divididas em dois tipos. A distinção importa porque revela o quanto da sua renda é previsível e o quanto depende de variáveis externas.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <CategoryCard
                icon={IconLock}
                color="#4ADE80"
                name="Receita Fixa"
                description="Valor certo que entra todo mês independente do que aconteça. É a base da sua segurança financeira. Use esta categoria para qualquer renda garantida e previsível."
                examples={["Salário CLT", "Aluguel recebido", "Pensão", "Benefício fixo"]}
              />
              <CategoryCard
                icon={IconArrowUpRight}
                color="#86EFAC"
                name="Receita Variável"
                description="Renda que acontece mas com valor ou frequência irregular. Dificulta o planejamento, então observe-a ao longo dos meses para entender sua média real."
                examples={["Freelance", "Comissões", "Venda de itens", "Dividendos", "Bônus"]}
              />
            </div>
            <Callout type="tip">
              Planeje sua vida com base na receita fixa. Trate a variável como bônus — quando vier, direcione-a para metas ou reserva de emergência.
            </Callout>
          </div>
        ),
      },
      {
        id: "expense-categories",
        title: "Categorias de despesa",
        subtitle: "O modelo de 7 tipos do Lyfx",
        icon: IconArrowDownRight,
        color: "#F87171",
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              As 7 categorias de despesa do Lyfx não são arbitrárias — cada uma captura um <strong className="text-[var(--color-f1)]">padrão de comportamento financeiro</strong> diferente. Juntas, elas formam uma visão completa de para onde vai o seu dinheiro.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <CategoryCard
                icon={IconLock}
                color="#F87171"
                name="Despesa Fixa"
                description="Obrigações certas que chegam todo mês com valor previsível. São a parte mais controlável do seu orçamento — se for alto, é o primeiro lugar para renegociar."
                examples={["Aluguel", "Condomínio", "Internet", "Plano de saúde", "Escola"]}
              />
              <CategoryCard
                icon={IconArrowDownRight}
                color="#FCA5A5"
                name="Despesa Variável"
                description="Gastos que acontecem regularmente mas com valor que muda. São o principal ponto de fuga do orçamento — pequenos excessos aqui se acumulam rápido."
                examples={["Supermercado", "Combustível", "Farmácia", "Assinaturas variáveis", "Restaurantes"]}
              />
              <CategoryCard
                icon={IconCoin}
                color="#FB923C"
                name="Comprometido"
                description="Dívidas e parcelas que já foram assumidas. O dinheiro ainda não saiu, mas já foi gasto na prática. Monitore de perto para saber quando você estará livre."
                examples={["Parcelas de cartão", "Financiamento de carro", "Empréstimo pessoal", "Crediário"]}
              />
              <CategoryCard
                icon={IconScale}
                color="#FBBF24"
                name="Longo Prazo"
                description="Investimentos no futuro que você decide fazer hoje. Não é obrigação, é escolha — mas uma escolha que constrói patrimônio ao longo do tempo."
                examples={["Investimentos", "Previdência privada", "Poupança direcionada", "Fundo de reserva"]}
              />
              <CategoryCard
                icon={IconCalendarEvent}
                color="#A78BFA"
                name="Sazonal"
                description="Despesas que não chegam todo mês, mas são previsíveis. Ignorá-las no planejamento é o erro clássico — quando chegam, parecem 'emergências' que não são."
                examples={["IPTU", "IPVA", "Material escolar", "Férias", "Presente de aniversário", "Seguro anual"]}
              />
              <CategoryCard
                icon={IconAlertTriangle}
                color="#F87171"
                name="Imprevisível"
                description="Gastos que você não planejou e não podia prever. São inevitáveis — a questão é ter reserva para absorvê-los sem desequilibrar o mês."
                examples={["Conserto de carro", "Saúde emergencial", "Manutenção doméstica", "Multas"]}
              />
              <CategoryCard
                icon={IconHeart}
                color="#E879F9"
                name="Alocação Intencional"
                description="Gastos que você escolhe conscientemente para qualidade de vida. Não são luxo nem necessidade — são prioridades que você define. O limite saudável é você quem decide."
                examples={["Jantar especial", "Viagem planejada", "Hobby", "Presente pessoal", "Experiências culturais"]}
              />
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "modules",
    label: "Módulos",
    articles: [
      {
        id: "goals",
        title: "Metas financeiras",
        subtitle: "Como funciona o módulo de metas",
        icon: IconTarget,
        color: "#22D3EE",
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              Uma meta no Lyfx é um objetivo com <strong className="text-[var(--color-f1)]">valor alvo</strong>, <strong className="text-[var(--color-f1)]">prazo</strong> e <strong className="text-[var(--color-f1)]">parcelas automáticas</strong>. Ao criar uma meta, o sistema calcula quanto você precisa guardar por mês e gera os compromissos mensais automaticamente.
            </p>
            <div className="bg-[var(--color-bg3)] border border-[var(--color-border)] rounded-[12px] p-4">
              <div className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-3">Como é calculado</div>
              <div className="font-mono text-[12px] text-[var(--color-f2)] space-y-1">
                <div>Meses até o prazo = N</div>
                <div>Parcela mensal = ⌈Valor alvo ÷ N⌉</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Folgado", desc: "Parcela ≤ 30% da média mensal disponível", color: "#4ADE80" },
                { label: "Factível", desc: "30–60% da média mensal disponível", color: "#22D3EE" },
                { label: "Apertado", desc: "60–100% da média mensal disponível", color: "#FBBF24" },
                { label: "Inviável", desc: "Parcela supera a média mensal disponível", color: "#F87171" },
              ].map(item => (
                <div key={item.label} className="bg-[var(--color-bg3)] border border-[var(--color-border)] rounded-[10px] p-3">
                  <div className="text-[11px] font-semibold mb-1" style={{ color: item.color }}>{item.label}</div>
                  <div className="text-[11px] text-[var(--color-f4)]">{item.desc}</div>
                </div>
              ))}
            </div>
            <Callout type="tip">
              A viabilidade da meta é calculada com base na média dos seus últimos 3 meses. Quanto mais dados você tiver, mais precisa será a análise.
            </Callout>
          </div>
        ),
      },
      {
        id: "projections",
        title: "Projeções",
        subtitle: "Os próximos 12 meses comprometidos",
        icon: IconChartBar,
        color: "#22D3EE",
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              As Projeções mostram o que <strong className="text-[var(--color-f1)]">já está comprometido</strong> para os próximos 12 meses com base nas transações recorrentes cadastradas. Não é uma estimativa — é uma consequência direta do que você registrou.
            </p>
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              Transações mensais aparecem em todos os meses futuros. Transações anuais aparecem apenas no mês correspondente. Parcelas com data de encerramento somem automaticamente quando terminam.
            </p>
            <Callout type="info">
              O valor "livre" em cada mês das Projeções é a diferença entre receitas e despesas comprometidas. É o teto máximo de gastos não planejados naquele mês.
            </Callout>
            <div className="bg-[var(--color-bg3)] border border-[var(--color-border)] rounded-[12px] p-4">
              <div className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-3">Como usar as projeções</div>
              <ul className="space-y-2 text-[12px] text-[var(--color-f3)]">
                {[
                  "Identifique meses com folga para fazer aportes em metas",
                  "Antecipe meses pesados antes que cheguem",
                  "Veja quando suas parcelas terminam",
                  "Entenda qual é o seu piso de compromisso mensal",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-[var(--color-cyan)] mt-0.5">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: "budget",
        title: "Orçamento",
        subtitle: "Tetos por categoria",
        icon: IconCoin,
        color: "#FBBF24",
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              O módulo de Orçamento permite definir um <strong className="text-[var(--color-f1)]">teto de gasto</strong> para cada categoria. Ao final do mês, o Lyfx compara o que foi gasto com o que foi planejado.
            </p>
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              Não existe valor certo para cada categoria — depende da sua realidade e prioridades. O orçamento é uma ferramenta de <strong className="text-[var(--color-f1)]">autoconsciência</strong>, não de restrição.
            </p>
            <Callout type="tip">
              Comece registrando seu histórico por 2 ou 3 meses sem se preocupar com orçamento. Depois use os Relatórios para entender suas médias reais e defina tetos com base em dados, não em intuição.
            </Callout>
          </div>
        ),
      },
    ],
  },
  {
    id: "concepts",
    label: "Conceitos",
    articles: [
      {
        id: "emergency-fund",
        title: "Reserva de emergência",
        subtitle: "O primeiro objetivo financeiro",
        icon: IconStar,
        color: "#FBBF24",
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              Antes de investir, antes de quitar dívidas de juros baixos, antes de qualquer meta — você precisa de uma <strong className="text-[var(--color-f1)]">reserva de emergência</strong>. É ela que impede que um imprevisto vire uma dívida.
            </p>
            <div className="bg-[var(--color-bg3)] border border-[var(--color-border)] rounded-[12px] p-4">
              <div className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-3">Quanto guardar</div>
              <div className="space-y-2 text-[12px] text-[var(--color-f2)]">
                {[
                  { perfil: "CLT com estabilidade", meses: "3 meses de despesas fixas" },
                  { perfil: "Autônomo / freelancer", meses: "6 a 12 meses de despesas fixas" },
                  { perfil: "Com dependentes financeiros", meses: "6 meses de despesas fixas" },
                ].map(item => (
                  <div key={item.perfil} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)] last:border-0">
                    <span className="text-[var(--color-f3)]">{item.perfil}</span>
                    <span className="font-medium text-[var(--color-f1)]">{item.meses}</span>
                  </div>
                ))}
              </div>
            </div>
            <Callout type="warning">
              A reserva de emergência deve estar em liquidez diária. CDB com liquidez diária ou conta remunerada são boas opções. Nunca invista a reserva em renda variável.
            </Callout>
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              No Lyfx, registre o aporte mensal na reserva como <strong className="text-[var(--color-f1)]">Longo Prazo</strong> (despesa intencional de construção de patrimônio). Crie uma Meta com o valor alvo para acompanhar o progresso.
            </p>
          </div>
        ),
      },
      {
        id: "debt",
        title: "Saindo das dívidas",
        subtitle: "Estratégias para eliminar o comprometido",
        icon: IconScale,
        color: "#F87171",
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              Dívidas com juros altos são o maior inimigo do patrimônio pessoal. Cartão de crédito e cheque especial cobram taxas que nenhum investimento vai superar.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  name: "Método avalanche",
                  color: "#22D3EE",
                  desc: "Pague o mínimo em todas as dívidas e concentre o esforço na de maior taxa de juros. Matematicamente mais eficiente — você paga menos ao total."
                },
                {
                  name: "Método bola de neve",
                  color: "#A78BFA",
                  desc: "Pague o mínimo em todas e concentre na de menor saldo. Psicologicamente mais motivador — você elimina dívidas inteiras mais rápido."
                },
              ].map(item => (
                <div key={item.name} className="bg-[var(--color-bg3)] border border-[var(--color-border)] rounded-[10px] p-3.5">
                  <div className="text-[12px] font-semibold mb-1.5" style={{ color: item.color }}>{item.name}</div>
                  <p className="text-[11.5px] text-[var(--color-f3)] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <Callout type="tip">
              No Lyfx, registre cada parcela de dívida como <strong>Comprometido</strong>. Use recorrência mensal com data de encerramento para ver nas Projeções quando cada dívida termina.
            </Callout>
          </div>
        ),
      },
      {
        id: "cashflow",
        title: "Fluxo de caixa",
        subtitle: "Quando entra e quando sai",
        icon: IconArrowUpRight,
        color: "#4ADE80",
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              Resultado positivo não é o mesmo que dinheiro disponível. Você pode ter um mês excelente no DRE mas passar por aperto porque as receitas chegam no dia 30 e as despesas vencem no dia 10.
            </p>
            <p className="text-[13px] text-[var(--color-f2)] leading-relaxed">
              O <strong className="text-[var(--color-f1)]">Plano Mensal</strong> do Lyfx mostra as transações em um calendário, ajudando a visualizar os picos de saída ao longo do mês e planejar o quando dos pagamentos.
            </p>
            <Callout type="info">
              Uma forma eficaz de gerenciar o fluxo de caixa é manter um saldo mínimo de segurança na conta corrente. Esse valor serve de buffer entre datas de vencimento e de recebimento.
            </Callout>
          </div>
        ),
      },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function EducationView() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [activeArticle, setActiveArticle] = useState(SECTIONS[0].articles[0].id);

  const section = SECTIONS.find(s => s.id === activeSection)!;
  const article = section.articles.find(a => a.id === activeArticle) ?? section.articles[0];
  const ArticleIcon = article.icon;

  function selectArticle(sectionId: string, articleId: string) {
    setActiveSection(sectionId);
    setActiveArticle(articleId);
  }

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-[220px] shrink-0 border-r border-[var(--color-border)] flex flex-col overflow-y-auto py-5 px-3">
        <div className="px-2 mb-4">
          <div className="text-[8px] font-bold tracking-[2px] uppercase text-[var(--color-cyan)] mb-1.5">
            Aprender
          </div>
          <div className="font-[family-name:var(--font-display)] italic text-[20px] font-bold text-[var(--color-f1)] leading-none">
            Educa<span className="text-[var(--color-cyan)]">ção</span>
          </div>
          <div className="text-[11px] text-[var(--color-f4)] mt-1">Base de conhecimento</div>
        </div>

        {SECTIONS.map(sec => (
          <div key={sec.id} className="mb-3">
            <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] px-2 mb-1">
              {sec.label}
            </div>
            {sec.articles.map(art => {
              const Icon = art.icon;
              const isActive = activeSection === sec.id && activeArticle === art.id;
              return (
                <button
                  key={art.id}
                  onClick={() => selectArticle(sec.id, art.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-[7px] rounded-[10px] mb-px text-left",
                    "text-[12px] cursor-pointer transition-all duration-150 border",
                    isActive
                      ? "text-[var(--color-cyan)] bg-[var(--color-cyan-faint)] border-[var(--color-cyan-border)]"
                      : "text-[var(--color-f3)] border-transparent hover:text-[var(--color-f2)] hover:bg-white/[0.04]"
                  )}
                >
                  <Icon size={13} className="flex-shrink-0" />
                  <span className="leading-tight">{art.title}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Article */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[680px] px-8 py-8">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${article.color}18`, border: `1px solid ${article.color}30` }}
            >
              <ArticleIcon size={18} style={{ color: article.color }} />
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold text-[var(--color-f1)] leading-tight">
                {article.title}
              </h1>
              <div className="text-[13px] text-[var(--color-f3)] mt-0.5">{article.subtitle}</div>
            </div>
          </div>

          {/* Content */}
          <div>{article.content}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-5 border-t border-[var(--color-border)]">
            {(() => {
              const allArticles = SECTIONS.flatMap(s => s.articles.map(a => ({ ...a, sectionId: s.id })));
              const currentIdx = allArticles.findIndex(a => a.sectionId === activeSection && a.id === activeArticle);
              const prev = allArticles[currentIdx - 1];
              const next = allArticles[currentIdx + 1];
              return (
                <>
                  {prev ? (
                    <button
                      onClick={() => selectArticle(prev.sectionId, prev.id)}
                      className="flex items-center gap-2 text-[12px] text-[var(--color-f3)] hover:text-[var(--color-f1)] transition-colors cursor-pointer"
                    >
                      <span>←</span>
                      <span>{prev.title}</span>
                    </button>
                  ) : <div />}
                  {next ? (
                    <button
                      onClick={() => selectArticle(next.sectionId, next.id)}
                      className="flex items-center gap-2 text-[12px] text-[var(--color-f3)] hover:text-[var(--color-f1)] transition-colors cursor-pointer"
                    >
                      <span>{next.title}</span>
                      <span>→</span>
                    </button>
                  ) : <div />}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
