import Link from "next/link";
import { Sprite } from "@/components/sprite";
import { RARITY, itemImage, type CatalogItem } from "@/lib/catalog";
import { rankProgress } from "@/lib/game/ranks";

export function RankCard({ xp }: { xp: number }) {
  const p = rankProgress(xp);
  return (
    <section className="panel flex items-center gap-4 p-5" aria-label="Tu rango">
      <span className="grid size-16 shrink-0 place-items-center rounded-2xl font-display text-3xl font-extrabold" style={{ background: p.rank.color, color: "var(--ink)" }} aria-hidden="true">{p.rank.key}</span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-display text-xl font-bold leading-tight">Rango {p.rank.key} · {p.rank.name}</p>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.pct} aria-label="Avance hacia el siguiente rango"><i style={{ width: `${p.pct}%` }} /></div>
        <p className="text-sm text-muted">
          {p.next ? <>{xp} XP · faltan <strong className="text-text">{p.remaining} XP</strong> para el rango {p.next.key}</> : <>{xp} XP · ¡rango máximo!</>}
        </p>
      </div>
    </section>
  );
}

export function Stat({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="panel flex items-center gap-3 p-4">
      <span className="grid size-11 place-items-center rounded-xl bg-white/5 text-2xl" aria-hidden="true">{icon}</span>
      <div>
        <p className="font-display text-2xl font-extrabold leading-none">{value}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      </div>
    </div>
  );
}

export function ItemTile({ item, owned = true, size = "md" }: { item: CatalogItem; owned?: boolean; size?: "sm" | "md" }) {
  const r = RARITY[item.rareza];
  return (
    <figure className="panel flex flex-col items-center gap-2 p-3 text-center" style={{ borderColor: `${r.color}66` }} title={item.descripcion}>
      <Sprite src={itemImage(item)} alt={item.alt} className={`${size === "sm" ? "size-16" : "size-24"} ${owned ? "" : "opacity-40 grayscale"}`} />
      <figcaption className="space-y-0.5">
        <span className="block text-sm font-bold leading-tight">{item.nombre}</span>
        <span className="block text-[0.7rem] font-bold uppercase tracking-wider" style={{ color: r.color }}>{r.label}</span>
      </figcaption>
    </figure>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="text-4xl sm:text-5xl">{title}</h1>
      {children && <div className="max-w-2xl text-muted">{children}</div>}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-text">
      <span aria-hidden="true">←</span> {children}
    </Link>
  );
}
