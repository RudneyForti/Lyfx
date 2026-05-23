"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IconCheck,
  IconX,
  IconChevronRight,
  IconArrowLeft,
  IconCircleCheck,
  IconHelpCircle,
  IconClock,
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
      style={{ backgroundColor: meta.bg, borderColor: meta.border }}
    >
      <div
        className="text-[9px] font-bold tracking-[1.8px] uppercase mb-3"
        style={{ color: meta.color }}
      >
        {meta.label}
      </div>
      <p className="text-[14px] text-[var(--color-f2)] leading-relaxed">{text}</p>
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
          className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold transition-all"
          style={{
            borderColor: locked
              ? isCorrect ? "#4ADE80" : selected ? "#F87171" : "var(--color-border2)"
              : selected ? "var(--color-cyan)" : "var(--color-border2)",
            backgroundColor: locked
              ? isCorrect ? "rgba(74,222,128,0.15)" : selected ? "rgba(248,113,113,0.15)" : "transparent"
              : selected ? "var(--color-cyan-faint)" : "transparent",
          }}
        >
          {iconEl}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] leading-snug font-medium" style={{ color: textColor }}>
            {option.text}
          </p>
          {locked && (isCorrect || selected) && (
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

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalStep = "quiz" | "correction" | "completed";

interface Props {
  pill: Pill;
  initialRecord: PillProgressRecord | undefined;
  nextPill: Pill | null;
}

// ── Main component ────────────────────────────────────────────────────────────

export function PillReader({ pill, initialRecord }: Props) {
  const router = useRouter();
  const startedAt = useRef<number>(Date.now());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<PillProgressRecord | undefined>(initialRecord);
  const [modalStep, setModalStep] = useState<ModalStep | null>(null);

  const isAlreadyCompleted = !!record;
  const selectedOption = pill.quiz.options.find((o) => o.id === selectedId);
  const quizCorrect = selectedOption?.correct ?? false;

  function openQuiz() {
    setSelectedId(null);
    setLocked(false);
    setModalStep("quiz");
  }

  function handleSelect(id: string) {
    if (locked) return;
    setSelectedId(id);
    setLocked(true);
    setModalStep("correction");
  }

  async function handleContinueFromCorrection() {
    if (isAlreadyCompleted) {
      // Releitura: não registra de novo, volta à lista
      router.push("/education");
      return;
    }
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
    setModalStep("completed");
  }

  return (
    <>
      {/* ── Pill content ── */}
      <div className="p-8 max-w-[680px]">

        {/* Back nav */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[11px] text-[var(--color-f4)] hover:text-[var(--color-f2)] transition-colors mb-8 cursor-pointer"
        >
          <IconArrowLeft size={13} />
          Educação
        </button>

        {/* Meta */}
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

        {/* Title */}
        <h1 className="font-[family-name:var(--font-display)] italic text-[32px] font-bold tracking-tight text-[var(--color-f1)] leading-tight mb-2">
          {pill.title}
        </h1>
        <p className="text-[var(--color-f3)] text-sm mb-8">{pill.subtitle}</p>

        {/* Completion banner (releitura) */}
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

        {/* Hook */}
        <div className="mb-8 pl-4 border-l-2 border-[var(--color-cyan-border)]">
          <p className="text-[16px] italic text-[var(--color-f2)] leading-relaxed">
            {pill.content.hook}
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-4 mb-10">
          {pill.content.sections.map((section, idx) => (
            <SectionCard key={idx} type={section.type} text={section.text} />
          ))}
        </div>

        {/* Source ref */}
        {pill.sourceRef && (
          <p className="text-[10px] text-[var(--color-f4)] mb-10 italic">
            Referência: {pill.sourceRef}
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-[var(--color-border)] mb-8" />

        {/* Responder Quiz CTA */}
        <button
          onClick={openQuiz}
          className={cn(
            "w-full flex items-center justify-between px-5 py-4 rounded-[14px] border transition-all cursor-pointer group",
            isAlreadyCompleted
              ? "border-[var(--color-border)] bg-[var(--color-bg2)] hover:border-[var(--color-border2)]"
              : "border-[var(--color-cyan-border)] bg-[var(--color-cyan-faint)] hover:bg-[rgba(34,211,238,0.08)]"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                isAlreadyCompleted
                  ? "bg-[var(--color-bg3)] border border-[var(--color-border2)]"
                  : "bg-[var(--color-cyan)]"
              )}
            >
              <IconHelpCircle
                size={17}
                className={isAlreadyCompleted ? "text-[var(--color-f4)]" : "text-[#083344]"}
              />
            </div>
            <div className="text-left">
              <div
                className={cn(
                  "text-[13px] font-semibold",
                  isAlreadyCompleted ? "text-[var(--color-f2)]" : "text-[var(--color-f1)]"
                )}
              >
                {isAlreadyCompleted ? "Rever Quiz" : "Responder Quiz"}
              </div>
              <div className="text-[11px] text-[var(--color-f4)] mt-0.5">
                {isAlreadyCompleted
                  ? "Teste seu conhecimento novamente"
                  : "Teste o que você aprendeu para concluir a pílula"}
              </div>
            </div>
          </div>
          <IconChevronRight
            size={16}
            className={cn(
              "shrink-0 transition-colors",
              isAlreadyCompleted
                ? "text-[var(--color-f4)] group-hover:text-[var(--color-f2)]"
                : "text-[var(--color-cyan)]"
            )}
          />
        </button>

      </div>

      {/* ── Quiz Modal ── */}
      {modalStep && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalStep(null);
          }}
        >
          <div className="bg-[var(--color-bg2)] border border-[var(--color-border2)] rounded-[20px] w-full max-w-[520px] shadow-2xl overflow-hidden">

            {/* ── STEP: QUIZ ── */}
            {modalStep === "quiz" && (
              <>
                <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-cyan)] mb-1">
                      Quiz
                    </div>
                    <div className="text-[14px] font-semibold text-[var(--color-f1)] leading-snug">
                      {pill.quiz.question}
                    </div>
                  </div>
                  <button
                    onClick={() => setModalStep(null)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-f4)] hover:text-[var(--color-f2)] hover:bg-white/[0.06] transition-all cursor-pointer shrink-0"
                  >
                    <IconX size={14} />
                  </button>
                </div>

                <div className="px-6 py-5 flex flex-col gap-2.5">
                  {pill.quiz.options.map((opt) => (
                    <QuizOption
                      key={opt.id}
                      option={opt}
                      selected={selectedId === opt.id}
                      locked={false}
                      onClick={() => handleSelect(opt.id)}
                    />
                  ))}
                </div>

                <div className="px-6 pb-5">
                  <p className="text-[11px] text-[var(--color-f4)] text-center">
                    Selecione uma alternativa para continuar.
                  </p>
                </div>
              </>
            )}

            {/* ── STEP: CORRECTION ── */}
            {modalStep === "correction" && (
              <>
                <div
                  className="px-6 pt-5 pb-4 border-b border-[var(--color-border)]"
                  style={{
                    background: quizCorrect
                      ? "rgba(74,222,128,0.06)"
                      : "rgba(248,113,113,0.06)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: quizCorrect
                          ? "rgba(74,222,128,0.15)"
                          : "rgba(248,113,113,0.15)",
                      }}
                    >
                      {quizCorrect ? (
                        <IconCheck size={16} className="text-[#4ADE80]" />
                      ) : (
                        <IconX size={16} className="text-[#F87171]" />
                      )}
                    </div>
                    <div>
                      <div
                        className="text-[14px] font-semibold"
                        style={{ color: quizCorrect ? "#4ADE80" : "#F87171" }}
                      >
                        {quizCorrect ? "Resposta correta!" : "Resposta incorreta"}
                      </div>
                      <div className="text-[11px] text-[var(--color-f4)] mt-0.5">
                        {quizCorrect
                          ? "Ótimo raciocínio. Veja o gabarito."
                          : "Sem problemas. Veja a resposta correta."}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5 flex flex-col gap-2.5">
                  {pill.quiz.options.map((opt) => (
                    <QuizOption
                      key={opt.id}
                      option={opt}
                      selected={selectedId === opt.id}
                      locked={true}
                      onClick={() => {}}
                    />
                  ))}
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={handleContinueFromCorrection}
                    disabled={submitting}
                    className={cn(
                      "w-full py-3.5 rounded-[12px] text-[13px] font-bold tracking-wide transition-all flex items-center justify-center gap-2",
                      submitting
                        ? "bg-[var(--color-bg3)] text-[var(--color-f4)] cursor-not-allowed"
                        : "bg-[var(--color-cyan)] text-[#083344] hover:opacity-90 cursor-pointer"
                    )}
                  >
                    {submitting ? "Registrando..." : (
                      <>Continuar <IconChevronRight size={15} /></>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* ── STEP: COMPLETED ── */}
            {modalStep === "completed" && record && (
              <>
                <div className="px-6 pt-8 pb-5 text-center border-b border-[var(--color-border)]">
                  <div className="w-14 h-14 rounded-full bg-[rgba(74,222,128,0.12)] border border-[rgba(74,222,128,0.3)] flex items-center justify-center mx-auto mb-4">
                    <IconCircleCheck size={28} className="text-[#4ADE80]" />
                  </div>
                  <div className="text-[20px] font-bold text-[var(--color-f1)] mb-1">
                    Pílula concluída!
                  </div>
                  <p className="text-[13px] text-[var(--color-f3)]">
                    {record.quizCorrect
                      ? "Quiz correto — excelente desempenho!"
                      : "Continue praticando nas próximas pílulas."}
                  </p>
                </div>

                <div className="px-6 py-6 flex items-center justify-center gap-8">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5 text-[var(--color-cyan)]">
                      <IconClock size={14} />
                      <span className="text-[17px] font-bold">
                        {fmtSeconds(record.timeSpentSeconds)}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--color-f4)] uppercase tracking-wider">
                      tempo de leitura
                    </span>
                  </div>
                  <div className="w-px h-10 bg-[var(--color-border)]" />
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="text-[17px] font-bold"
                      style={{ color: record.quizCorrect ? "#4ADE80" : "#F87171" }}
                    >
                      {record.quizCorrect ? "Correto ✓" : "Incorreto"}
                    </div>
                    <span className="text-[10px] text-[var(--color-f4)] uppercase tracking-wider">
                      resultado do quiz
                    </span>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={() => router.push("/education")}
                    className="w-full py-3.5 rounded-[12px] text-[13px] font-bold tracking-wide bg-[var(--color-cyan)] text-[#083344] hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    Continuar <IconChevronRight size={15} />
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
