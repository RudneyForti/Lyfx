"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconTrash, IconCheck, IconX } from "@tabler/icons-react";
import { createTag, deleteTag } from "@/app/actions/tags";
import { TAG_ICONS, TAG_COLORS, getTagIcon, type TagIconKey } from "@/lib/tag-icons";
import { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  initialTags: Tag[];
}

export function TagsManager({ initialTags }: Props) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [newIcon, setNewIcon] = useState<TagIconKey>("tag");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleCreate() {
    setError("");
    if (!newName.trim()) return setError("Nome obrigatório.");
    startTransition(async () => {
      const tag = await createTag({ name: newName.trim(), color: newColor, icon: newIcon });
      setTags((prev) => [...prev, tag as Tag].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewColor(TAG_COLORS[0]);
      setNewIcon("tag");
      setCreating(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTag(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Tag list */}
      {tags.length > 0 ? (
        <div className="flex flex-col gap-1">
          {tags.map((tag) => {
            const Icon = getTagIcon(tag.icon);
            return (
              <div
                key={tag.id}
                className="group flex items-center gap-3 px-4 py-3 bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[10px] hover:border-[var(--color-border2)] transition-colors"
              >
                {/* Icon preview */}
                <div
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 border"
                  style={{
                    color: tag.color,
                    borderColor: `${tag.color}44`,
                    backgroundColor: `${tag.color}14`,
                  }}
                >
                  <Icon size={15} />
                </div>

                {/* Name + color swatch */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[var(--color-f1)]">{tag.name}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                  </div>
                  <div className="text-[10px] text-[var(--color-f4)] mt-0.5">{tag.color}</div>
                </div>

                {/* Preview chip */}
                <span
                  className="flex items-center gap-1 pl-2 pr-2.5 py-0.5 rounded-full text-[11px] font-medium border flex-shrink-0"
                  style={{
                    color: tag.color,
                    borderColor: `${tag.color}44`,
                    backgroundColor: `${tag.color}14`,
                  }}
                >
                  <Icon size={10} />
                  {tag.name}
                </span>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(tag.id)}
                  disabled={isPending}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[var(--color-f4)] hover:bg-[var(--color-red-dim)] hover:border hover:border-[var(--color-red-border)] hover:text-[var(--color-red)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 disabled:opacity-30"
                >
                  <IconTrash size={13} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        !creating && (
          <div className="flex flex-col items-center text-center p-10 bg-[var(--color-bg2)] border border-dashed border-[var(--color-border2)] rounded-[14px]">
            <div className="text-[32px] text-[var(--color-f4)] mb-3">∅</div>
            <div className="text-[13px] font-medium text-[var(--color-f2)] mb-1">Nenhuma tag criada</div>
            <div className="text-[11px] text-[var(--color-f4)] max-w-[200px]">
              Crie tags para organizar suas transações por contexto ou projeto.
            </div>
          </div>
        )
      )}

      {/* Create form */}
      {creating ? (
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border2)] rounded-[12px] p-5 flex flex-col gap-4">
          <div className="text-[11px] font-bold tracking-[1.5px] uppercase text-[var(--color-f4)]">Nova tag</div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[var(--color-f2)]">Nome</label>
            <input
              type="text"
              placeholder="Ex: Trabalho, Pessoal, Freelance..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
              className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 py-[11px] text-[13px] text-[var(--color-f1)] outline-none h-[42px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[var(--color-f2)]">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className="w-7 h-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center"
                  style={{
                    backgroundColor: color,
                    borderColor: newColor === color ? "#fff" : "transparent",
                    boxShadow: newColor === color ? `0 0 0 2px ${color}55` : "none",
                  }}
                >
                  {newColor === color && <IconCheck size={12} color="#000" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[var(--color-f2)]">Ícone</label>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.entries(TAG_ICONS) as [TagIconKey, any][]).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewIcon(key)}
                  title={key}
                  className={cn(
                    "w-9 h-9 rounded-[8px] flex items-center justify-center border transition-all cursor-pointer",
                    newIcon === key
                      ? "border-[var(--color-cyan-border)] bg-[var(--color-cyan-faint)]"
                      : "border-transparent bg-[var(--color-bg3)] hover:border-[var(--color-border2)]"
                  )}
                  style={{ color: newIcon === key ? newColor : "var(--color-f3)" }}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--color-f4)]">Prévia:</span>
            <span
              className="flex items-center gap-1 pl-2.5 pr-3 py-1 rounded-full text-[12px] font-medium border"
              style={{
                color: newColor,
                borderColor: `${newColor}44`,
                backgroundColor: `${newColor}14`,
              }}
            >
              {(() => { const Icon = getTagIcon(newIcon); return <Icon size={11} />; })()}
              {newName || "Nome da tag"}
            </span>
          </div>

          {error && <p className="text-[11px] text-[var(--color-red)] flex items-center gap-1"><IconX size={11} />{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setCreating(false); setError(""); setNewName(""); }}
              className="flex-1 py-2.5 rounded-[8px] text-[13px] font-medium bg-transparent border border-[var(--color-border2)] text-[var(--color-f2)] hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-[13px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer disabled:opacity-50"
            >
              <IconCheck size={14} />
              {isPending ? "Criando..." : "Criar tag"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-medium bg-[var(--color-bg2)] border border-dashed border-[var(--color-border2)] text-[var(--color-f3)] hover:border-[var(--color-cyan-border)] hover:text-[var(--color-cyan)] hover:bg-[var(--color-cyan-faint)] transition-all cursor-pointer w-fit"
        >
          <IconPlus size={15} />
          Nova tag
        </button>
      )}
    </div>
  );
}
