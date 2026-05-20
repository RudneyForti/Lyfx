"use client";

import { useState, useTransition, useRef } from "react";
import { IconCamera, IconCheck, IconX, IconLock, IconEye, IconEyeOff, IconLoader2, IconSearch } from "@tabler/icons-react";
import { updateProfile, changePassword } from "@/app/actions/user";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { cn } from "@/lib/utils";

// ── Field component defined OUTSIDE ProfileForm to prevent unmount on re-render ──
function Field({
  label, value, onChange, type = "text", placeholder, inputMode, readOnly, suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  readOnly?: boolean;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-[var(--color-f2)]">{label}</label>
      <div className="relative">
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={cn(
            "w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 py-[11px] text-[13px] text-[var(--color-f1)] outline-none h-[42px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)]",
            readOnly && "opacity-60 cursor-default",
            suffix && "pr-9",
          )}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-f4)]">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}

interface User {
  id: string;
  name: string;
  email?: string | null;
  avatar?: string | null;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  country?: string | null;
}

interface Props {
  user: User;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

export function ProfileForm({ user }: Props) {
  const [isPending, startTransition] = useTransition();
  const [pwPending, startPwTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user.name,
    email: user.email ?? "",
    age: user.age != null ? String(user.age) : "",
    gender: user.gender ?? "",
    city: user.city ?? "",
    state: user.state ?? "",
    zipCode: user.zipCode ?? "",
    street: user.street ?? "",
    streetNumber: user.streetNumber ?? "",
    country: user.country ?? "",
    avatar: user.avatar ?? null as string | null,
  });

  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  // Avatar upload → base64 with resize
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const SIZE = 200;
        const canvas = document.createElement("canvas");
        const ratio = Math.min(SIZE / img.width, SIZE / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setForm((f) => ({ ...f, avatar: canvas.toDataURL("image/jpeg", 0.85) }));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  // ViaCEP auto-fill
  async function handleCepBlur() {
    const raw = form.zipCode.replace(/\D/g, "");
    if (raw.length !== 8) return;
    setCepLoading(true);
    setCepError("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError("CEP não encontrado.");
      } else {
        setForm((f) => ({
          ...f,
          city: data.localidade ?? f.city,
          state: data.uf ?? f.state,
          street: data.logradouro ?? f.street,
        }));
      }
    } catch {
      setCepError("Erro ao buscar CEP.");
    } finally {
      setCepLoading(false);
    }
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg("");
    startTransition(async () => {
      await updateProfile({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        age: form.age ? Number(form.age) : null,
        gender: form.gender || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zipCode: form.zipCode.trim() || null,
        street: form.street.trim() || null,
        streetNumber: form.streetNumber.trim() || null,
        country: form.country.trim() || null,
        avatar: form.avatar,
      });
      setProfileMsg("Perfil atualizado.");
      setTimeout(() => setProfileMsg(""), 3000);
    });
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next !== pw.confirm) return setPwMsg({ text: "As senhas não coincidem." });
    startPwTransition(async () => {
      const result = await changePassword({ current: pw.current, next: pw.next });
      if (result?.error) return setPwMsg({ text: result.error });
      setPwMsg({ ok: true, text: "Senha alterada com sucesso." });
      setPw({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwMsg(null), 3000);
    });
  }

  return (
    <div className="flex flex-col gap-10">

      {/* Profile section */}
      <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
          Informações pessoais
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative group/avatar">
            <div
              className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--color-border2)] flex items-center justify-center cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {form.avatar ? (
                <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--color-cyan-dim)] flex items-center justify-center text-[22px] font-bold text-[var(--color-cyan)]">
                  {getInitials(form.name)}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--color-cyan)] text-[#083344] flex items-center justify-center border-2 border-[var(--color-bg2)] hover:bg-[#38D9F0] transition-colors cursor-pointer"
            >
              <IconCamera size={12} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[var(--color-f1)]">{form.name || "—"}</div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-[11px] text-[var(--color-cyan)] hover:opacity-70 transition-opacity cursor-pointer mt-1"
            >
              Alterar foto
            </button>
            {form.avatar && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, avatar: null }))}
                className="text-[11px] text-[var(--color-f4)] hover:text-[var(--color-red)] transition-colors cursor-pointer mt-1 ml-3"
              >
                Remover
              </button>
            )}
          </div>
        </div>

        {/* Basic fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Nome" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Seu nome" />
          </div>
          <div className="col-span-2">
            <Field label="E-mail (opcional)" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} type="email" placeholder="seu@email.com" />
          </div>
          <Field
            label="Idade"
            value={form.age}
            onChange={(v) => setForm((f) => ({ ...f, age: v.replace(/\D/g, "") }))}
            inputMode="numeric"
            placeholder="Ex: 32"
          />
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[var(--color-f2)]">Sexo</label>
            <select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 py-[11px] text-[13px] text-[var(--color-f1)] outline-none h-[42px] focus:border-[var(--color-cyan-border)] transition-all cursor-pointer"
            >
              <option value="">Prefiro não informar</option>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
              <option value="other">Outro</option>
            </select>
          </div>
        </div>

        {/* Address section */}
        <div className="flex flex-col gap-3">
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
            Endereço
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* CEP row */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[var(--color-f2)]">CEP / Zip code</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.zipCode}
                  onChange={(e) => {
                    setCepError("");
                    setForm((f) => ({ ...f, zipCode: e.target.value.replace(/[^\d-]/g, "") }));
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCepBlur(); } }}
                  placeholder="Ex: 01310-100"
                  maxLength={9}
                  className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 pr-9 py-[11px] text-[13px] text-[var(--color-f1)] outline-none h-[42px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)]"
                />
                <button
                  type="button"
                  onClick={handleCepBlur}
                  disabled={cepLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-f4)] hover:text-[var(--color-f2)] transition-colors cursor-pointer disabled:opacity-40"
                >
                  {cepLoading
                    ? <IconLoader2 size={14} className="animate-spin" />
                    : <IconSearch size={14} />
                  }
                </button>
              </div>
              {cepError && (
                <span className="text-[10px] text-[var(--color-red)]">{cepError}</span>
              )}
            </div>

            <Field
              label="Número"
              value={form.streetNumber}
              onChange={(v) => setForm((f) => ({ ...f, streetNumber: v }))}
              placeholder="Ex: 42 / Apto 3"
            />

            <div className="col-span-2">
              <Field
                label="Logradouro"
                value={form.street}
                onChange={(v) => setForm((f) => ({ ...f, street: v }))}
                placeholder="Ex: Avenida Paulista"
              />
            </div>

            <Field
              label="Cidade"
              value={form.city}
              onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              placeholder="Ex: São Paulo"
            />

            <Field
              label="Estado"
              value={form.state}
              onChange={(v) => setForm((f) => ({ ...f, state: v }))}
              placeholder="Ex: SP"
            />

            <div className="col-span-2">
              <CountrySelect
                value={form.country}
                onChange={(v) => setForm((f) => ({ ...f, country: v }))}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[13px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer disabled:opacity-50"
          >
            <IconCheck size={14} />
            {isPending ? "Salvando..." : "Salvar perfil"}
          </button>
          {profileMsg && (
            <span className="text-[11px] text-[var(--color-green)] flex items-center gap-1">
              <IconCheck size={11} />{profileMsg}
            </span>
          )}
        </div>
      </form>

      {/* Divider */}
      <div className="h-px bg-[var(--color-border)]" />

      {/* Password section */}
      <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
          Alterar senha
        </div>

        {[
          { label: "Senha atual", key: "current" as const, ph: "••••••••" },
          { label: "Nova senha", key: "next" as const, ph: "Mínimo 6 caracteres" },
          { label: "Confirmar nova senha", key: "confirm" as const, ph: "Repita a nova senha" },
        ].map(({ label, key, ph }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[var(--color-f2)]">{label}</label>
            <div className="relative">
              <IconLock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-f4)] pointer-events-none" />
              <input
                type={showPw ? "text" : "password"}
                value={pw[key]}
                onChange={(e) => setPw((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={ph}
                className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] pl-9 pr-10 py-[11px] text-[13px] text-[var(--color-f1)] outline-none h-[42px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)]"
              />
              {key === "current" && (
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-f4)] hover:text-[var(--color-f2)] cursor-pointer"
                >
                  {showPw ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pwPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[13px] font-medium bg-transparent border border-[var(--color-border2)] text-[var(--color-f2)] hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer disabled:opacity-50"
          >
            <IconLock size={14} />
            {pwPending ? "Alterando..." : "Alterar senha"}
          </button>
          {pwMsg && (
            <span className={cn("text-[11px] flex items-center gap-1", pwMsg.ok ? "text-[var(--color-green)]" : "text-[var(--color-red)]")}>
              {pwMsg.ok ? <IconCheck size={11} /> : <IconX size={11} />}
              {pwMsg.text}
            </span>
          )}
        </div>
      </form>

    </div>
  );
}
