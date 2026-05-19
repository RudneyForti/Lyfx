import { getProfile } from "@/app/actions/user";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const user = await getProfile();

  return (
    <div className="p-14 max-w-[600px]">
      <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
        Conta
      </div>
      <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
        Meu <span className="text-[var(--color-cyan)]">Perfil</span>
      </h1>
      <p className="text-[var(--color-f3)] text-sm mb-10">
        Atualize suas informações pessoais e credenciais de acesso.
      </p>

      <ProfileForm user={user} />
    </div>
  );
}
