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
  const meta = [KIND_LABEL[c.kind], c.kind === "curso" && c.hours ? `${c.hours} horas` : c.grade ? `Grado ${c.grade}` : c.area].filter(Boolean).join(" · ");
  return (
    <li className="group relative flex flex-col overflow-hidden rounded-2xl border border-line/70 bg-panel/60 transition hover:-translate-y-0.5 hover:border-[#4a43a0]">
      <div className="relative h-40 overflow-hidden" style={{ background: `radial-gradient(80% 120% at 80% 30%, ${color}40, transparent 70%), linear-gradient(180deg, #1b1745, #14123b)` }}>
        <Sprite src={asset.boss(c.guardian)} alt="" decorative className="absolute -bottom-3 right-3 h-[115%] w-auto opacity-90 transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-bg/60 px-3 py-1 text-xs font-semibold backdrop-blur">{meta}</span>
        {c.isFree && <span className="absolute right-4 top-4 rounded-full bg-green px-3 py-1 text-xs font-extrabold text-ink">Gratis</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-xl">
          <Link href={`/programas/${c.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">{c.title}</Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted">{c.summary}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-sm">
          <span className="inline-flex items-center gap-1.5 text-muted"><Icon name="lesson" className="size-4" /> {c.lessons} {c.lessons === 1 ? "lección" : "lecciones"}{g ? ` · ${g.name}` : ""}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-cyan">Ver <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
        </div>
      </div>
    </li>
  );
}
