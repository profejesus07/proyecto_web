import type { Metadata } from "next";
import Link from "next/link";
import { AvatarPicker } from "@/components/profile-client";
import { Sprite, asset } from "@/components/sprite";
import { ItemTile, PageTitle, RankCard, Stat } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { allItems, getItem, type CatalogItem } from "@/lib/catalog";
import { getRepo } from "@/lib/data";
import { rankProgress } from "@/lib/game/ranks";

export const metadata: Metadata = { title: "Tu perfil" };

const SECTIONS: { key: string; title: string; cats: string[]; showMissing?: boolean; empty: string }[] = [
  { key: "recompensas", title: "Recompensas de Guardianes", cats: ["recompensa"], showMissing: true, empty: "Vence a un Guardián para conseguir la primera." },
  { key: "titulos", title: "Títulos", cats: ["titulo"], empty: "Los títulos se ganan al vencer Guardianes y explorar." },
  { key: "insignias", title: "Insignias y rangos", cats: ["rango", "insignia"], showMissing: true, empty: "Completa tu primera misión para empezar tu colección." },
  { key: "sellos", title: "Sellos y certificados", cats: ["sello", "certificado"], empty: "Termina un portal para recibir su sello y tu certificado." },
  { key: "tienda", title: "Tus compras", cats: ["poder", "ayuda", "marco", "cosmetico", "foco", "decoracion", "equipo", "companero"], empty: "Visita la tienda para conseguir poderes y ayudas." },
];

export default async function ProfilePage() {
  const viewer = await requireViewer("/perfil");
  const inventory = await getRepo().getInventory(viewer.id);
  const owned = new Set(inventory.map((i) => i.itemId));
  const p = rankProgress(viewer.xp);

  const ownedItems = inventory.map((i) => getItem(i.itemId)).filter((i): i is CatalogItem => !!i);
  const hasCertificate = owned.has("obj_certificado_portal");

  return (
    <div className="space-y-8">
      <section className="panel panel-glow relative isolate grid gap-6 overflow-hidden rounded-3xl p-6 sm:p-8 md:grid-cols-[auto_1fr]">
        <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(50% 80% at 12% 50%, ${p.rank.color}30, transparent 70%)` }} />
        <div className="mx-auto flex h-64 w-44 items-end justify-center md:h-72 md:w-52">
          <Sprite src={asset.avatar(viewer.avatarBase, p.rank.key)} alt={`Tu avatar, rango ${p.rank.key}`} priority className="h-full w-auto" />
        </div>
        <div className="space-y-5 self-center">
          <PageTitle eyebrow="Tu perfil" title={viewer.displayName} />
          <p className="text-muted">Rango {p.rank.key} · {p.rank.name}</p>
          <AvatarPicker current={viewer.avatarBase} rank={p.rank.key} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <RankCard xp={viewer.xp} />
        <Stat icon="🪙" label="Monedas" value={viewer.coins} />
        <Stat icon="💎" label="Gemas" value={viewer.gems} />
        <Stat icon="🔥" label={viewer.streak === 1 ? "Día de racha" : "Días de racha"} value={viewer.streak} />
      </div>

      {hasCertificate && (
        <section className="panel flex flex-wrap items-center gap-4 p-5" aria-label="Certificado">
          <Sprite src="/assets/objetos/certificado/obj_certificado_portal.svg" alt="Certificado Sello del Portal" className="h-24 w-auto" />
          <div className="flex-1">
            <p className="font-display text-xl font-bold">¡Tienes un certificado!</p>
            <p className="text-sm text-muted">Completaste un portal entero. Pronto podrás descargarlo con tu nombre.</p>
          </div>
        </section>
      )}

      {SECTIONS.map((s) => {
        const mine = ownedItems.filter((i) => s.cats.includes(i.categoria));
        const missing = s.showMissing ? allItems().filter((i) => s.cats.includes(i.categoria) && !owned.has(i.id)) : [];
        const total = mine.length + missing.length;
        return (
          <section key={s.key} className="space-y-4" aria-labelledby={`sec-${s.key}`}>
            <div className="flex items-end justify-between gap-3">
              <h2 id={`sec-${s.key}`} className="text-2xl">{s.title}</h2>
              {s.showMissing && <p className="text-sm font-semibold text-muted">{mine.length} de {total}</p>}
            </div>
            {mine.length === 0 && missing.length === 0 ? (
              <p className="panel p-5 text-muted">{s.empty}</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {mine.map((it) => <li key={it.id}><ItemTile item={it} /></li>)}
                {missing.map((it) => <li key={it.id}><ItemTile item={it} owned={false} /></li>)}
              </ul>
            )}
            {mine.length === 0 && missing.length > 0 && <p className="text-sm text-muted">{s.empty}</p>}
          </section>
        );
      })}

      <p className="text-center text-sm text-muted">¿Quieres más poderes y ayudas? <Link href="/tienda" className="font-semibold text-cyan underline underline-offset-4">Visita la tienda</Link></p>
    </div>
  );
}
