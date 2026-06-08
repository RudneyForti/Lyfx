"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  IconShieldCheck, IconShieldOff, IconQrcode, IconKey,
  IconLoader2, IconCopy, IconCheck, IconRefresh, IconX,
} from "@tabler/icons-react";
import {
  getTwoFactorStatus,
  initTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  regenerateBackupCodes,
} from "@/app/actions/two-factor";

/* ── shared styles ── */
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--color-bg)", border: "1px solid var(--color-border2)",
  borderRadius: 8, color: "var(--color-f1)", fontSize: 13, padding: "8px 12px",
  outline: "none", boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  background: "var(--color-cyan)", color: "#0f172a", border: "none",
  borderRadius: 8, fontWeight: 700, fontSize: 13, padding: "9px 20px",
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  background: "var(--color-bg2)", color: "var(--color-f3)",
  border: "1px solid var(--color-border)", borderRadius: 8,
  fontSize: 13, fontWeight: 500, padding: "9px 16px", cursor: "pointer",
};

const btnDanger: React.CSSProperties = {
  background: "rgba(248,113,113,0.1)", color: "#f87171",
  border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8,
  fontSize: 13, fontWeight: 600, padding: "9px 16px", cursor: "pointer",
};

/* ── Backup codes display ── */
function BackupCodesDisplay({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyAll() {
    navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
        borderRadius: 10, padding: "12px 16px",
      }}>
        <p style={{ margin: "0 0 4px 0", fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>
          ⚠ Salve agora — não serão exibidos novamente
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "var(--color-f3)" }}>
          Cada código pode ser usado uma única vez caso você perca acesso ao autenticador.
        </p>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 6, background: "var(--color-bg)", borderRadius: 8,
        padding: "12px", border: "1px solid var(--color-border)",
      }}>
        {codes.map((c, i) => (
          <code key={i} style={{
            fontSize: 13, fontFamily: "monospace", letterSpacing: "0.1em",
            color: "var(--color-cyan)", background: "rgba(34,211,238,0.06)",
            padding: "4px 8px", borderRadius: 5,
          }}>
            {c}
          </code>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={copyAll} style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 6 }}>
          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          {copied ? "Copiado!" : "Copiar todos"}
        </button>
        <button onClick={onDone} style={{ ...btnPrimary, flex: 1 }}>
          Feito — já guardei os códigos
        </button>
      </div>
    </div>
  );
}

/* ── Setup modal ── */
function SetupModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<"loading" | "qr" | "verify" | "backup">("loading");
  const [qrUrl, setQrUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();
  const [showSecret, setShowSecret] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    start(async () => {
      const res = await initTwoFactorSetup();
      if ("error" in res) { setError(res.error ?? ""); setStep("qr"); return; }
      setQrUrl(res.qrCodeUrl);
      setSecret(res.secret);
      setStep("qr");
    });
  }, []);

  useEffect(() => {
    if (step === "verify") setTimeout(() => inputRef.current?.focus(), 100);
  }, [step]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await confirmTwoFactorSetup(code);
      if ("error" in res) { setError(res.error ?? ""); return; }
      setBackupCodes(res.backupCodes);
      setStep("backup");
    });
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div style={{
        background: "var(--color-bg2)", border: "1px solid var(--color-border2)",
        borderRadius: 16, width: "100%", maxWidth: 420,
        boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(34,211,238,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)",
              borderRadius: 8, padding: "5px 7px", display: "flex",
            }}>
              <IconQrcode size={16} style={{ color: "var(--color-cyan)" }} />
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--color-f1)" }}>
                {step === "backup" ? "Códigos de backup" : "Ativar 2FA"}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "var(--color-f4)" }}>
                {step === "qr" && "Passo 1 de 2 — Escanear QR Code"}
                {step === "verify" && "Passo 2 de 2 — Verificar código"}
                {step === "backup" && "Guarde em local seguro"}
                {step === "loading" && "Gerando..."}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-f4)", padding: 4 }}>
            <IconX size={16} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Loading */}
          {step === "loading" && (
            <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
              <IconLoader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--color-cyan)" }} />
            </div>
          )}

          {/* QR step */}
          {step === "qr" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {error && <p style={{ margin: 0, fontSize: 12, color: "#f87171" }}>{error}</p>}
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-f3)" }}>
                Abra o Google Authenticator, Authy ou qualquer app compatível com TOTP e escaneie o QR Code abaixo.
              </p>
              {qrUrl && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{
                    background: "#fff", padding: 12, borderRadius: 10,
                    display: "inline-flex", boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrUrl} alt="QR Code 2FA" width={180} height={180} />
                  </div>
                </div>
              )}
              {/* Manual entry */}
              <button
                type="button"
                onClick={() => setShowSecret(v => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-f4)", fontSize: 12, textAlign: "left", padding: 0 }}
              >
                {showSecret ? "▼" : "▶"} Não consigo escanear — inserir manualmente
              </button>
              {showSecret && (
                <code style={{
                  display: "block", wordBreak: "break-all", fontSize: 12,
                  fontFamily: "monospace", background: "var(--color-bg)",
                  padding: "8px 12px", borderRadius: 7, color: "var(--color-cyan)",
                  border: "1px solid var(--color-border)", letterSpacing: "0.08em",
                }}>
                  {secret}
                </code>
              )}
              <button onClick={() => setStep("verify")} style={{ ...btnPrimary, width: "100%" }}>
                Já escaneei — próximo
              </button>
            </div>
          )}

          {/* Verify step */}
          {step === "verify" && (
            <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-f3)" }}>
                Digite o código de 6 dígitos exibido no seu aplicativo autenticador para confirmar a configuração.
              </p>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                style={{
                  ...inputStyle, fontSize: 32, textAlign: "center",
                  letterSpacing: "0.4em", fontFamily: "monospace",
                  padding: "12px 14px",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--color-cyan)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border2)")}
              />
              {error && <p style={{ margin: 0, fontSize: 12, color: "#f87171", textAlign: "center" }}>{error}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setStep("qr")} style={{ ...btnGhost }}>
                  ← Voltar
                </button>
                <button
                  type="submit"
                  disabled={isPending || code.length < 6}
                  style={{ ...btnPrimary, flex: 1, opacity: (isPending || code.length < 6) ? 0.6 : 1 }}
                >
                  {isPending ? <IconLoader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Confirmar e ativar"}
                </button>
              </div>
            </form>
          )}

          {/* Backup codes */}
          {step === "backup" && (
            <BackupCodesDisplay
              codes={backupCodes}
              onDone={() => { onSuccess(); onClose(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Disable modal ── */
function DisableModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await disableTwoFactor(code);
      if (res.error) { setError(res.error ?? ""); return; }
      onSuccess();
      onClose();
    });
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div style={{
        background: "var(--color-bg2)", border: "1px solid rgba(248,113,113,0.3)",
        borderRadius: 16, width: "100%", maxWidth: 380,
        boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f87171" }}>Desativar 2FA</p>
          <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "var(--color-f4)" }}>
            Isso remove a proteção adicional da sua conta.
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="text" inputMode="numeric" maxLength={6}
            value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="Código do autenticador"
            autoFocus
            style={{ ...inputStyle, fontSize: 24, textAlign: "center", letterSpacing: "0.3em", fontFamily: "monospace" }}
            onFocus={e => (e.currentTarget.style.borderColor = "#f87171")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border2)")}
          />
          {error && <p style={{ margin: 0, fontSize: 12, color: "#f87171", textAlign: "center" }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={onClose} style={{ ...btnGhost, flex: 1 }}>Cancelar</button>
            <button
              type="submit"
              disabled={isPending || code.length < 6}
              style={{ ...btnDanger, flex: 1, opacity: (isPending || code.length < 6) ? 0.6 : 1 }}
            >
              {isPending ? "Desativando…" : "Desativar 2FA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Regenerate backup codes modal ── */
function RegenModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await regenerateBackupCodes(code);
      if ("error" in res) { setError(res.error ?? ""); return; }
      setBackupCodes(res.backupCodes);
    });
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div style={{
        background: "var(--color-bg2)", border: "1px solid var(--color-border2)",
        borderRadius: 16, width: "100%", maxWidth: 400,
        boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--color-f1)" }}>Regenerar códigos de backup</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-f4)" }}>
            <IconX size={16} />
          </button>
        </div>
        <div style={{ padding: 20 }}>
          {backupCodes
            ? <BackupCodesDisplay codes={backupCodes} onDone={onClose} />
            : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-f3)" }}>
                  Os códigos antigos serão invalidados. Confirme com seu código do autenticador.
                </p>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Código do autenticador"
                  autoFocus
                  style={{ ...inputStyle, fontSize: 22, textAlign: "center", letterSpacing: "0.3em", fontFamily: "monospace" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--color-cyan)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border2)")}
                />
                {error && <p style={{ margin: 0, fontSize: 12, color: "#f87171", textAlign: "center" }}>{error}</p>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={onClose} style={{ ...btnGhost, flex: 1 }}>Cancelar</button>
                  <button
                    type="submit"
                    disabled={isPending || code.length < 6}
                    style={{ ...btnPrimary, flex: 1, opacity: (isPending || code.length < 6) ? 0.6 : 1 }}
                  >
                    {isPending ? "Regenerando…" : "Gerar novos códigos"}
                  </button>
                </div>
              </form>
            )
          }
        </div>
      </div>
    </div>
  );
}

/* ── Main TwoFactorSection ── */
export function TwoFactorSection() {
  const [status, setStatus] = useState<{ enabled: boolean; backupCount: number } | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showRegen, setShowRegen] = useState(false);
  const [, start] = useTransition();

  function loadStatus() {
    start(async () => {
      const s = await getTwoFactorStatus();
      setStatus(s);
    });
  }

  useEffect(() => { loadStatus(); }, []);

  if (!status) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
        <IconLoader2 size={20} style={{ animation: "spin 1s linear infinite", color: "var(--color-f4)" }} />
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            background: status.enabled ? "rgba(74,222,128,0.1)" : "rgba(100,116,139,0.1)",
            border: `1px solid ${status.enabled ? "rgba(74,222,128,0.3)" : "rgba(100,116,139,0.3)"}`,
            borderRadius: 8, padding: "6px 8px", display: "flex",
          }}>
            {status.enabled
              ? <IconShieldCheck size={18} style={{ color: "#4ade80" }} />
              : <IconShieldOff size={18} style={{ color: "var(--color-f4)" }} />
            }
          </span>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-f1)" }}>
              Autenticação em dois fatores (2FA)
            </p>
            <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "var(--color-f3)" }}>
              {status.enabled
                ? `Ativo — ${status.backupCount} código${status.backupCount !== 1 ? "s" : ""} de backup restante${status.backupCount !== 1 ? "s" : ""}`
                : "Desativado — adicione uma camada extra de segurança com um app autenticador"
              }
            </p>
          </div>
        </div>

        {status.enabled
          ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => setShowRegen(true)}
                style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
              >
                <IconRefresh size={13} /> Regenerar códigos
              </button>
              <button
                onClick={() => setShowDisable(true)}
                style={{ ...btnDanger, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
              >
                <IconShieldOff size={13} /> Desativar
              </button>
            </div>
          )
          : (
            <button
              onClick={() => setShowSetup(true)}
              style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
            >
              <IconKey size={13} /> Ativar 2FA
            </button>
          )
        }
      </div>

      {showSetup && (
        <SetupModal
          onClose={() => setShowSetup(false)}
          onSuccess={loadStatus}
        />
      )}
      {showDisable && (
        <DisableModal
          onClose={() => setShowDisable(false)}
          onSuccess={loadStatus}
        />
      )}
      {showRegen && (
        <RegenModal onClose={() => setShowRegen(false)} />
      )}
    </>
  );
}
