"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconX, IconCheck } from "@tabler/icons-react";
import { createTag } from "@/app/actions/tags";
import { TAG_ICONS, TAG_COLORS, getTagIcon, type TagIconKey } from "@/lib/tag-icons";
import { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  initialTags: Tag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagPicker({ initialTags, selectedTagIds, onChange }: Props) {
  const [allTags, setAllTags] = useState<Tag[]>(initialTags);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(TAG_COLORS[0]);
  const [newIcon, setNewIcon] = useState<TagIconKey>("tag");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id));
  const availableTags = allTags.filter((t) => !selectedTagIds.includes(t.id));

  function toggle(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  }

  function handleCreate() {
    setError("");
    if (!newName.trim()) return setError("Nome obrigatório.");
    startTransition(async () => {
      const tag = await createTag({ name: newName.trim(), color: newColor, icon: newIcon });
      if (!tag || "error" in tag) return;
      const newTag: Tag = { ...tag };
      setAllTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      onChange([...selectedTagIds, tag.id]);
      setNewName("");
      setNewColor(TAG_COLORS[0]);
      setNewIcon("tag");
      setCreating(false);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => {
            const Icon = getTagIcon(tag.icon);
            return (
              <span
                key={tag.id}
                className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-medium border"
                style={{
                  color: tag.color,
                  borderColor: `${tag.color}44`,
                  backgroundColor: `${tag.color}14`,
                }}
              >
                <Icon size={10} />
                {tag.name}
                <button
                  type="button"
                  onClick={() => toggle(tag.id)}
                  className="ml-0.5 hover:opacity-60 transition-opacity cursor-pointer"
                >
                  <IconX size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Toggle */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setCreating(false); }}
        className="flex items-center gap-1.5 text-[11px] text-[var(--color-f4)] hover:text-[var(--color-f2)] transition-colors cursor-pointer w-fit"
      >
        <IconPlus size={11} />
        {selectedTags.length === 0 ? "Adicionar tag" : "Mais tags"}
      </button>

      {/* Picker panel */}
      {open && (
        <div className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[10px] p-3 flex flex-col gap-3">
          {/* Available tags */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => {
                const Icon = getTagIcon(tag.icon);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggle(tag.id)}
                    className="flex items-center gap-1 pl-2 pr-2.5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      color: tag.color,
                      borderColor: `${tag.color}33`,
                      backgroundColor: `${tag.color}0d`,
                    }}
                  >
                    <Icon size={10} />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}

          {availableTags.length === 0 && !creating && (
            <p className="text-[11px] text-[var(--color-f4)]">Nenhuma tag disponível.</p>
          )}

          {/* Create new tag */}
          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 text-[11px] text-[var(--color-cyan)] hover:opacity-70 transition-opacity cursor-pointer w-fit"
            >
              <IconPlus size={11} />
              Nova tag
            </button>
          ) : (
            <div className="flex flex-col gap-2.5 border-t border-[var(--color-border)] pt-2.5">
              <input
                type="text"
                placeholder="Nome da tag..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
                className="w-full bg-[var(--color-bg4)] border border-[var(--color-border2)] rounded-[6px] px-2.5 py-1.5 text-[12px] text-[var(--color-f1)] outline-none focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)]"
              />

              {/* Color palette */}
              <div className="flex gap-1.5 flex-wrap">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className="w-5 h-5 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center"
                    style={{
                      backgroundColor: color,
                      borderColor: newColor === color ? "#fff" : "transparent",
                    }}
                  >
                    {newColor === color && <IconCheck size={10} color="#000" />}
                  </button>
                ))}
              </div>

              {/* Icon palette */}
              <div className="flex gap-1 flex-wrap">
                {(Object.entries(TAG_ICONS) as [TagIconKey, (typeof TAG_ICONS)[TagIconKey]][]).map(([key, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewIcon(key)}
                    className={cn(
                      "w-7 h-7 rounded-[6px] flex items-center justify-center border transition-all cursor-pointer",
                      newIcon === key
                        ? "border-[var(--color-cyan-border)] bg-[var(--color-cyan-faint)]"
                        : "border-transparent bg-[var(--color-bg5)] hover:border-[var(--color-border2)]"
                    )}
                    style={{ color: newIcon === key ? newColor : "var(--color-f3)" }}
                  >
                    <Icon size={13} />
                  </button>
                ))}
              </div>

              {error && <p className="text-[10px] text-[var(--color-red)]">{error}</p>}

              {/* Preview + actions */}
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center gap-1 pl-2 pr-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                  style={{
                    color: newColor,
                    borderColor: `${newColor}44`,
                    backgroundColor: `${newColor}14`,
                  }}
                >
                  {(() => { const Icon = getTagIcon(newIcon); return <Icon size={10} />; })()}
                  {newName || "Prévia"}
                </span>
                <div className="flex gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => { setCreating(false); setError(""); }}
                    className="px-2.5 py-1 rounded-[6px] text-[11px] text-[var(--color-f3)] hover:text-[var(--color-f1)] border border-[var(--color-border)] hover:border-[var(--color-border2)] transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isPending}
                    className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? "..." : "Criar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
