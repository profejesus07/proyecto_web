import type { Metadata } from "next";
import Link from "next/link";
import { Sprite, asset } from "@/components/sprite";
import { PageTitle } from "@/components/ui";
import { ELEMENT_COLOR, ELEMENT_LABEL, guardianBySlug } from "@/content/guardians";
import { requireViewer } from "@/lib/auth";
import { INFORMAL_NOTICE } from "@/lib/content";
import { type CourseView, formatPrice, loadCourseViews } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Sala de Portales" };

const STATUS = {
  nuevo: { label: "Nuevo", cls: "bg-gold text-ink" },
  "en-curso": { label: "En curso", cls: "bg-cyan text-ink" },
  completado: { label: "Completado", cls: "bg-green text-ink" },
} as const;

function PortalCard({ c }: { c: CourseView }) {
  const color = ELEMENT_COLOR[c.element];
  const g = guardianBySlug(c.guardian);
  const st = STATUS[c.status];
  const eyebrow = c.kind === "clase"
    ? [c.area, c.grade, c.schoolYear].filter(Boolean).join(" · ") || "Clase"
    : `Curso corto${c.hours ? ` · ${c.hours} horas` : ""}`;
  return (
    <Link href={`/portales/${c.slug}`} className="panel group flex h-full flex-col overflow-hidden transition hover:-translate-y-1" style={{ borderColor: `${color}77` }}>
      <div className="relative grid h-44 place-items-center overflow-hidden" style={{ background: `radial-gradient(circle at 50% 60%, ${color}44, transparent 70%)` }}>
        <span className="absolute size-36 rounded-full border-[6px] opacity-80" style={{ borderColor: color, boxShadow: `0 0 40px ${color}88, inset 0 0 30px ${color}55` }} aria-hidden="true" />
        <Sprite src={asset.boss(c.guardian)} alt={`${g?.name ?? "Guardián"}, guardián de este portal`} className="relative h-36 w-auto transition-transform duration-300 group-hover:scale-110" />
        <span className={`absolute right-3 top-3 rounded-lg px-2 py-0.5 text-xs font-extrabold ${st.cls}`}>{st.label}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{eyebrow} · {ELEMENT_LABEL[c.element]}</p>
        <h3 className="text-xl">{c.title}</h3>
        <p className="text-sm text-muted">{c.summary}</p>
        <p className={`w-fit rounded-lg px-2.5 py-1 text-xs font-bold ${c.hasAccess ? "bg-green/15 text-[#b6f5cb]" : "bg-gold/15 text-[#ffe3a0]"}`}>
          {c.hasAccess ? (c.kind === "clase" ? "✔ Acceso anual activo" : "✔ Curso completo") : `Lección 1 gratis · ${c.kind === "clase" ? "año completo" : "completo"}: ${formatPrice(c.price)}`}
        </p>
        <div className="mt-auto space-y-2 pt-2">
          <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={c.total} aria-valuenow={c.done} aria-label="Lecciones completadas"><i style={{ width: `${(c.done / Math.max(c.total, 1)) * 100}%` }} /></div>
          <p className="text-sm font-semibold">{c.done} de {c.total} lecciones</p>
        </div>
      </div>
    </Link>
  );
}

export default async function PortalsPage() {
  const viewer = await requireViewer("/portales");
  const courses = await loadCourseViews(viewer.id);
  const scene = courses.every((c) => c.status === "completado") && courses.length ? "completado" : courses.some((c) => c.status !== "nuevo") ? "mixto" : "disponible";
  const clases = courses.filter((c) => c.kind === "clase");
  const cursos = courses.filter((c) => c.kind === "curso");

  return (
    <div className="space-y-10">
      <section className="panel relative isolate overflow-hidden rounded-3xl" aria-label="Sala de Portales">
        <Sprite src={asset.scene("portales", scene)} alt="" decorative priority className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/90 via-bg/55 to-transparent" />
        <div className="p-6 sm:p-10 md:max-w-md">
          <PageTitle eyebrow="Catálogo" title="Sala de Portales">
            <p className="text-text/80">Cada portal es una clase o un curso. Elige uno, supera sus lecciones y enfrenta a su Guardián.</p>
          </PageTitle>
        </div>
        <div className="h-24 sm:h-36" />
      </section>

      {clases.length > 0 && (
        <section aria-labelledby="clases-t" className="space-y-4">
          <div>
            <h2 id="clases-t" className="text-2xl">Clases</h2>
            <p className="text-sm text-muted">Por área y periodo académico. Acceso por año lectivo.</p>
          </div>
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {clases.map((c) => <li key={c.slug}><PortalCard c={c} /></li>)}
          </ul>
        </section>
      )}

      <section aria-labelledby="cursos-t" className="space-y-4">
        <div>
          <h2 id="cursos-t" className="text-2xl">Cursos cortos</h2>
          <p className="text-sm text-muted">{INFORMAL_NOTICE}</p>
        </div>
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cursos.map((c) => <li key={c.slug}><PortalCard c={c} /></li>)}
          <li>
            <div className="panel flex h-full min-h-72 flex-col items-center justify-center gap-3 border-dashed p-6 text-center opacity-80">
              <span className="grid size-20 place-items-center rounded-full border-[6px] border-line text-3xl" aria-hidden="true">🔒</span>
              <h3 className="text-xl">Próximo portal</h3>
              <p className="text-sm text-muted">Pronto se abrirá un nuevo portal. Mientras tanto, sigue subiendo de rango.</p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
