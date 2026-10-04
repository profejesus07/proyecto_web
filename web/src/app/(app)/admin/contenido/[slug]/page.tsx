import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteMissionAction, deleteQuestionAction, moveMissionAction, moveQuestionAction, publishCourseAction,
  saveCourseAction, saveMissionAction, saveQuestionAction,
} from "@/app/actions/content";
import { CourseForm, MissionForm, PublishBar, QuestionForm, RowActions } from "@/components/editor-client";
import { BackLink } from "@/components/ui";
import { ELEMENT_LABEL, GUARDIANS } from "@/content/guardians";
import { requireAdmin } from "@/lib/auth";
import { KIND_LABEL, publishProblems } from "@/lib/content";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Editar portal" };

export default async function EditCoursePage({ params }: PageProps<"/admin/contenido/[slug]">) {
  const { slug } = await params;
  await requireAdmin(`/admin/contenido/${slug}`);
  const course = await getRepo().getCourseForEdit(slug);
  if (!course) notFound();
  const problems = publishProblems(course);
  const n = course.missions.length;

  return (
    <div className="space-y-8">
      <BackLink href="/admin/contenido">Contenido</BackLink>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="eyebrow">Editar · {KIND_LABEL[course.kind]}</p>
          <h1 className="text-3xl leading-tight sm:text-4xl">{course.title}</h1>
          {course.published && <Link href={`/portales/${course.slug}`} className="text-sm font-semibold text-cyan hover:underline">Ver como estudiante →</Link>}
        </div>
        <PublishBar published={course.published} publish={publishCourseAction.bind(null, slug, true)} unpublish={publishCourseAction.bind(null, slug, false)} />
      </header>

      {!course.published && problems.length > 0 && (
        <div role="note" className="panel !border-gold/50 p-4 text-sm">
          <p className="font-semibold text-[#ffe3a0]">Para publicar falta:</p>
          <ul className="mt-1 list-disc pl-5 text-muted">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}

      <section aria-labelledby="datos-t" className="panel space-y-4 p-5 sm:p-6">
        <h2 id="datos-t" className="text-2xl">Datos del portal</h2>
        <CourseForm
          action={saveCourseAction.bind(null, slug)}
          values={course}
          guardians={GUARDIANS.map((g) => ({ slug: g.slug, name: g.name, obstacle: g.obstacle }))}
          elements={Object.entries(ELEMENT_LABEL).map(([key, label]) => ({ key, label }))}
        />
      </section>

      <section aria-labelledby="lecciones-t" className="space-y-4">
        <div>
          <h2 id="lecciones-t" className="text-2xl">Lecciones</h2>
          <p className="text-sm text-muted">Se juegan en este orden. La primera es gratis para todos; las demás necesitan acceso.{course.kind === "clase" ? " Asigna a cada una su periodo." : ""}</p>
        </div>
        <ol className="space-y-3">
          {course.missions.map((m, i) => (
            <li key={m.id}>
              <details className="panel group p-4 sm:p-5">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="mr-2 inline-grid size-8 place-items-center rounded-lg bg-white/10 font-display font-extrabold">{m.isBoss ? "👑" : i + 1}</span>
                    <span className="font-semibold">{m.title}</span>
                    <span className="ml-2 text-xs text-muted">{m.period ? `${m.period}.° periodo · ` : ""}{m.questions.length} {m.questions.length === 1 ? "pregunta" : "preguntas"}{i === 0 ? " · gratis" : ""}</span>
                  </span>
                  <span className="text-sm font-semibold text-cyan group-open:hidden">Editar ▾</span>
                </summary>
                <div className="mt-4 space-y-6 border-t border-line pt-4">
                  <RowActions
                    label={`la lección ${m.title}`}
                    up={moveMissionAction.bind(null, slug, m.id, -1)} down={moveMissionAction.bind(null, slug, m.id, 1)}
                    remove={deleteMissionAction.bind(null, slug, m.id)}
                    removeConfirm={`¿Borrar la lección «${m.title}» y sus preguntas?`}
                    canUp={i > 0} canDown={i < n - 1}
                  />
                  <MissionForm action={saveMissionAction.bind(null, slug, m.id)} kind={course.kind} mission={m} submitLabel="Guardar lección" />
                  <div className="space-y-3">
                    <h3 className="font-display text-lg font-bold">Preguntas</h3>
                    <ol className="space-y-2">
                      {m.questions.map((q, qi) => (
                        <li key={q.id}>
                          <details className="rounded-xl border border-line bg-bg/40 p-3">
                            <summary className="cursor-pointer text-sm"><strong>{qi + 1}.</strong> {q.prompt}</summary>
                            <div className="mt-3 space-y-3">
                              <RowActions
                                label={`la pregunta ${qi + 1}`}
                                up={moveQuestionAction.bind(null, slug, q.id, -1)} down={moveQuestionAction.bind(null, slug, q.id, 1)}
                                remove={deleteQuestionAction.bind(null, slug, q.id)}
                                removeConfirm="¿Borrar esta pregunta?"
                                canUp={qi > 0} canDown={qi < m.questions.length - 1}
                              />
                              <QuestionForm action={saveQuestionAction.bind(null, slug, m.id, q.id)} question={q} submitLabel="Guardar pregunta" />
                            </div>
                          </details>
                        </li>
                      ))}
                    </ol>
                    <details className="rounded-xl border border-dashed border-cyan/50 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-cyan">+ Agregar pregunta</summary>
                      <div className="mt-3"><QuestionForm action={saveQuestionAction.bind(null, slug, m.id, null)} submitLabel="Agregar pregunta" /></div>
                    </details>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ol>
        <details className="panel border-dashed p-4 sm:p-5" open={n === 0}>
          <summary className="cursor-pointer font-semibold text-cyan">+ Agregar lección</summary>
          <div className="mt-4"><MissionForm action={saveMissionAction.bind(null, slug, null)} kind={course.kind} submitLabel="Crear lección" /></div>
        </details>
      </section>
    </div>
  );
}
