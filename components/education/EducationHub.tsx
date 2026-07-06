"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconFlame,
  IconCheck,
  IconChevronRight,
  IconX,
  IconPlayerPlay,
  IconBook2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  PROFILES,
  PROFILE_META,
  getPillsByProfile,
  getNextPill,
  fmtSeconds,
  fmtDate,
  type Pill,
  type PillProfile,
  type PillProgressRecord,
  type StreakData,
} from "@/lib/pills";

// ── Streak calendar ─────────────────────────────────────────────────────────

function StreakCalendar({
  streak,
  onClose,
}: {
  streak: StreakData;
  onClose: () => void;
}) {
  return (
    <div className="absolute top-10 right-0 z-50 w-[340px] bg-[var(--color-bg2)] border border-[var(--color-border2)] rounded-[16px] p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
          Consistência — últimas 12 semanas
        </div>
        <button
          onClick={onClose}
          className="text-[var(--color-f4)] hover:text-[var(--color-f2)] transition-colors cursor-pointer"
        >
          <IconX size={13} />
        </button>
      </div>

      <div className="grid grid-cols-12 gap-1.5 mb-4">
        {streak.weekHistory.map((week, idx) => {
          const isCurrent = idx === streak.weekHistory.length - 1;
          const date = new Date(week.weekKey + "T00:00:00Z");
          // CS-41: timeZone:"UTC" keeps server/client consistent
          const label = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
          return (
            <div key={week.weekKey} className="flex flex-col items-center gap-1">
              <div
                title={label}
                className={cn(
                  "w-5 h-5 rounded-full transition-all",
                  week.hasActivity
                    ? "bg-[var(--color-cyan)]"
                    : isCurrent
                    ? "bg-[var(--color-bg4)] border-2 border-[var(--color-cyan-border)] border-dashed"
                    : "bg-[var(--color-bg4)]"
                )}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[var(--color-f4)]">há 12 semanas</span>
        <span className="text-[var(--color-f4)]">hoje</span>
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--color-border)] text-[12px] text-[var(--color-f3)] text-center">
        {streak.currentStreak === 0
          ? "Complete uma pílula esta semana para começar sua sequência."
          : `${streak.currentStreak} semana${streak.currentStreak > 1 ? "s" : ""} consecutiva${streak.currentStreak > 1 ? "s" : ""} com pelo menos 1 pílula.`}
      </div>
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────

function ProfileProgressBar({
  profile,
  completedCount,
}: {
  profile: PillProfile;
  completedCount: number;
}) {
  const meta = PROFILE_META[profile];
  const total = meta.count;
  const pct = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-[var(--color-bg4)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: meta.color }}
        />
      </div>
      <span className="text-[11px] text-[var(--color-f4)] shrink-0">
        {completedCount}/{total}
      </span>
    </div>
  );
}

// ── Next pill CTA ────────────────────────────────────────────────────────────

function NextPillCard({ pill }: { pill: Pill }) {
  return (
    <Link
      href={`/education/${pill.id}`}
      className="flex items-center gap-4 px-5 py-4 rounded-[14px] border border-[var(--color-cyan-border)] bg-[var(--color-cyan-faint)] hover:bg-[rgba(34,211,238,0.08)] transition-all cursor-pointer"
    >
      <div className="w-10 h-10 rounded-full bg-[var(--color-cyan)] flex items-center justify-center flex-shrink-0">
        <IconPlayerPlay size={17} className="text-[#083344]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-cyan)] mb-0.5">
          Próxima pílula
        </div>
        <div className="text-[14px] font-semibold text-[var(--color-f1)] leading-snug line-clamp-1">
          {pill.title}
        </div>
        <div className="text-[11px] text-[var(--color-f3)] mt-0.5">
          {pill.category} · {pill.estimatedMinutes} min
        </div>
      </div>
      <IconChevronRight size={18} className="text-[var(--color-cyan)] shrink-0" />
    </Link>
  );
}

// ── Pill row ─────────────────────────────────────────────────────────────────

function PillRow({
  pill,
  record,
  isNext,
}: {
  pill: Pill;
  record: PillProgressRecord | undefined;
  isNext: boolean;
}) {
  const isCompleted = !!record;
  const meta = PROFILE_META[pill.profile as PillProfile];

  return (
    <Link href={`/education/${pill.id}`} className="block group">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-[10px] border transition-all",
          isCompleted
            ? "bg-[var(--color-bg2)] border-[var(--color-border)]"
            : isNext
            ? "bg-[var(--color-bg2)] border-[var(--color-cyan-border)]"
            : "bg-[var(--color-bg2)] border-[var(--color-border)] opacity-60 hover:opacity-80"
        )}
      >
        {/* Status circle */}
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all",
            isCompleted
              ? "bg-[var(--color-green)] text-[#052e16]"
              : isNext
              ? "bg-[var(--color-cyan)] text-[#083344]"
              : "border border-[var(--color-border2)] text-[var(--color-f4)]"
          )}
          style={
            !isCompleted && !isNext
              ? { backgroundColor: `${meta.color}18` }
              : undefined
          }
        >
          {isCompleted ? (
            <IconCheck size={12} />
          ) : (
            <span>{pill.order}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "text-[12px] font-medium leading-snug line-clamp-1",
              isCompleted ? "text-[var(--color-f2)]" : "text-[var(--color-f1)]"
            )}
          >
            {pill.title}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-[var(--color-f4)]">{pill.category}</span>
            <span className="text-[10px] text-[var(--color-f4)]">·</span>
            <span className="text-[10px] text-[var(--color-f4)]">{pill.estimatedMinutes} min</span>
            {isCompleted && record && (
              <>
                <span className="text-[10px] text-[var(--color-f4)]">·</span>
                <span className="text-[10px] text-[var(--color-green)]">
                  {fmtSeconds(record.timeSpentSeconds)} · {fmtDate(record.completedAt)}
                  {record.quizCorrect ? " ✓" : ""}
                </span>
              </>
            )}
          </div>
        </div>

        <IconChevronRight
          size={13}
          className={cn(
            "shrink-0 transition-colors",
            isCompleted ? "text-[var(--color-f4)]" : isNext ? "text-[var(--color-cyan)]" : "text-[var(--color-bg4)]"
          )}
        />
      </div>
    </Link>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  completedMap: Record<string, PillProgressRecord>;
  userProfile: PillProfile;
  streak: StreakData;
}

export function EducationHub({ completedMap, userProfile, streak }: Props) {
  const [activeProfile, setActiveProfile] = useState<PillProfile>(userProfile);
  const [showCalendar, setShowCalendar] = useState(false);

  const completedIds = new Set(Object.keys(completedMap));
  const pills = getPillsByProfile(activeProfile);
  const nextPill = getNextPill(activeProfile, completedIds);
  const completedInProfile = pills.filter((p) => completedIds.has(p.id)).length;
  const meta = PROFILE_META[activeProfile];

  return (
    <div className="p-8 max-w-[720px]">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
            Aprender
          </div>
          <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] leading-tight">
            Edu<span className="text-[var(--color-cyan)]">cação</span>
          </h1>
          <p className="text-[var(--color-f3)] text-sm mt-1">
            Pílulas de conhecimento financeiro no seu ritmo.
          </p>
        </div>

        {/* Streak badge */}
        <div className="relative">
          <button
            onClick={() => setShowCalendar((v) => !v)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-[10px] border transition-all cursor-pointer",
              streak.currentStreak > 0
                ? "border-[var(--color-cyan-border)] bg-[var(--color-cyan-faint)] hover:bg-[rgba(34,211,238,0.08)]"
                : "border-[var(--color-border)] bg-[var(--color-bg2)] hover:border-[var(--color-border2)]"
            )}
          >
            <IconFlame
              size={15}
              className={streak.currentStreak > 0 ? "text-[var(--color-cyan)]" : "text-[var(--color-f4)]"}
            />
            <span
              className={cn(
                "text-[13px] font-semibold",
                streak.currentStreak > 0 ? "text-[var(--color-cyan)]" : "text-[var(--color-f4)]"
              )}
            >
              {streak.currentStreak > 0
                ? `${streak.currentStreak} sem${streak.currentStreak > 1 ? "" : ""}.`
                : "Comece"}
            </span>
          </button>

          {showCalendar && (
            <StreakCalendar
              streak={streak}
              onClose={() => setShowCalendar(false)}
            />
          )}
        </div>
      </div>

      {/* ── Profile tabs ── */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {PROFILES.map((p) => {
          const m = PROFILE_META[p];
          const count = getPillsByProfile(p).filter((pill) =>
            completedIds.has(pill.id)
          ).length;
          const isActive = p === activeProfile;
          const isUserProfile = p === userProfile;
          return (
            <button
              key={p}
              onClick={() => setActiveProfile(p)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[11px] font-medium border transition-all cursor-pointer shrink-0",
                isActive
                  ? "border text-[var(--color-f1)]"
                  : "border-transparent text-[var(--color-f4)] hover:text-[var(--color-f2)] hover:bg-white/[0.04]"
              )}
              style={
                isActive
                  ? {
                      borderColor: `${m.color}40`,
                      backgroundColor: `${m.color}10`,
                      color: m.color,
                    }
                  : undefined
              }
            >
              {isUserProfile && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: m.color }}
                />
              )}
              {m.shortLabel}
              <span
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full",
                  isActive ? "opacity-80" : "opacity-50"
                )}
                style={
                  isActive
                    ? { backgroundColor: `${m.color}20`, color: m.color }
                    : { backgroundColor: "var(--color-bg4)", color: "var(--color-f4)" }
                }
              >
                {count}/{m.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Progress bar ── */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold tracking-[1.5px] uppercase" style={{ color: meta.color }}>
            {meta.label}
          </span>
          {completedInProfile === meta.count && meta.count > 0 && (
            <span className="text-[10px] text-[var(--color-green)]">
              Trilha concluída ✓
            </span>
          )}
        </div>
        <ProfileProgressBar
          profile={activeProfile}
          completedCount={completedInProfile}
        />
      </div>

      {/* ── Next pill CTA ── */}
      {nextPill && (
        <div className="mb-6">
          <NextPillCard pill={nextPill} />
        </div>
      )}

      {/* ── Pill trail ── */}
      <div className="flex flex-col gap-2">
        {pills.map((pill) => (
          <PillRow
            key={pill.id}
            pill={pill}
            record={completedMap[pill.id]}
            isNext={nextPill?.id === pill.id}
          />
        ))}
      </div>

      {/* ── Base de conhecimento ── */}
      <div className="mt-10 pt-6 border-t border-[var(--color-border)]">
        <Link
          href="/education/platform"
          className="flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg2)] hover:border-[var(--color-border2)] transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-[12px] bg-[var(--color-bg3)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
            <IconBook2 size={15} className="text-[var(--color-f3)]" />
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-semibold text-[var(--color-f2)]">
              Como usar o Lyfx
            </div>
            <div className="text-[11px] text-[var(--color-f4)]">
              Guias de uso de cada módulo da plataforma
            </div>
          </div>
          <IconChevronRight size={13} className="text-[var(--color-f4)] group-hover:text-[var(--color-f2)] transition-colors" />
        </Link>
      </div>

    </div>
  );
}
