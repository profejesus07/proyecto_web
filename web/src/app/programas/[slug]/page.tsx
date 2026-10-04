import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { SiteShell } from "@/components/site-header";
import { Sprite, asset } from "@/components/sprite";
import { CHAPTERS } from "@/content/cronicas";
import { ELEMENT_COLOR, guardianBySlug } from "@/content/guardians";
import { getViewer } from "@/lib/auth";
import { INFORMAL_NOTICE, KIND_LABEL } from "@/lib/content";
import { getRepo } from "@/lib/data";
import { formatPrice } from "@/lib/data/queries";
import { groupByModule } from "@/lib/modules";
import type { CourseDetail } from "@/lib/data/types";

async function load(slug: string): Promise<CourseDetail | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  try {
    return await getRepo().getCourse(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps<"/programas/[slug]">): Promise<Metadata> {
  const c = await load((await params).slug);
  return c ? { title: c.title, description: c.summary } : { title: "Programa" };
}

export default async function ProgramPage({ params }: PageProps<"/programas/[slug]">) {
  const { slug } = await params;
  const [c, viewer] = await Promise.all([load(slug), getViewer()]);
  if (!c) notFound();
  const g = guardianBySlug(c.guardian);
  const color = ELEMENT_COLOR[c.element] ?? "#8a5cff";
  const storyGuardians = new Set(c.modules.length ? c.modules.map((m) => m.guardian) : [c.guardian]);
  const chapters = CHAPTERS.filter((x) => x.guardian !== null && storyGuardians.has(x.guardian)).length;
  const facts = [
    { icon: "lesson" as const, label: "Lecciones", value: String(c.missions.length) },
    c.kind === "curso" && c.hours ? { icon: "clock" as const, label: "Intensidad", value: `${c.hours} horas` } : null,
    c.kind === "clase" && c.grade ? { icon: "people" as const, label: "Grado", value: c.grade } : null,
    c.isFree ? null : { icon: "play" as const, label: "Primera lección", value: "Gratis" },
    c.modules.length > 1 ? { icon: "seal" as const, label: "Módulos", value: String(c.modules.length) } : null,
    { icon: "target" as const, label: "Programa completo", value: c.isFree ? "Gratis" : formatPrice(c.price) },
  ].filter((f): f is NonNullable<typeof f> => f !== null);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6">
        <Link href="/programas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-text">
          <Icon name="arrow" className="size-4 rotate-180" /> Todos los programas
        </Link>

        <section className="mt-6 grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-5">
            <p className="eyebrow">{KIND_LABEL[c.kind]}{c.area ? ` · ${c.area}` : ""}</p>
            <h1 className="text-5xl font-extrabold sm:text-6xl">{c.title}</h1>
            <p className="text-lg text-muted">{c.summary}</p>
            <div className="flex flex-wrap gap-3">
              {viewer ? (
                <Link href={`/portales/${c.slug}`} className="btn btn-primary btn-lg">Ir al programa</Link>
              ) : (
                <>
                  <Link href="/registro" className="btn btn-primary btn-lg">Empieza gratis</Link>
                  <Link href={`/ingresar?siguiente=${encodeURIComponent(`/portales/${c.slug}`)}`} className="btn btn-ghost btn-lg">Ya tengo cuenta</Link>
                </>
              )}
            </div>
          </div>
          <div className="relative h-72 overflow-hidden rounded-[2rem] border border-line/70" style={{ background: `radial-gradient(70% 90% at 50% 40%, ${color}45, transparent 70%), linear-gradient(180deg, #1b1745, #14123b)` }}>
            <Sprite src={asset.boss(c.guardian)} alt={g ? `${g.name}, el Guardián de este programa` : "El Guardián del programa"} className="absolute bottom-0 left-1/2 h-[92%] w-auto -translate-x-1/2" />
          </div>
        </section>

        <dl className={`mt-12 grid gap-px overflow-hidden rounded-2xl border border-line/70 bg-line/50 sm:grid-cols-2 ${facts.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
          {facts.map((f) => (
            <div key={f.label} className="flex items-center gap-3 bg-bg-2 p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-cyan/10 text-cyan"><Icon name={f.icon} /></span>
              <div><dt className="text-xs uppercase tracking-wider text-muted">{f.label}</dt><dd className="font-display text-lg font-bold">{f.value}</dd></div>
            </div>
          ))}
        </dl>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <section aria-labelledby="contenido-t" className="space-y-4">
            <h2 id="contenido-t" className="text-2xl">Contenido</h2>
            {groupByModule(c.modules, c.missions).map(({ module: mod, missions }, gi) => (
              <div key={mod?.id ?? "todas"} className="space-y-2">
                {mod && c.modules.length > 0 && (
                  <h3 className="text-lg">
                    <span className="text-muted">Módulo {gi + 1} · </span>{mod.title}
                    <span className="ml-2 text-sm font-normal text-muted">Guardián: {guardianBySlug(mod.guardian)?.name ?? mod.guardian}</span>
                  </h3>
                )}
                <ol className="divide-y divide-line/70 rounded-2xl border border-line/70 bg-panel/40">
                  {missions.map((m) => (
                    <li key={m.id} className="flex items-center gap-4 px-5 py-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line font-display text-sm font-bold text-muted">{m.position}</span>
                      <span className="flex-1 font-medium">{m.title}</span>
                      {m.position === 1 && !c.isFree && <span className="rounded-full bg-[#1f8a4c]/10 px-2.5 py-0.5 text-xs font-semibold text-[#1f8a4c]">Gratis</span>}
                      {m.isBoss && <span className="rounded-full bg-[#e2a019]/15 px-2.5 py-0.5 text-xs font-semibold text-[#8a5a00]">Reto del Guardián</span>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>

          <aside className="space-y-5">
            {(c.modules.length > 1 ? c.modules.map((m) => guardianBySlug(m.guardian)) : [g]).filter((x, i, all) => x && all.indexOf(x) === i).map((gg) => gg && (
              <section key={gg.slug} aria-label={`Guardián ${gg.name}`} className="rounded-2xl border border-line/70 bg-panel/40 p-6">
                <h2 className="text-xl">{c.modules.length > 1 ? `Guardián: ${gg.name}` : `El reto final: ${gg.name}`}</h2>
                <p className="mt-2 text-muted">{gg.blurb}</p>
                <p className="mt-3 text-sm"><span className="text-muted">Representa: </span><strong>{gg.obstacle}</strong></p>
                <p className="text-sm"><span className="text-muted">Se supera con: </span><strong>{gg.weakness}</strong></p>
              </section>
            ))}
            <section aria-labelledby="incluye-t" className="rounded-2xl border border-line/70 bg-panel/40 p-6">
              <h2 id="incluye-t" className="text-xl">Incluye</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  "Retroalimentación inmediata en cada pregunta",
                  "Diploma del programa al superar el reto final",
                  c.kind === "curso" ? "Constancia de asistencia verificable en línea" : "Acceso durante el año lectivo",
                  chapters ? `${chapters} capítulos de las Crónicas` : null,
                  "Actividades variadas: selección, verdadero o falso, completar, ordenar y relacionar",
                  c.trainerName ? `Formador: ${c.trainerName}${c.trainerTitle ? `, ${c.trainerTitle}` : ""}` : null,
                ].filter(Boolean).map((t) => <li key={t} className="flex gap-2"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-cyan" />{t}</li>)}
              </ul>
            </section>
            {c.kind === "curso" && <p className="text-xs text-muted">{INFORMAL_NOTICE}</p>}
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
