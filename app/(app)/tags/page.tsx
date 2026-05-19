import { getTags } from "@/app/actions/tags";
import { TagsManager } from "@/components/tags/TagsManager";

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div className="p-8 max-w-[680px]">
      <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
        Organização
      </div>
      <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
        Minhas <span className="text-[var(--color-cyan)]">tags</span>
      </h1>
      <p className="text-[var(--color-f3)] text-sm mb-10">
        Crie e gerencie tags para categorizar suas transações por projeto, contexto ou qualquer critério.
      </p>

      <TagsManager initialTags={tags} />
    </div>
  );
}
