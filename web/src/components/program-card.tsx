import Link from "next/link";
import { Icon } from "@/components/icons";
import { Sprite, asset } from "@/components/sprite";
import { ELEMENT_COLOR, guardianBySlug } from "@/content/guardians";
import { KIND_LABEL } from "@/lib/content";
import type { CatalogItem } from "@/lib/data/queries";

/** Tarjeta de un programa en el catálogo público. */
export function ProgramCard({ c }: { c: CatalogItem }) {
  const color = ELEMENT_COLOR[c.element] ?? "#8a5cff";
  const g = guardianBySlug(c.guardian);
  const meta = [KIND_LABEL[c.kind], c.kind === "curso" && c.hours ? `${c.hours} h` : c.grade ? `Grado ${c.grade}` : c.area].filter(Boolean).join(" · ");
  return (
    <li className="lift group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-panel">
      <div className="relative h-44 overflow-hidden" style={{ background: `radial-gradient(80% 120% at 75% 30%, ${color}66, transparent 70%), linear-gradient(160deg, #2c2185, #14123b)` }}>
        <Sprite src={asset.boss(c.guardian)} alt="" decorative className="absolute -bottom-3 right-2 h-[118%] w-auto transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#14123b]">{meta}</span>
        {c.isFree && <span className="absolute right-3 top-3 rounded-full bg-[#ffc83d] px-2.5 py-1 text-xs font-extrabold text-[#14123b]">Gratis</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-extrabold leading-snug">
          <Link href={`/programas/${c.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">{c.title}</Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted">{c.summary}</p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
          <span className="inline-flex items-center gap-1.5 text-muted"><Icon name="lesson" className="size-4" /> {c.lessons} {c.lessons === 1 ? "lección" : "lecciones"}{g ? ` · ${g.name}` : ""}</span>
          <span className="grid size-8 place-items-center rounded-full bg-[var(--cyan)]/10 text-[var(--cyan)] transition group-hover:bg-[var(--cyan)] group-hover:text-white" aria-hidden="true">
            <Icon name="arrow" className="size-4" />
          </span>
        </div>
      </div>
    </li>
  );
}
