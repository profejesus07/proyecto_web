import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteMissionAction, deleteModuleAction, deleteQuestionAction, moveMissionAction, moveModuleAction, moveQuestionAction, publishCourseAction,
  saveCourseAction, saveMissionAction, saveModuleAction, saveQuestionAction, setFreeAction,
} from "@/app/actions/content";
import { CourseForm, FreeToggle, MissionForm, ModuleForm, PublishBar, QuestionForm, RowActions } from "@/components/editor-client";
import { Sprite, asset } from "@/components/sprite";
import { ACTIVITY_LABEL } from "@/lib/activities";
import type { EditableMission } from "@/lib/data/types";
import { groupByModule } from "@/lib/modules";
import { BackLink } from "@/components/ui";
import { ELEMENT_LABEL, GUARDIANS } from "@/content/guardians";
import { requireAdmin } from "@/lib/auth";
import { freeUntil } from "@/lib/lessons";
import { KIND_LABEL, publishProblems } from "@/lib/content";
import { getRepo } from "@/lib/data";
import { EN_TEXTO, Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Editar portal" };

export default async function EditCoursePage({ params, searchParams }: PageProps<"/admin/contenido/[slug]">) {
  const { slug } = await params;
  const imported = (await searchParams).importado === "1";
  await requireAdmin(`/admin/contenido/${slug}`);
  const course = await getRepo().getCourseForEdit(slug);
  if (!course) notFound();
  const problems = publishProblems(course);
  const free = freeUntil(course.missions);
  const n = course.missions.length;
  const modular = course.kind === "curso" && course.modules.length > 0;
  const groups = groupByModule(course.modules, course.missions);
  const moduleOptions = course.modules.map((m) => ({ id: m.id, title: m.title }));
  const guardians = GUARDIANS.map((g) => ({ slug: g.slug, name: g.name, obstacle: g.obstacle }));
  const guardianName = (slug: string) => GUARDIANS.find((g) => g.slug === slug)?.name ?? slug;

  // Una lección con sus preguntas (se usa en la lista simple y dentro de cada módulo).
  const lesson = (m: EditableMission, i: number, count: number) => (
    <details className="rounded-2xl border border-line bg-bg/30 p-4 sm:p-5 group">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="mr-2 inline-grid size-8 place-items-center rounded-lg bg-white/10 font-display font-extrabold">{m.isBoss ? <Icon name="crown" className="size-4" /> : m.lessonKind === "explicacion" ? <Icon name="book" className="size-4" /> : m.position}</span>
          <span className="font-semibold">{m.title}</span>
          <span className="ml-2 text-xs text-muted">{m.period ? `${m.period}.° periodo · ` : ""}{m.lessonKind === "explicacion" ? `Explicación${m.videoUrl ? " con video" : ""}` : `${m.questions.length} ${m.questions.length === 1 ? "actividad" : "actividades"}`}{m.position <= free && !course.isFree ? " · gratis" : ""}</span>
        </span>
        <span className="text-sm font-semibold text-cyan group-open:hidden">Editar ▾</span>
      </summary>
      <div className="mt-4 space-y-6 border-t border-line pt-4">
        <RowActions
          label={`la lección ${m.title}`}
          up={moveMissionAction.bind(null, slug, m.id, -1)} down={moveMissionAction.bind(null, slug, m.id, 1)}
          remove={deleteMissionAction.bind(null, slug, m.id)}
          removeConfirm={`¿Borrar la lección «${m.title}» y sus actividades?`}
          canUp={i > 0} canDown={i < count - 1}
        />
        <MissionForm action={saveMissionAction.bind(null, slug, m.id)} kind={course.kind} mission={m} modules={moduleOptions} submitLabel="Guardar lección" />
        {m.lessonKind === "reto" && <div className="space-y-3">
          <h3 className="font-display text-lg font-bold">Actividades</h3>
          <ol className="space-y-2">
            {m.questions.map((q, qi) => (
              <li key={q.id}>
                <details className="rounded-xl border border-line bg-bg/40 p-3">
                  <summary className="cursor-pointer text-sm"><strong>{qi + 1}.</strong> <span className="text-xs text-muted">[{ACTIVITY_LABEL[q.kind]}]</span> {q.prompt}</summary>
                  <div className="mt-3 space-y-3">
                    <RowActions
                      label={`la actividad ${qi + 1}`}
                      up={moveQuestionAction.bind(null, slug, q.id, -1)} down={moveQuestionAction.bind(null, slug, q.id, 1)}
                      remove={deleteQuestionAction.bind(null, slug, q.id)}
                      removeConfirm="¿Borrar esta actividad?"
                      canUp={qi > 0} canDown={qi < m.questions.length - 1}
                    />
                    <QuestionForm action={saveQuestionAction.bind(null, slug, m.id, q.id)} question={q} submitLabel="Guardar actividad" />
                  </div>
                </details>
              </li>
            ))}
          </ol>
          <details className="rounded-xl border border-dashed border-cyan/50 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-cyan">+ Agregar actividad</summary>
            <div className="mt-3"><QuestionForm action={saveQuestionAction.bind(null, slug, m.id, null)} submitLabel="Agregar actividad" /></div>
          </details>
        </div>}
      </div>
    </details>
  );

  return (
    <div className="space-y-8">
      <BackLink href="/admin/contenido">Contenido</BackLink>
      {imported && (
        <p role="status" className="panel p-4 font-medium text-ok">
          <Icon name="check" className={EN_TEXTO} /> Importado desde Excel: {course.modules.length > 0 ? `${course.modules.length} ${course.modules.length === 1 ? "módulo" : "módulos"}, ` : ""}{n} {n === 1 ? "lección" : "lecciones"} y {course.missions.reduce((k, m) => k + m.questions.length, 0)} actividades. Quedó como borrador: revísalo y publícalo cuando esté listo.
        </p>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="eyebrow">Editar · {KIND_LABEL[course.kind]}</p>
          <h1 className="text-3xl leading-tight sm:text-4xl">{course.title}</h1>
          {course.published && <Link href={`/programas/${course.slug}`} className="text-sm font-semibold text-cyan hover:underline">Ver la ficha pública →</Link>}
        </div>
        <div className="space-y-3">
          <PublishBar published={course.published} publish={publishCourseAction.bind(null, slug, true)} unpublish={publishCourseAction.bind(null, slug, false)} />
          <FreeToggle free={course.isFree} toggle={setFreeAction.bind(null, slug, !course.isFree)} />
        </div>
      </header>

      {!course.published && problems.length > 0 && (
        <div role="note" className="panel !border-warn/50 p-4 text-sm">
          <p className="font-semibold text-warn">Para publicar falta:</p>
          <ul className="mt-1 list-disc pl-5 text-muted">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}

      <section aria-labelledby="datos-t" className="panel space-y-4 p-5 sm:p-6">
        <h2 id="datos-t" className="text-2xl">Datos del portal</h2>
        <CourseForm
          action={saveCourseAction.bind(null, slug)}
          values={course}
          guardians={guardians}
          elements={Object.entries(ELEMENT_LABEL).map(([key, label]) => ({ key, label }))}
        />
      </section>

      {modular ? (
        <section aria-labelledby="modulos-t" className="space-y-5">
          <div>
            <h2 id="modulos-t" className="text-2xl">Módulos y lecciones</h2>
            <p className="text-sm text-muted">Cada módulo agrupa lecciones y termina con la prueba de su Guardián, que trae su parte de la historia. Se juegan en este orden; son gratis las lecciones hasta el primer reto (la explicación inicial y una práctica).</p>
          </div>
          {groups.map(({ module: mod, missions }, gi) => (
            <div key={mod?.id ?? "sin-modulo"} className="panel space-y-4 p-4 sm:p-5">
              {mod ? (
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <Sprite src={asset.boss(mod.guardian)} alt="" decorative className="size-12 object-contain" />
                      <span>
                        <span className="block text-xs font-bold uppercase tracking-wider text-muted">Módulo {gi + 1} · {guardianName(mod.guardian)}</span>
                        <span className="font-display text-xl font-bold">{mod.title}</span>
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-cyan">Editar módulo ▾</span>
                  </summary>
                  <div className="mt-4 space-y-4 border-t border-line pt-4">
                    <RowActions
                      label={`el módulo ${mod.title}`}
                      up={moveModuleAction.bind(null, slug, mod.id, -1)} down={moveModuleAction.bind(null, slug, mod.id, 1)}
                      remove={deleteModuleAction.bind(null, slug, mod.id)}
                      removeConfirm={`¿Borrar el módulo «${mod.title}»? Debe estar vacío.`}
                      canUp={gi > 0} canDown={gi < course.modules.length - 1}
                    />
                    <ModuleForm action={saveModuleAction.bind(null, slug, mod.id)} module={mod} guardians={guardians} submitLabel="Guardar módulo" />
                  </div>
                </details>
              ) : (
                <p className="font-display text-lg font-bold text-warn">Lecciones sin módulo · ábrelas y elige su módulo</p>
              )}
              {mod && !missions.some((m) => m.lessonKind === "explicacion") && (
                <p className="rounded-xl border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn"><Icon name="book" className={EN_TEXTO} /> Este módulo aún no tiene su lección de explicación. Agrégala (lo ideal: como primera lección).</p>
              )}
              <ol className="space-y-3">
                {missions.map((m, i) => <li key={m.id}>{lesson(m, i, missions.length)}</li>)}
              </ol>
              {mod && (
                <details className="rounded-xl border border-dashed border-cyan/50 p-3" open={missions.length === 0}>
                  <summary className="cursor-pointer text-sm font-semibold text-cyan">+ Agregar lección a «{mod.title}»</summary>
                  <div className="mt-3"><MissionForm action={saveMissionAction.bind(null, slug, null)} kind={course.kind} modules={moduleOptions} moduleId={mod.id} submitLabel="Crear lección"
                    defaultLessonKind={missions.some((m) => m.lessonKind === "explicacion") ? "reto" : "explicacion"} /></div>
                </details>
              )}
            </div>
          ))}
          <details className="panel border-dashed p-4 sm:p-5">
            <summary className="cursor-pointer font-semibold text-cyan">+ Agregar módulo</summary>
            <div className="mt-4"><ModuleForm action={saveModuleAction.bind(null, slug, null)} guardians={guardians} submitLabel="Crear módulo" /></div>
          </details>
        </section>
      ) : (
        <section aria-labelledby="lecciones-t" className="space-y-4">
          <div>
            <h2 id="lecciones-t" className="text-2xl">Lecciones</h2>
            <p className="text-sm text-muted">Se juegan en este orden. La primera es gratis para todos; las demás necesitan acceso.{course.kind === "clase" ? " Asigna a cada una su periodo." : ""}</p>
          </div>
          <ol className="space-y-3">
            {course.missions.map((m, i) => <li key={m.id}>{lesson(m, i, n)}</li>)}
          </ol>
          {course.kind === "curso" && (
            <details className="panel border-dashed p-4 sm:p-5">
              <summary className="cursor-pointer font-semibold text-cyan">+ Organizar en módulos</summary>
              <div className="mt-4"><ModuleForm action={saveModuleAction.bind(null, slug, null)} guardians={guardians} submitLabel="Crear módulo" /></div>
            </details>
          )}
          <details className="panel border-dashed p-4 sm:p-5" open={n === 0}>
            <summary className="cursor-pointer font-semibold text-cyan">+ Agregar lección</summary>
            <div className="mt-4"><MissionForm action={saveMissionAction.bind(null, slug, null)} kind={course.kind} submitLabel="Crear lección" /></div>
          </details>
        </section>
      )}
    </div>
  );
}
