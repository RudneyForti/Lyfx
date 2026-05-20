"use client";

import { useState, useTransition, useRef } from "react";
import { IconCamera, IconCheck, IconX, IconLock, IconEye, IconEyeOff, IconCode } from "@tabler/icons-react";
import Link from "next/link";
import { updateProfile, changePassword } from "@/app/actions/user";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email?: string | null;
  avatar?: string | null;
  age?: number | null;
  gender?: string | null;
  address?: string | null;
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
    address: user.address ?? "",
    avatar: user.avatar ?? null as string | null,
  });

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

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg("");
    startTransition(async () => {
      await updateProfile({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        age: form.age ? Number(form.age) : null,
        gender: form.gender || null,
        address: form.address.trim() || null,
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

  const Field = ({
    label, value, onChange, type = "text", placeholder
  }: {
    label: string; value: string;
    onChange: (v: string) => void;
    type?: string; placeholder?: string;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-[var(--color-f2)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 py-[11px] text-[13px] text-[var(--color-f1)] outline-none h-[42px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)]"
      />
    </div>
  );

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

        {/* Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Nome" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Seu nome" />
          </div>
          <div className="col-span-2">
            <Field label="E-mail (opcional)" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} type="email" placeholder="seu@email.com" />
          </div>
          <Field label="Idade" value={form.age} onChange={(v) => setForm((f) => ({ ...f, age: v }))} type="number" placeholder="Ex: 32" />
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
          <div className="col-span-2">
            <Field label="Endereço (opcional)" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="Cidade, Estado" />
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
