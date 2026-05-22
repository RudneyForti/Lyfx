"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconCheck,
  IconX,
  IconChevronRight,
  IconArrowLeft,
  IconClock,
  IconCircleCheck,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  SECTION_META,
  fmtSeconds,
  fmtDate,
  type Pill,
  type PillProgressRecord,
} from "@/lib/pills";
import { completePill } from "@/app/actions/education";

// ── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ type, text }: { type: string; text: string }) {
  const meta = SECTION_META[type as keyof typeof SECTION_META];
  if (!meta) return null;

  return (
    <div
      className="rounded-[14px] p-5 border"
      style={{
        backgroundColor: meta.bg,
        borderColor: meta.border,
      }}
    >
      <div
        className="text-[9px] font-bold tracking-[1.8px] uppercase mb-3"
        style={{ color: meta.color }}
      >
        {meta.label}
      </div>
      <p className="text-[14px] text-[var(--color-f2)] leading-relaxed">
        {text}
      </p>
    </div>
  );
}

// ── Quiz option ───────────────────────────────────────────────────────────────

function QuizOption({
  option,
  selected,
  locked,
  onClick,
}: {
  option: { id: string; text: string; correct: boolean; feedback: string };
  selected: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  const isCorrect = option.correct;
  const showFeedback = locked;

  let borderColor = "var(--color-border)";
  let bgColor = "var(--color-bg2)";
  let textColor = "var(--color-f2)";
  let iconEl: React.ReactNode = null;

  if (locked) {
    if (isCorrect) {
      borderColor = "rgba(74,222,128,0.4)";
      bgColor = "rgba(74,222,128,0.06)";
      textColor = "#4ADE80";
      iconEl = <IconCheck size={13} className="shrink-0 text-[#4ADE80]" />;
    } else if (selected) {
      borderColor = "rgba(248,113,113,0.4)";
      bgColor = "rgba(248,113,113,0.06)";
      textColor = "#F87171";
      iconEl = <IconX size={13} className="shrink-0 text-[#F87171]" />;
    } else {
      borderColor = "var(--color-border)";
      bgColor = "var(--color-bg2)";
      textColor = "var(--color-f4)";
    }
  } else if (selected) {
    borderColor = "var(--color-cyan-border)";
    bgColor = "var(--color-cyan-faint)";
    textColor = "var(--color-cyan)";
  }

  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className={cn(
        "w-full text-left rounded-[12px] border px-4 py-3.5 transition-all",
        !locked && "cursor-pointer hover:border-[var(--color-border2)]",
        locked && "cursor-default"
      )}
      style={{ borderColor, backgroundColor: bgColor }}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold transition-all",
          )}
          style={{
            borderColor: locked
              ? isCorrect
                ? "#4ADE80"
                : selected
                ? "#F87171"
                : "var(--color-border2)"
              : selected
              ? "var(--color-cyan)"
              : "var(--color-border2)",
            backgroundColor: locked
              ? isCorrect
                ? "rgba(74,222,128,0.15)"
                : selected
                ? "rgba(248,113,113,0.15)"
                : "transparent"
              : selected
              ? "var(--color-cyan-faint)"
              : "transparent",
          }}
        >
          {iconEl}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] leading-snug font-medium"
            style={{ color: textColor }}
          >
            {option.text}
          </p>
          {showFeedback && (isCorrect || selected) && (
            <p
              className="text-[11px] mt-1.5 leading-snug"
              style={{ color: isCorrect ? "#4ADE80" : "#F87171", opacity: 0.85 }}
            >
              {option.feedback}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  pill: Pill;
  initialRecord: PillProgressRecord | undefined;
  nextPill: Pill | null;
}

export function PillReader({ pill, initialRecord, nextPill }: Props) {
  const router = useRouter();
  const startedAt = useRef<number>(Date.now());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<PillProgressRecord | undefined>(initialRecord);

  const isAlreadyCompleted = !!record;
  const selectedOption = pill.quiz.options.find((o) => o.id === selectedId);
  const quizCorrect = selectedOption?.correct ?? false;

  function handleSelect(id: string) {
    if (locked) return;
    setSelectedId(id);
    setLocked(true);
  }

  async function handleComplete() {
    if (submitting || isAlreadyCompleted) return;
    const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
    setSubmitting(true);
    try {
      await completePill({
        pillId: pill.id,
        profile: pill.profile,
        timeSpentSeconds: elapsed,
        quizCorrect,
      });
      setRecord({
        pillId: pill.id,
        profile: pill.profile,
        completedAt: new Date(),
        timeSpentSeconds: elapsed,
        quizCorrect,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-[680px]">

      {/* ── Back nav ── */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[11px] text-[var(--color-f4)] hover:text-[var(--color-f2)] transition-colors mb-8 cursor-pointer"
      >
        <IconArrowLeft size={13} />
        Educação
      </button>

      {/* ── Meta ── */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
          {pill.category}
        </span>
        <span className="text-[var(--color-border2)]">·</span>
        <span className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
          {pill.estimatedMinutes} min
        </span>
        <span className="text-[var(--color-border2)]">·</span>
        <span className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
          #{pill.order}
        </span>
      </div>

      {/* ── Title ── */}
      <h1 className="font-[family-name:var(--font-display)] italic text-[32px] font-bold tracking-tight text-[var(--color-f1)] leading-tight mb-2">
        {pill.title}
      </h1>
      <p className="text-[var(--color-f3)] text-sm mb-8">{pill.subtitle}</p>

      {/* ── Completion banner (if already done) ── */}
      {isAlreadyCompleted && record && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.06)] mb-8">
          <IconCircleCheck size={16} className="text-[#4ADE80] shrink-0" />
          <div className="flex-1 text-[12px] text-[#4ADE80]">
            Concluída em {fmtDate(record.completedAt)} · {fmtSeconds(record.timeSpentSeconds)}
            {record.quizCorrect ? " · Quiz correto ✓" : " · Quiz incorreto"}
          </div>
          <span className="text-[10px] text-[#4ADE80] opacity-60">releitura</span>
        </div>
      )}

      {/* ── Hook ── */}
      <div className="mb-8 pl-4 border-l-2 border-[var(--color-cyan-border)]">
        <p className="text-[16px] italic text-[var(--color-f2)] leading-relaxed">
          {pill.content.hook}
        </p>
      </div>

      {/* ── Sections ── */}
      <div className="flex flex-col gap-4 mb-10">
        {pill.content.sections.map((section, idx) => (
          <SectionCard key={idx} type={section.type} text={section.text} />
        ))}
      </div>

      {/* ── Source ref ── */}
      {pill.sourceRef && (
        <p className="text-[10px] text-[var(--color-f4)] mb-10 italic">
          Referência: {pill.sourceRef}
        </p>
      )}

      {/* ── Divider ── */}
      <div className="border-t border-[var(--color-border)] mb-8" />

      {/* ── Quiz ── */}
      <div className="mb-8">
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-cyan)] mb-3 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-[var(--color-cyan-border)]">
          Quiz
        </div>
        <p className="text-[15px] font-semibold text-[var(--color-f1)] mb-5 leading-snug">
          {pill.quiz.question}
        </p>

        <div className="flex flex-col gap-2.5">
          {pill.quiz.options.map((opt) => (
            <QuizOption
              key={opt.id}
              option={opt}
              selected={selectedId === opt.id}
              locked={locked || isAlreadyCompleted}
              onClick={() => handleSelect(opt.id)}
            />
          ))}
        </div>

        {/* Quiz result hint when already completed */}
        {isAlreadyCompleted && !locked && (
          <p className="text-[11px] text-[var(--color-f4)] mt-3 text-center">
            Selecione uma opção para ver o gabarito.
          </p>
        )}
      </div>

      {/* ── Complete button / success state ── */}
      {!isAlreadyCompleted ? (
        locked && !record ? (
          <button
            onClick={handleComplete}
            disabled={submitting}
            className={cn(
              "w-full py-3.5 rounded-[12px] text-[13px] font-bold tracking-wide transition-all cursor-pointer",
              quizCorrect
                ? "bg-[#4ADE80] text-[#052e16] hover:opacity-90"
                : "bg-[var(--color-bg3)] border border-[var(--color-border2)] text-[var(--color-f2)] hover:border-[var(--color-border2)]",
              submitting && "opacity-50 cursor-not-allowed"
            )}
          >
            {submitting
              ? "Registrando..."
              : quizCorrect
              ? "Concluir pílula ✓"
              : "Concluir pílula mesmo assim"}
          </button>
        ) : !locked ? (
          <p className="text-[11px] text-[var(--color-f4)] text-center">
            Responda o quiz para concluir a pílula.
          </p>
        ) : null
      ) : null}

      {/* ── Post-completion: success + next pill ── */}
      {record && !initialRecord && (
        <div className="mt-6 rounded-[14px] border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.06)] p-5">
          <div className="flex items-center gap-2 mb-1">
            <IconCircleCheck size={16} className="text-[#4ADE80]" />
            <span className="text-[13px] font-semibold text-[#4ADE80]">
              Pílula concluída!
            </span>
          </div>
          <p className="text-[12px] text-[#4ADE80] opacity-80 mb-4">
            {fmtSeconds(record.timeSpentSeconds)} de leitura ·{" "}
            {record.quizCorrect ? "Quiz correto 🎉" : "Continue praticando no próximo."}
          </p>

          {nextPill ? (
            <Link href={`/education/${nextPill.id}`} className="block">
              <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[var(--color-cyan-border)] bg-[var(--color-cyan-faint)] hover:bg-[rgba(34,211,238,0.08)] transition-all cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--color-cyan)] mb-0.5">
                    Próxima pílula
                  </div>
                  <div className="text-[13px] font-semibold text-[var(--color-f1)] line-clamp-1">
                    {nextPill.title}
                  </div>
                  <div className="text-[11px] text-[var(--color-f3)] mt-0.5">
                    {nextPill.category} · {nextPill.estimatedMinutes} min
                  </div>
                </div>
                <IconChevronRight size={16} className="text-[var(--color-cyan)] shrink-0" />
              </div>
            </Link>
          ) : (
            <Link href="/education" className="block">
              <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-[10px] border border-[var(--color-border2)] bg-[var(--color-bg3)] hover:bg-[var(--color-bg4)] transition-all cursor-pointer text-[13px] font-medium text-[var(--color-f2)]">
                Ver trilha completa
                <IconChevronRight size={14} />
              </div>
            </Link>
          )}
        </div>
      )}

    </div>
  );
}
