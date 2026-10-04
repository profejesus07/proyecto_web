import type { Metadata } from "next";
import { AvatarStudio } from "@/components/avatar-studio";
import { PageTitle } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { rankForXp } from "@/lib/game/ranks";

export const metadata: Metadata = { title: "Vestidor" };

export default async function AvatarPage() {
  const viewer = await requireViewer("/perfil/avatar");
  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Tu perfil" title="Vestidor">
        <p className="text-muted">Elige tu personaje, sus colores y el atuendo que quieres lucir en el Gremio.</p>
      </PageTitle>
      <AvatarStudio initialBase={viewer.avatarBase} initialLook={viewer.avatarLook} rank={rankForXp(viewer.xp).key} />
    </div>
  );
}
