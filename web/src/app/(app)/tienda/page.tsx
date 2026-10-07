import type { Metadata } from "next";
import Link from "next/link";
import { AvatarFace } from "@/components/avatar-face";
import { SpeechBubble } from "@/components/dialogue";
import { BuyButton } from "@/components/profile-client";
import { Sprite } from "@/components/sprite";
import { Terrace } from "@/components/terrace";
import { PageTitle } from "@/components/ui";
import { WEARABLE_IDS } from "@/content/wearable-ids";
import { requirePlayer } from "@/lib/auth";
import { WEAR_LABEL, WEAR_SLOTS, avatarSrc, type WearSlot } from "@/lib/avatar-look";
import { CATEGORY_LABEL, RARITY, consumableRule, itemImage, petImage, priceOf, shopItems, SHOP_CATEGORIES, type CatalogItem } from "@/lib/catalog";
import { getRepo } from "@/lib/data";
import { powerByItem } from "@/lib/game/powers";
import { rankForXp } from "@/lib/game/ranks";

export const metadata: Metadata = { title: "Tienda y Arsenal" };

const INTRO: Record<string, string> = {
  ayuda: "Úsalas durante las misiones cuando una pregunta se resista.",
  poder: "Poderes para las misiones: cada uno se usa en una pregunta y tiene su efecto. Se acumulan en tu mochila.",
  cosmetico: "Capas, alas, auras, bufandas, gafas y sombreros. Después de comprarlos, póntelos en el Vestidor.",
  foco: "Un objeto mágico para llevar en la mano.",
  marco: "Un marco para tu retrato: se ve en el Gremio, en tu perfil y en el informe de tu docente.",
  companero: "Un compañero que te acompaña en el Gremio y en tu perfil. Las pieles de Kuro crecen contigo al subir de rango.",
  decoracion: "Un regalo para la Terraza del Hogar de tu familia: lo verán en su panel «Mi familia». Tú también la ves en tu perfil.",
};

/** Brann atiende cada mostrador con su gesto y una frase. */
const BRANN: Record<string, { anim: string; line: string }> = {
  ayuda: { anim: "mostrar", line: "¿Una pregunta difícil? Llévate una ayuda." },
  poder: { anim: "forjar", line: "Poderes recién forjados. Úsalos con cabeza: cada uno tiene su momento." },
  cosmetico: { anim: "mostrar", line: "¡Mira lo bien que te queda!" },
  foco: { anim: "forjar", line: "Recién salidos de mi yunque." },
  marco: { anim: "forjar", line: "Un buen retrato merece un buen marco." },
  companero: { anim: "saludar", line: "Estos amigos buscan con quién aventurarse." },
  decoracion: { anim: "mostrar", line: "¿Un detalle para la terraza de tu familia? Les va a encantar." },
};

const slotOf = (id: string): WearSlot | undefined => WEAR_SLOTS.find((s) => (WEARABLE_IDS[s] as readonly string[]).includes(id));

export default async function ShopPage({ searchParams }: PageProps<"/tienda">) {
  const viewer = await requirePlayer("/tienda");
  const sp = await searchParams;
  const cat = typeof sp.c === "string" && (SHOP_CATEGORIES as readonly string[]).includes(sp.c) ? sp.c : "ayuda";
  const repo = getRepo();
  const [inventory, stock] = await Promise.all([repo.getInventory(viewer.id), repo.getConsumables(viewer.id)]);
  const owned = new Set(inventory.map((i) => i.itemId));
  const rank = rankForXp(viewer.xp).key;
  const all = shopItems();
  const items = all.filter((i) => i.categoria === cat).sort((a, b) => (priceOf(a) ?? 0) - (priceOf(b) ?? 0));
  // Los cosméticos se agrupan por lugar (capas, alas…); el resto va en un solo grupo.
  const groups: { title: string | null; items: CatalogItem[] }[] = cat === "cosmetico"
    ? WEAR_SLOTS.map((s) => ({ title: WEAR_LABEL[s], items: items.filter((i) => slotOf(i.id) === s) })).filter((g) => g.items.length)
    : [{ title: null, items }];

  function preview(it: CatalogItem) {
    const slot = slotOf(it.id);
    if (slot) {
      const src = avatarSrc(viewer.avatarBase, rank, { ...viewer.avatarLook, wear: { ...viewer.avatarLook.wear, [slot]: it.id } });
      return <Sprite src={src} alt={`Así te queda: ${it.nombre}`} className="absolute inset-0 size-full object-contain p-1" />;
    }
    if (it.categoria === "marco") return <AvatarFace base={viewer.avatarBase} rank={rank} look={{ ...viewer.avatarLook, frame: it.id }} size={76} />;
    if (it.categoria === "decoracion") return <Terrace decor={[it.id]} className="!rounded-lg" />;
    const pw = powerByItem(it.id);
    if (pw) return <Sprite src={pw.fx} alt={`Efecto de ${pw.name}`} className="absolute inset-0 size-full object-contain" />;
    if (it.categoria === "companero") return <Sprite src={petImage(it.id, rank) ?? itemImage(it)} alt={it.alt} className="absolute inset-0 size-full object-contain p-2" />;
    return <Sprite src={itemImage(it)} alt={it.alt} className="size-24" />;
  }

  return (
    <div className="space-y-8">
      <section className="panel relative isolate overflow-hidden rounded-3xl" aria-label="Forja de Brann">
        <Sprite src="/assets/escenarios/tienda/tienda-forja.svg" alt="" decorative priority className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/95 via-bg/70 to-bg/10" />
        <div className="flex items-end justify-between gap-4 p-6 sm:p-8">
          <div className="space-y-4 md:max-w-lg">
            <PageTitle eyebrow="Forja de Brann" title="Tienda y Arsenal">
              <p className="text-text/80">Cambia tus monedas por ayudas, accesorios y compañeros. Las monedas se ganan completando misiones; nunca se compran con dinero.</p>
            </PageTitle>
            <p className="chip w-fit text-base" aria-label={`Tienes ${viewer.coins} monedas`}>🪙 {viewer.coins} monedas</p>
          </div>
          <Sprite src={`/assets/personajes/brann/brann-${BRANN[cat].anim}.svg`} alt="La Forjadora Brann" className="hidden h-56 w-auto shrink-0 sm:block" />
        </div>
      </section>

      <nav aria-label="Categorías" className="flex flex-wrap gap-2">
        {SHOP_CATEGORIES.filter((c) => all.some((i) => i.categoria === c)).map((c) => (
          <Link key={c} href={`/tienda?c=${c}`} aria-current={c === cat ? "page" : undefined}
            className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition ${c === cat ? "border-cyan bg-cyan/15 text-cyan" : "border-line text-muted hover:border-line-fuerte hover:text-text"}`}>
            {CATEGORY_LABEL[c]}
          </Link>
        ))}
      </nav>

      <SpeechBubble name="Forjadora Brann" src={`/assets/personajes/brann/brann-${BRANN[cat].anim}.svg`} alt="La Forjadora Brann" tone="gold" auto>
        {BRANN[cat].line} <span className="text-muted">{INTRO[cat]}</span>
      </SpeechBubble>

      {groups.map((g) => (
        <section key={g.title ?? "todo"} aria-label={g.title ?? CATEGORY_LABEL[cat]} className="space-y-3">
          {g.title && <h2 className="text-xl">{g.title}</h2>}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {g.items.map((it) => {
              const r = RARITY[it.rareza];
              const price = priceOf(it)!;
              const aid = consumableRule(it.id);
              const wearable = !!slotOf(it.id) || it.categoria === "marco" || it.categoria === "companero";
              const decor = it.categoria === "decoracion";
              return (
                <li key={it.id} className="panel flex flex-col gap-3 p-4" style={{ borderColor: `${r.color}55` }}>
                  <div className="relative grid h-40 place-items-center overflow-hidden rounded-xl bg-bg/40 p-2">
                    {preview(it)}
                    {(slotOf(it.id) || it.categoria === "decoracion" || it.categoria === "poder") && <Sprite src={itemImage(it)} alt="" decorative className="absolute right-1 top-1 size-12" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[0.7rem] font-bold uppercase tracking-wider" style={{ color: r.color }}>{r.label}</p>
                    <h3 className="text-lg leading-tight">{it.nombre}</h3>
                    <p className="text-sm text-muted">{powerByItem(it.id)?.effect ?? it.descripcion}</p>
                  </div>
                  <div className="mt-auto">{aid ? (
                    <BuyButton itemId={it.id} price={price} coins={viewer.coins} owned={false}
                      stack={{ have: stock[it.id] ?? 0, max: aid.maxStock, dailyCap: aid.dailyCap, locked: viewer.xp < aid.minXp ? aid.minRank : null }} />
                  ) : (
                    <BuyButton itemId={it.id} price={price} coins={viewer.coins} owned={owned.has(it.id)}
                      use={wearable ? { href: "/perfil/avatar", label: "🎨 Póntelo en el Vestidor" } : decor ? { href: "/perfil#familia-t", label: "🏡 Ver la terraza" } : undefined} />
                  )}</div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {items.length === 0 && <p className="panel p-6 text-muted">No hay objetos en esta categoría todavía.</p>}
    </div>
  );
}
