import type { Metadata } from "next";
import { AvatarStudio, type OwnedOption } from "@/components/avatar-studio";
import { PageTitle } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { FREE_FRAME, WEAR_SLOTS, type WearSlot } from "@/lib/avatar-look";
import { getItem, itemImage, petImage, titleLabel, type CatalogItem } from "@/lib/catalog";
import { WEARABLE_IDS } from "@/content/wearable-ids";
import { getRepo } from "@/lib/data";
import { rankForXp } from "@/lib/game/ranks";

export const metadata: Metadata = { title: "Vestidor" };

export default async function AvatarPage() {
  const viewer = await requireViewer("/perfil/avatar");
  const rank = rankForXp(viewer.xp).key;
  const owned = new Set((await getRepo().getInventory(viewer.id)).map((i) => i.itemId));
  const opt = (it: CatalogItem, image = itemImage(it)): OwnedOption => ({ id: it.id, name: it.nombre, image });
  const mine = (ids: readonly string[]) => ids.filter((id) => owned.has(id)).map((id) => getItem(id)).filter((i): i is CatalogItem => !!i);

  const wear = Object.fromEntries(WEAR_SLOTS.map((s) => [s, mine(WEARABLE_IDS[s]).map((i) => opt(i))])) as Record<WearSlot, OwnedOption[]>;
  const ownedOf = (cat: string) => [...owned].map((id) => getItem(id)).filter((i): i is CatalogItem => i?.categoria === cat);
  const frames = [getItem(FREE_FRAME)!, ...ownedOf("marco").filter((i) => i.id !== FREE_FRAME)].map((i) => opt(i));
  const titles = ownedOf("titulo").map((i) => ({ ...opt(i), name: titleLabel(i.id) ?? i.nombre }));
  const pets = ownedOf("companero").map((i) => opt(i, petImage(i.id, rank) ?? itemImage(i)));

  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Tu perfil" title="Vestidor">
        <p className="text-muted">Elige tu personaje, sus colores, tu peinado, tus accesorios y el atuendo que quieres lucir en el Gremio.</p>
      </PageTitle>
      <AvatarStudio initialBase={viewer.avatarBase} initialLook={viewer.avatarLook} rank={rank} owned={{ wear, frames, titles, pets }} />
    </div>
  );
}
