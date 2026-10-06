import Link from "next/link";
import { Icon } from "@/components/icons";
import { Sprite, asset } from "@/components/sprite";
import { ELEMENT_COLOR } from "@/content/guardians";
import { KIND_LABEL } from "@/lib/content";
import { formatPrice, type CatalogItem } from "@/lib/data/queries";

/** Tarjeta de un curso en el sitio público: ilustración del Guardián, datos clave y precio. */
export function ProgramCard({ c }: { c: CatalogItem }) {
  const color = ELEMENT_COLOR[c.element] ?? "#8a5cff";
  const meta = [c.kind === "clase" ? (c.grade ? `Grado ${c.grade}` : c.area) : c.area, c.hours ? `${c.hours} h` : null].filter(Boolean).join(" · ");
  return (
    <li className="lift group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
      <div className="relative h-40 overflow-hidden border-b border-line" style={{ background: `radial-gradient(90% 120% at 80% 20%, ${color}40, transparent 70%), linear-gradient(160deg, #f7f6fb, #ece8fb)` }}>
        <Sprite src={asset.boss(c.guardian)} alt="" decorative className="absolute -bottom-2 right-3 h-[112%] w-auto transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#15103f] shadow-sm">{KIND_LABEL[c.kind]}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {meta && <p className="text-xs font-semibold uppercase tracking-wider text-muted">{meta}</p>}
        <h3 className="text-xl leading-snug">
          <Link href={`/programas/${c.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">{c.title}</Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted">{c.summary}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
          <span className="inline-flex items-center gap-1.5 text-muted"><Icon name="lesson" className="size-4" /> {c.lessons} {c.lessons === 1 ? "lección" : "lecciones"}</span>
          {c.isFree ? (
            <span className="rounded-md bg-[#ffc83d] px-2 py-0.5 text-xs font-bold text-[#15103f]">Gratis</span>
          ) : (
            <span className="font-semibold">{c.price === null ? "1.ª lección gratis" : formatPrice(c.price)}</span>
          )}
        </div>
      </div>
    </li>
  );
}
