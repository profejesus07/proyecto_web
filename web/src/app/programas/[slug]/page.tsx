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
import { isAdmin } from "@/lib/roles";
import { freeUntil } from "@/lib/lessons";
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
  const free = freeUntil(c.missions);
  const color = ELEMENT_COLOR[c.element] ?? "#8a5cff";
  const storyGuardians = new Set(c.modules.length ? c.modules.map((m) => m.guardian) : [c.guardian]);
  const chapters = CHAPTERS.filter((x) => x.guardian !== null && storyGuardians.has(x.guardian)).length;
  const facts = [
    { icon: "lesson" as const, label: "Lecciones", value: String(c.missions.length) },
    c.hours ? { icon: "clock" as const, label: "Intensidad", value: c.kind === "clase" ? `${c.hours} horas al año` : `${c.hours} horas` } : null,
    c.kind === "clase" && c.grade ? { icon: "people" as const, label: "Grado", value: c.grade } : null,
    c.isFree ? null : { icon: "play" as const, label: "Primera lección", value: "Gratis" },
    c.modules.length > 1 ? { icon: "seal" as const, label: "Módulos", value: String(c.modules.length) } : null,
    { icon: "target" as const, label: "Programa completo", value: c.isFree ? "Gratis" : formatPrice(c.price) },
  ].filter((f): f is NonNullable<typeof f> => f !== null);

  return (
    <SiteShell>
      <header className="paper border-b border-line">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6">
          <nav aria-label="Ruta" className="text-sm text-muted">
            <Link href="/programas" className="hover:text-text hover:underline hover:underline-offset-4">Cursos</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-text">{c.title}</span>
          </nav>
          <section className="mt-8 grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <span className="chip">{KIND_LABEL[c.kind]}{c.area ? ` · ${c.area}` : ""}</span>
                {c.isFree && <span className="rounded-full bg-[#ffc83d] px-3 py-1 text-xs font-bold text-[#15103f]">Gratis</span>}
              </div>
              <h1 className="text-4xl leading-tight sm:text-5xl">{c.title}</h1>
              <p className="max-w-2xl text-lg text-muted">{c.summary}</p>
              <div className="flex flex-wrap gap-3 pt-1">
                {viewer && isAdmin(viewer.role) ? (
                  <Link href={`/admin/contenido/${c.slug}`} className="btn btn-primary btn-lg">Editar en la consola</Link>
                ) : viewer?.role === "docente" ? (
                  <Link href="/maestro" className="btn btn-primary btn-lg">Ir a mi panel</Link>
                ) : viewer ? (
                  <Link href={`/portales/${c.slug}`} className="btn btn-primary btn-lg">Ir al programa</Link>
                ) : (
                  <>
                    <Link href="/registro" className="btn btn-primary btn-lg">Empieza gratis</Link>
                    <Link href={`/ingresar?siguiente=${encodeURIComponent(`/portales/${c.slug}`)}`} className="btn btn-secondary btn-lg">Ya tengo cuenta</Link>
                  </>
                )}
              </div>
            </div>
            <div className="relative h-72 overflow-hidden rounded-3xl border border-line shadow-[0_24px_48px_-30px_rgb(21_16_63/0.5)]" style={{ background: `radial-gradient(70% 90% at 50% 40%, ${color}55, transparent 70%), linear-gradient(180deg, #2a1f7a, #15103f)` }}>
              <Sprite src={asset.boss(c.guardian)} alt={g ? `${g.name}, el Guardián de este programa` : "El Guardián del programa"} className="absolute bottom-0 left-1/2 h-[92%] w-auto -translate-x-1/2" />
            </div>
          </section>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <dl className={`relative -mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-[0_12px_30px_-20px_rgb(21_16_63/0.35)] sm:grid-cols-2 ${facts.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
          {facts.map((f) => (
            <div key={f.label} className="flex items-center gap-3 bg-panel p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-cyan/10 text-cyan"><Icon name={f.icon} /></span>
              <div><dt className="text-xs uppercase tracking-wider text-muted">{f.label}</dt><dd className="text-lg font-semibold">{f.value}</dd></div>
            </div>
          ))}
        </dl>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <section aria-labelledby="contenido-t" className="space-y-5">
            <h2 id="contenido-t" className="text-3xl">Contenido</h2>
            {groupByModule(c.modules, c.missions).map(({ module: mod, missions }, gi) => (
              <div key={mod?.id ?? "todas"} className="space-y-2">
                {mod && c.modules.length > 0 && (
                  <h3 className="text-lg">
                    <span className="text-cyan">Módulo {gi + 1}</span>{mod.title.trim().toLowerCase() !== `módulo ${gi + 1}` && <> · {mod.title}</>}
                    <span className="ml-2 font-sans text-sm font-normal text-muted">Guardián: {guardianBySlug(mod.guardian)?.name ?? mod.guardian}</span>
                  </h3>
                )}
                <ol className="divide-y divide-line rounded-2xl border border-line bg-panel">
                  {missions.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-cyan/10 text-sm font-semibold text-cyan">{m.position}</span>
                      <span className="flex-1 font-medium">{m.title}</span>
                      {m.position <= free && !c.isFree && <span className="rounded-md bg-gold/15 px-2 py-0.5 text-xs font-semibold text-warn">Gratis</span>}
                      {m.lessonKind === "explicacion" && <span className="rounded-md bg-cyan/10 px-2 py-0.5 text-xs font-semibold text-cyan">Explicación</span>}
                      {m.isBoss && <span className="rounded-md bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">Reto del Guardián</span>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>

          <aside className="space-y-5">
            <section aria-labelledby="incluye-t" className="rounded-2xl border border-line bg-panel p-6">
              <h2 id="incluye-t" className="text-xl">Incluye</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  "Retroalimentación inmediata en cada pregunta",
                  "Diploma del programa al superar el reto final",
                  c.kind === "curso" ? "Constancia de asistencia verificable en línea" : "Acceso durante el año lectivo",
                  chapters ? `${chapters} capítulos de las Crónicas` : null,
                  c.trainerName ? `Formador: ${c.trainerName}${c.trainerTitle ? `, ${c.trainerTitle}` : ""}` : null,
                ].filter(Boolean).map((t) => <li key={t} className="flex gap-2"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-cyan" />{t}</li>)}
              </ul>
            </section>
            {(c.modules.length > 1 ? c.modules.map((m) => guardianBySlug(m.guardian)) : [g]).filter((x, i, all) => x && all.indexOf(x) === i).map((gg) => gg && (
              <section key={gg.slug} aria-label={`Guardián ${gg.name}`} className="rounded-2xl border border-line bg-panel-2 p-6">
                <h2 className="text-xl">{c.modules.length > 1 ? `Guardián: ${gg.name}` : `El reto final: ${gg.name}`}</h2>
                <p className="mt-2 text-sm text-muted">{gg.blurb}</p>
              </section>
            ))}
            {c.kind === "curso" && <p className="text-xs text-muted">{INFORMAL_NOTICE}</p>}
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
