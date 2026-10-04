import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sprite, asset } from "@/components/sprite";
import { BackLink } from "@/components/ui";
import { ELEMENT_COLOR, ELEMENT_LABEL, guardianBySlug } from "@/content/guardians";
import { requireViewer } from "@/lib/auth";
import { CHAPTERS, isUnlocked, missionKey } from "@/content/cronicas";
import { formatPrice, loadCourseView, type MissionView } from "@/lib/data/queries";

export async function generateMetadata({ params }: PageProps<"/portales/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ") };
}

export default async function CoursePage({ params }: PageProps<"/portales/[slug]">) {
  const { slug } = await params;
  const viewer = await requireViewer(`/portales/${slug}`);
  const course = await loadCourseView(viewer.id, slug);
  if (!course) notFound();
  const color = ELEMENT_COLOR[course.element];
  const g = guardianBySlug(course.guardian);
  const normal = course.missions.filter((m) => !m.isBoss);
  const boss = course.missions.find((m) => m.isBoss);
  const done = new Set(course.missions.filter((m) => m.state === "completada").map((m) => missionKey(course.slug, m.position)));
  const chapters = CHAPTERS.filter((c) => c.course === course.slug);

  return (
    <div className="space-y-8">
      <BackLink href="/portales">Sala de Portales</BackLink>

      <header className="panel relative isolate grid gap-6 overflow-hidden p-6 sm:p-8 md:grid-cols-[1fr_auto]" style={{ borderColor: `${color}88` }}>
        <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(60% 90% at 90% 50%, ${color}30, transparent 70%)` }} />
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>Portal de {ELEMENT_LABEL[course.element]}</p>
          <h1 className="text-4xl sm:text-5xl">{course.title}</h1>
          <p className="max-w-2xl text-lg text-muted">{course.summary}</p>
          <div className="max-w-md space-y-2 pt-2">
            <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={course.total} aria-valuenow={course.done} aria-label="Misiones completadas"><i style={{ width: `${(course.done / Math.max(course.total, 1)) * 100}%` }} /></div>
            <p className="text-sm font-semibold">{course.done} de {course.total} misiones{course.bossDefeated ? " · ¡Guardián vencido!" : ""}</p>
          </div>
        </div>
        <Sprite src={asset.boss(course.guardian)} alt={`${g?.name ?? "El Guardián"} custodia este portal`} className="mx-auto h-48 w-auto md:h-56" />
      </header>

      {!course.hasAccess && (
        <div role="note" className={`panel flex flex-wrap items-center gap-4 p-5 ${course.needsSubscription ? "panel-glow !border-gold/60" : "!border-gold/40"}`}>
          <span aria-hidden="true" className="text-4xl">🔑</span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-display text-xl font-bold">{course.needsSubscription ? "¡Superaste la lección gratis!" : "La primera lección es gratis"}</p>
            <p className="text-muted">
              Suscríbete a este curso para abrir todas sus misiones y enfrentar a {g?.name ?? "su Guardián"}. Curso completo: <strong className="text-text">{formatPrice(course.price)}</strong>.
            </p>
          </div>
          <Link href={`/suscribirse/${course.slug}`} className="btn btn-primary">Desbloquear el curso</Link>
        </div>
      )}

      <section aria-labelledby="misiones-t" className="space-y-4">
        <h2 id="misiones-t" className="text-2xl">Misiones</h2>
        <ol className="space-y-3">
          {normal.map((m) => (
            <li key={m.id}>
              <MissionRow m={m} index={m.position} />
            </li>
          ))}
        </ol>
      </section>

      {boss && (
        <section aria-labelledby="jefe-t" className="space-y-4">
          <h2 id="jefe-t" className="text-2xl">Prueba final</h2>
          <div className={`panel relative isolate overflow-hidden p-6 sm:p-8 ${boss.state === "bloqueada" ? "opacity-80" : "panel-glow"}`}>
            <Sprite src={asset.scene("arena", "calma")} alt="" decorative className="absolute inset-0 -z-10 size-full object-cover opacity-40" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/95 via-bg/70 to-bg/30" />
            <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
              <div className="space-y-3">
                <p className="eyebrow !text-coral">Guardián del portal</p>
                <h3 className="text-2xl sm:text-3xl">{g?.name ?? "El Guardián"}</h3>
                {g && <p className="text-muted"><strong className="text-text">{g.obstacle}</strong> · se vence con: {g.weakness.toLowerCase()}.</p>}
                <p className="text-sm text-muted">{boss.xpReward} XP · 6 preguntas · necesitas 70% para purificarlo.</p>
                {boss.state === "bloqueada" ? (
                  <p className="inline-flex items-center gap-2 rounded-xl border border-line bg-bg/60 px-4 py-2 text-sm font-semibold"><span aria-hidden="true">{boss.lock === "suscripcion" ? "🔑" : "🔒"}</span> {boss.lock === "suscripcion" ? "Incluido en la suscripción al curso" : `Termina las ${normal.length} misiones para desbloquearlo`}</p>
                ) : boss.state === "completada" ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="chip !border-green/60 !bg-green/15 text-sm text-[#b6f5cb]">✔ Purificado · mejor nota {boss.bestScore}%</span>
                    <Link href={`/mision/${boss.id}`} className="btn btn-secondary btn-sm">Volver a enfrentarlo</Link>
                  </div>
                ) : (
                  <Link href={`/mision/${boss.id}`} className="btn btn-primary btn-lg">Enfrentar a {g?.name.split(",")[0] ?? "el Guardián"}</Link>
                )}
              </div>
              <Sprite src={asset.boss(course.guardian, boss.state === "completada" ? "purificado" : "reposo")} alt="" decorative className={`mx-auto h-44 w-auto ${boss.state === "bloqueada" ? "brightness-50 grayscale" : ""}`} />
            </div>
          </div>
        </section>
      )}

      {chapters.length > 0 && (
        <section aria-labelledby="cronicas-t" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 id="cronicas-t" className="text-2xl">Crónicas de este portal</h2>
            <Link href="/cronicas" className="text-sm font-semibold text-cyan hover:underline">Ir al Archivo →</Link>
          </div>
          <ol className="grid gap-3 md:grid-cols-3">
            {chapters.map((ch, i) => {
              const open = isUnlocked(ch, done);
              return (
                <li key={ch.id}>
                  {open ? (
                    <Link href={`/cronicas/${ch.id}`} className="panel flex h-full items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-violet/60">
                      <span aria-hidden="true" className="text-2xl">📜</span>
                      <span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-wider text-muted">Capítulo {i + 1}</span><span className="font-display font-bold leading-tight">{ch.title}</span></span>
                    </Link>
                  ) : (
                    <div className="panel flex h-full items-center gap-3 border-dashed p-4 opacity-75">
                      <span aria-hidden="true" className="text-2xl">🔒</span>
                      <span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-wider text-muted">Capítulo {i + 1}</span><span className="text-sm text-muted">{ch.hint}</span></span>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}

function MissionRow({ m, index }: { m: MissionView; index: number }) {
  const locked = m.state === "bloqueada";
  const body = (
    <div className={`panel flex items-center gap-4 p-4 sm:p-5 transition ${locked ? "opacity-60" : "hover:-translate-y-0.5 hover:border-cyan/50"} ${m.state === "disponible" ? "panel-glow" : ""}`}>
      <span className={`grid size-12 shrink-0 place-items-center rounded-xl font-display text-xl font-extrabold ${m.state === "completada" ? "bg-green text-ink" : m.state === "disponible" ? "bg-gold text-ink" : "bg-white/10 text-muted"}`} aria-hidden="true">
        {m.state === "completada" ? "✔" : m.lock === "suscripcion" ? "🔑" : locked ? "🔒" : index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold leading-tight">{m.title}</p>
        <p className="text-sm text-muted">{m.lock === "suscripcion" ? "Incluida en la suscripción al curso." : locked ? "Termina la misión anterior para abrirla." : m.intro}</p>
      </div>
      <div className="shrink-0 text-right text-sm">
        {m.state === "completada" ? (
          <><p className="font-bold text-green">{m.bestScore}%</p><p className="text-muted">Repetir</p></>
        ) : locked ? (
          <p className="text-muted">{m.xpReward} XP</p>
        ) : (
          <><p className="font-bold text-gold">+{m.xpReward} XP</p><p className="font-semibold text-cyan">Empezar →</p></>
        )}
      </div>
    </div>
  );
  return locked ? (
    <div aria-disabled="true">{body}<span className="sr-only">Misión {index} bloqueada</span></div>
  ) : (
    <Link href={`/mision/${m.id}`} className="block rounded-[1.25rem]" aria-label={`Misión ${index}: ${m.title}${m.state === "completada" ? ", completada" : ""}`}>{body}</Link>
  );
}
