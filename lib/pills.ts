import pillsData from "./pills-data.json";

// ── Types ───────────────────────────────────────────────────────────────────

export type PillProfile =
  | "em_recuperacao"
  | "estabilizado"
  | "em_construcao"
  | "livre";

export type SectionType =
  | "explanation"
  | "insight"
  | "practical"
  | "reframe"
  | "reflection";

export interface PillSection {
  type: SectionType;
  text: string;
}

export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
}

export interface PillQuiz {
  question: string;
  options: QuizOption[];
}

export interface Pill {
  id: string;
  profile: PillProfile;
  order: number;
  title: string;
  subtitle: string;
  category: string;
  estimatedMinutes: number;
  sourceRef: string;
  content: {
    hook: string;
    sections: PillSection[];
  };
  quiz: PillQuiz;
}

export interface PillProgressRecord {
  pillId: string;
  profile: string;
  completedAt: Date;
  timeSpentSeconds: number;
  quizCorrect: boolean;
}

export interface WeekData {
  weekKey: string;
  hasActivity: boolean;
}

export interface StreakData {
  currentStreak: number;
  weekHistory: WeekData[];
}

// ── Data ────────────────────────────────────────────────────────────────────

export const ALL_PILLS: Pill[] = pillsData as Pill[];

export const PROFILES: PillProfile[] = [
  "em_recuperacao",
  "estabilizado",
  "em_construcao",
  "livre",
];

export const PROFILE_META: Record<
  PillProfile,
  { label: string; shortLabel: string; color: string; count: number }
> = {
  em_recuperacao: { label: "Em Recuperação", shortLabel: "Recuperação", color: "#F87171", count: 0 },
  estabilizado:   { label: "Estabilizado",   shortLabel: "Estabilizado", color: "#FBBF24", count: 0 },
  em_construcao:  { label: "Em Construção",  shortLabel: "Construção",  color: "#22D3EE", count: 0 },
  livre:          { label: "Livre",          shortLabel: "Livre",       color: "#4ADE80", count: 0 },
};

// Populate counts from data
for (const pill of ALL_PILLS) {
  if (PROFILE_META[pill.profile]) PROFILE_META[pill.profile].count++;
}

export const SECTION_META: Record<
  SectionType,
  { label: string; color: string; bg: string; border: string }
> = {
  explanation: {
    label: "Entenda",
    color: "var(--color-f2)",
    bg: "var(--color-bg3)",
    border: "var(--color-border)",
  },
  insight: {
    label: "Por que importa",
    color: "#FBBF24",
    bg: "rgba(251,191,36,0.06)",
    border: "rgba(251,191,36,0.2)",
  },
  practical: {
    label: "Coloque em prática",
    color: "#4ADE80",
    bg: "rgba(74,222,128,0.06)",
    border: "rgba(74,222,128,0.2)",
  },
  reframe: {
    label: "Nova perspectiva",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.06)",
    border: "rgba(167,139,250,0.2)",
  },
  reflection: {
    label: "Reflexão",
    color: "var(--color-cyan)",
    bg: "var(--color-cyan-faint)",
    border: "var(--color-cyan-border)",
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getPillsByProfile(profile: PillProfile): Pill[] {
  return ALL_PILLS.filter((p) => p.profile === profile).sort(
    (a, b) => a.order - b.order
  );
}

export function getPillById(id: string): Pill | undefined {
  return ALL_PILLS.find((p) => p.id === id);
}

export function healthProfileToPillProfile(healthProfile: string): PillProfile {
  const map: Record<string, PillProfile> = {
    "em-recuperacao": "em_recuperacao",
    estabilizado:     "estabilizado",
    "em-construcao":  "em_construcao",
    livre:            "livre",
  };
  return map[healthProfile] ?? "em_recuperacao";
}

export function getNextPill(
  profile: PillProfile,
  completedIds: Set<string>
): Pill | null {
  const pills = getPillsByProfile(profile);
  return pills.find((p) => !completedIds.has(p.id)) ?? null;
}

export function fmtSeconds(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function fmtDate(date: Date): string {
  // CS-41: timeZone:"UTC" garante consistência entre server (Docker UTC+0) e client (browser local)
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}
