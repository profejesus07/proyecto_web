import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sprite, asset } from "@/components/sprite";
import { BackLink } from "@/components/ui";
import { ELEMENT_COLOR, ELEMENT_LABEL, guardianBySlug } from "@/content/guardians";
import { requirePlayer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { CHAPTERS, isUnlocked, stagesReached } from "@/content/cronicas";
import { INFORMAL_NOTICE } from "@/lib/content";
import { formatPrice, loadCourseView, type MissionView } from "@/lib/data/queries";
import { groupByModule } from "@/lib/modules";

export async function generateMetadata({ params }: PageProps<"/portales/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ") };
}

export default async function CoursePage({ params }: PageProps<"/portales/[slug]">) {
  const { slug } = await params;
  const viewer = await requirePlayer(`/portales/${slug}`);
  const course = await loadCourseView(viewer.id, slug);
  if (!course) notFound();
  const myCert = course.kind === "curso" ? (await getRepo().listCertificates({ userId: viewer.id })).find((c) => c.courseSlug === slug) : undefined;
  const color = ELEMENT_COLOR[course.element];
  const g = guardianBySlug(course.guardian);
  const normal = course.missions.filter((m) => !m.isBoss);
  const boss = course.missions.find((m) => m.isBoss);
  const done = new Set(stagesReached(course.guardian, course.missions.filter((m) => m.state === "completada").map((m) => m.position), course.missions.length));
  const modular = course.kind === "curso" && course.modules.length > 0;
  const groups = groupByModule(course.modules, course.missions);

  return (
    <div className="space-y-8">
      <BackLink href="/portales">Sala de Portales</BackLink>

      <header className="panel relative isolate grid gap-6 overflow-hidden p-6 sm:p-8 md:grid-cols-[1fr_auto]" style={{ borderColor: `${color}88` }}>
        <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(60% 90% at 90% 50%, ${color}30, transparent 70%)` }} />
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
            {course.kind === "clase" ? [course.area, course.grade, course.schoolYear].filter(Boolean).join(" · ") || "Clase" : "Curso corto"} · Portal de {ELEMENT_LABEL[course.element]}
          </p>
          <h1 className="text-4xl sm:text-5xl">{course.title}</h1>
          <p className="max-w-2xl text-lg text-muted">{course.summary}</p>
          {course.kind === "curso" && (
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {course.hours && <div><dt className="inline text-muted">Intensidad: </dt><dd className="inline font-semibold">{course.hours} horas</dd></div>}
              {course.trainerName && <div><dt className="inline text-muted">Formador: </dt><dd className="inline font-semibold">{course.trainerName}{course.trainerTitle ? `, ${course.trainerTitle}` : ""}</dd></div>}
              <div><dt className="inline text-muted">Modalidad: </dt><dd className="inline font-semibold">virtual</dd></div>
            </dl>
          )}
          {course.kind === "clase" && course.accessUntil && <p className="text-sm text-muted">Año lectivo hasta el {new Date(`${course.accessUntil}T12:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}.</p>}
          <div className="max-w-md space-y-2 pt-2">
            <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={course.total} aria-valuenow={course.done} aria-label="Lecciones completadas"><i style={{ width: `${(course.done / Math.max(course.total, 1)) * 100}%` }} /></div>
            <p className="text-sm font-semibold">{course.done} de {course.total} lecciones{course.bossDefeated ? " · ¡Guardián vencido!" : ""}</p>
          </div>
        </div>
        <Sprite src={asset.boss(course.guardian)} alt={`${g?.name ?? "El Guardián"} custodia este portal`} className="mx-auto h-48 w-auto md:h-56" />
      </header>

      {course.kind === "curso" && course.status === "completado" && (
        <div role="note" className="panel panel-glow flex flex-wrap items-center gap-4 !border-gold/60 p-5">
          <span aria-hidden="true" className="text-4xl">🎓</span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-bold">{myCert ? "Tu constancia de asistencia está lista" : "¡Terminaste el curso!"}</p>
            <p className="text-muted">{myCert ? `Código de verificación: ${myCert.code}` : "Ya puedes solicitar tu constancia de asistencia."}</p>
          </div>
          <Link href={myCert ? `/constancia/${myCert.code}` : `/constancia/solicitar/${slug}`} className="btn btn-primary">{myCert ? "Ver mi constancia" : "Solicitar mi constancia"}</Link>
        </div>
      )}

      {!course.hasAccess && (
        <div role="note" className={`panel flex flex-wrap items-center gap-4 p-5 ${course.needsSubscription ? "panel-glow !border-gold/60" : "!border-gold/40"}`}>
          <span aria-hidden="true" className="text-4xl">🔑</span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-display text-xl font-bold">{course.needsSubscription ? "¡Superaste la lección gratis!" : "La primera lección es gratis"}</p>
            <p className="text-muted">
              {course.kind === "clase"
                ? <>Suscríbete para abrir todas las lecciones del año. Acceso anual: <strong className="text-text">{formatPrice(course.price)}</strong>. Si tu docente o colegio te dio un código, úsalo en tu perfil.</>
                : <>Suscríbete a este curso para abrir todas sus lecciones, enfrentar a {g?.name ?? "su Guardián"} y recibir tu constancia de asistencia. Curso completo: <strong className="text-text">{formatPrice(course.price)}</strong>.</>}
            </p>
          </div>
          <Link href={`/suscribirse/${course.slug}`} className="btn btn-primary">Desbloquear el curso</Link>
        </div>
      )}

      {modular ? (
        // Curso por módulos: cada módulo es un capítulo de la historia, con su propio Guardián al final.
        groups.map(({ module: mod, missions }, gi) => {
          if (!mod) return null;
          const gm = guardianBySlug(mod.guardian);
          const normalM = missions.filter((m) => !m.isBoss);
          const bossM = missions.find((m) => m.isBoss);
          const doneM = new Set(stagesReached(mod.guardian, missions.map((m, i) => (m.state === "completada" ? i + 1 : 0)).filter(Boolean), missions.length));
          const doneCount = missions.filter((m) => m.state === "completada").length;
          return (
            <section key={mod.id} aria-labelledby={`mod-${mod.id}`} className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line/60 pb-3">
                <div className="space-y-1">
                  <p className="eyebrow">Módulo {gi + 1} · Guardián: {gm?.name ?? mod.guardian}</p>
                  <h2 id={`mod-${mod.id}`} className="text-2xl">{mod.title}</h2>
                  {mod.summary && <p className="max-w-2xl text-muted">{mod.summary}</p>}
                </div>
                <p className="text-sm font-semibold text-muted">{doneCount} de {missions.length} lecciones</p>
              </div>
              <ol className="space-y-3">{normalM.map((m) => <li key={m.id}><MissionRow m={m} index={m.position} /></li>)}</ol>
              {bossM && <BossCard boss={bossM} guardian={mod.guardian} normalCount={normalM.length} label={`Guardián del módulo ${gi + 1}`} />}
              <ChronicleList guardian={mod.guardian} done={doneM} title={`Crónicas de ${gm?.name ?? "este Guardián"}`} />
            </section>
          );
        })
      ) : (
        <>
          <section aria-labelledby="misiones-t" className="space-y-4">
            <h2 id="misiones-t" className="text-2xl">Lecciones</h2>
            {course.kind === "clase" ? (
              // En una clase, las lecciones se agrupan por periodo académico.
              [1, 2, 3, 4, null].map((period) => {
                const list = normal.filter((m) => m.period === period);
                if (!list.length) return null;
                return (
                  <div key={period ?? "sin"} className="space-y-3">
                    <h3 className="font-display text-lg font-bold text-cyan">{period ? `${period}.° periodo` : "Sin periodo"}</h3>
                    <ol className="space-y-3">{list.map((m) => <li key={m.id}><MissionRow m={m} index={m.position} /></li>)}</ol>
                  </div>
                );
              })
            ) : (
              <ol className="space-y-3">{normal.map((m) => <li key={m.id}><MissionRow m={m} index={m.position} /></li>)}</ol>
            )}
          </section>
          {boss && (
            <section aria-labelledby="jefe-t" className="space-y-4">
              <h2 id="jefe-t" className="text-2xl">Prueba final</h2>
              <BossCard boss={boss} guardian={course.guardian} normalCount={normal.length} label="Guardián del portal" />
            </section>
          )}
          <ChronicleList guardian={course.guardian} done={done} title="Crónicas de este portal" />
        </>
      )}

      {course.kind === "curso" && <p className="text-sm text-muted">ℹ️ {INFORMAL_NOTICE}</p>}
    </div>
  );
}

function MissionRow({ m, index }: { m: MissionView; index: number }) {
  const locked = m.state === "bloqueada";
  const body = (
    <div className={`panel flex items-center gap-4 p-4 sm:p-5 transition ${locked ? "opacity-60" : "hover:-translate-y-0.5 hover:border-cyan/50"} ${m.state === "disponible" ? "panel-glow" : ""}`}>
      <span className={`grid size-12 shrink-0 place-items-center rounded-xl font-display text-xl font-extrabold ${m.state === "completada" ? "bg-green text-ink" : m.state === "disponible" ? "bg-gold text-ink" : "bg-white/10 text-muted"}`} aria-hidden="true">
        {m.state === "completada" ? "✔" : m.lock === "suscripcion" ? "🔑" : locked ? "🔒" : m.lessonKind === "explicacion" ? "📖" : index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold leading-tight">{m.lessonKind === "explicacion" && <span className="mr-1.5 rounded-md bg-cyan/15 px-1.5 py-0.5 align-middle text-xs font-bold text-cyan">Explicación</span>}{m.title}</p>
        <p className="text-sm text-muted">{m.lock === "suscripcion" ? "Incluida en la suscripción al curso." : locked ? "Termina la misión anterior para abrirla." : m.intro}</p>
      </div>
      <div className="shrink-0 text-right text-sm">
        {m.state === "completada" ? (
          m.lessonKind === "explicacion" ? <p className="text-muted">Volver a leer</p> : <><p className="font-bold text-green">{m.bestScore}%</p><p className="text-muted">Repetir</p></>
        ) : locked ? (
          <p className="text-muted">{m.xpReward} XP</p>
        ) : (
          <><p className="font-bold text-gold">+{m.xpReward} XP</p><p className="font-semibold text-cyan">{m.lessonKind === "explicacion" ? "Leer →" : "Empezar →"}</p></>
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

function BossCard({ boss, guardian, normalCount, label }: { boss: MissionView; guardian: string; normalCount: number; label: string }) {
  const g = guardianBySlug(guardian);
  return (
    <div className={`panel relative isolate overflow-hidden p-6 sm:p-8 ${boss.state === "bloqueada" ? "opacity-80" : "panel-glow"}`}>
      <Sprite src={asset.scene("arena", "calma")} alt="" decorative className="absolute inset-0 -z-10 size-full object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/95 via-bg/70 to-bg/30" />
      <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <p className="eyebrow !text-coral">{label}</p>
          <h3 className="text-2xl sm:text-3xl">{g?.name ?? "El Guardián"}</h3>
          {g && <p className="text-muted"><strong className="text-text">{g.obstacle}</strong> · se vence con: {g.weakness.toLowerCase()}.</p>}
          <p className="text-sm text-muted">{boss.title} · {boss.xpReward} XP · necesitas 70% para purificarlo.</p>
          {boss.state === "bloqueada" ? (
            <p className="inline-flex items-center gap-2 rounded-xl border border-line bg-bg/60 px-4 py-2 text-sm font-semibold"><span aria-hidden="true">{boss.lock === "suscripcion" ? "🔑" : "🔒"}</span> {boss.lock === "suscripcion" ? "Incluido en la suscripción al curso" : `Termina las ${normalCount} misiones anteriores para desbloquearlo`}</p>
          ) : boss.state === "completada" ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="chip !border-green/60 !bg-green/15 text-sm text-ok">✔ Purificado · mejor nota {boss.bestScore}%</span>
              <Link href={`/mision/${boss.id}`} className="btn btn-secondary btn-sm">Volver a enfrentarlo</Link>
            </div>
          ) : (
            <Link href={`/mision/${boss.id}`} className="btn btn-primary btn-lg">Enfrentar a {g?.name.split(",")[0] ?? "el Guardián"}</Link>
          )}
        </div>
        <Sprite src={asset.boss(guardian, boss.state === "completada" ? "purificado" : "reposo")} alt="" decorative className={`mx-auto h-44 w-auto ${boss.state === "bloqueada" ? "brightness-50 grayscale" : ""}`} />
      </div>
    </div>
  );
}

function ChronicleList({ guardian, done, title }: { guardian: string; done: ReadonlySet<string>; title: string }) {
  const chapters = CHAPTERS.filter((c) => c.guardian === guardian);
  if (!chapters.length) return null;
  return (
    <section aria-label={title} className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <h3 className="text-xl">{title}</h3>
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
  );
}
