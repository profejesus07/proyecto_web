import type { Metadata } from "next";
import Link from "next/link";
import { BuyButton } from "@/components/profile-client";
import { Sprite } from "@/components/sprite";
import { PageTitle } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { CATEGORY_LABEL, RARITY, itemImage, priceOf, shopItems, SHOP_CATEGORIES } from "@/lib/catalog";
import { getRepo } from "@/lib/data";
import { SHOP_OPEN } from "@/lib/features";

export const metadata: Metadata = { title: "Tienda y Arsenal" };

export default async function ShopPage({ searchParams }: PageProps<"/tienda">) {
  const viewer = await requireViewer("/tienda");
  const sp = await searchParams;
  const cat = typeof sp.c === "string" && (SHOP_CATEGORIES as readonly string[]).includes(sp.c) ? sp.c : "poder";
  const inventory = await getRepo().getInventory(viewer.id);
  const owned = new Set(inventory.map((i) => i.itemId));
  const all = shopItems();
  const items = all.filter((i) => i.categoria === cat).sort((a, b) => (priceOf(a) ?? 0) - (priceOf(b) ?? 0));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow="Forja de Brann" title="Tienda y Arsenal">
          <p>Cambia tus monedas por poderes, ayudas y recompensas. Las monedas se ganan completando misiones.</p>
        </PageTitle>
        <p className="chip text-base" aria-label={`Tienes ${viewer.coins} monedas`}>🪙 {viewer.coins} monedas</p>
      </div>

      {!SHOP_OPEN && (
        <p role="note" className="panel flex items-start gap-3 !border-gold/50 p-4 text-[#ffe3a0]">
          <span aria-hidden="true">🛠️</span>
          <span><strong>Brann está preparando la forja.</strong> Ya puedes ver todo lo que vendrá. Las compras se abrirán cuando estos objetos ya funcionen dentro de las misiones, y tus monedas te estarán esperando.</span>
        </p>
      )}

      <nav aria-label="Categorías" className="flex flex-wrap gap-2">
        {SHOP_CATEGORIES.filter((c) => all.some((i) => i.categoria === c)).map((c) => (
          <Link key={c} href={`/tienda?c=${c}`} aria-current={c === cat ? "page" : undefined}
            className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition ${c === cat ? "border-cyan bg-cyan/15 text-cyan" : "border-line text-muted hover:border-[#5a52b8] hover:text-text"}`}>
            {CATEGORY_LABEL[c]}
          </Link>
        ))}
      </nav>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => {
          const r = RARITY[it.rareza];
          const price = priceOf(it)!;
          return (
            <li key={it.id} className="panel flex flex-col gap-3 p-4" style={{ borderColor: `${r.color}55` }}>
              <div className="grid h-32 place-items-center rounded-xl bg-bg/40">
                <Sprite src={itemImage(it)} alt={it.alt} className="size-24" />
              </div>
              <div className="space-y-1">
                <p className="text-[0.7rem] font-bold uppercase tracking-wider" style={{ color: r.color }}>{r.label}</p>
                <h2 className="text-lg leading-tight">{it.nombre}</h2>
                <p className="text-sm text-muted">{it.descripcion}</p>
              </div>
              <div className="mt-auto"><BuyButton itemId={it.id} price={price} coins={viewer.coins} owned={owned.has(it.id)} open={SHOP_OPEN} /></div>
            </li>
          );
        })}
      </ul>
      {items.length === 0 && <p className="panel p-6 text-muted">No hay objetos en esta categoría todavía.</p>}
    </div>
  );
}
