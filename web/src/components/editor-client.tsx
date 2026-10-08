"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { createCourseAction, importCourseAction, type EditorState } from "@/app/actions/content";
import { MAX_IMPORT_BYTES } from "@/lib/excel-import";
import { GRADES, PERIODS } from "@/lib/content";
import { ACTIVITY_KINDS, ACTIVITY_LABEL, type ActivityKind } from "@/lib/activities";
import type { CourseKind, EditableQuestion, LessonKind, MissionSummary, Module } from "@/lib/data/types";
import { LESSON_KIND_LABEL, MAX_BODY, READING_XP } from "@/lib/lessons";

type FormAction = (prev: EditorState, fd: FormData) => Promise<EditorState>;
type Quick = () => Promise<EditorState>;

function Submit({ children, pending, className = "btn btn-primary btn-sm" }: { children: React.ReactNode; pending: string; className?: string }) {
  const { pending: busy } = useFormStatus();
  return <button type="submit" className={className} disabled={busy}>{busy ? pending : children}</button>;
}

function Notice({ state }: { state: EditorState }) {
  return (
    <div aria-live="polite" className="empty:hidden">
      {state?.error && <p role="alert" className="text-sm font-medium text-err">{state.error}</p>}
      {state?.problems && <ul className="mt-1 list-disc pl-5 text-sm text-warn">{state.problems.map((p) => <li key={p}>{p}</li>)}</ul>}
      {state?.message && <p role="status" className="text-sm font-medium text-green">{state.message}</p>}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint block">{hint}</span>}
    </label>
  );
}

export function NewCourseForm() {
  const [state, action] = useActionState(createCourseAction, undefined);
  return (
    <form action={action} className="panel space-y-4 p-5">
      <fieldset className="space-y-2">
        <legend className="label">¿Qué vas a crear?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { v: "clase", t: "Clase", d: "Por área, grado y periodos (1.° a 4.°). Acceso anual." },
            { v: "curso", t: "Curso corto", d: "Educación informal de menos de 160 horas, con constancia de asistencia." },
          ].map((o, i) => (
            <label key={o.v} className="cursor-pointer">
              <input type="radio" name="kind" value={o.v} defaultChecked={i === 0} className="peer sr-only" />
              <span className="block rounded-xl border-2 border-line bg-bg/40 p-3 transition peer-checked:border-cyan peer-checked:bg-cyan/10 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-cyan">
                <span className="block font-bold">{o.t}</span>
                <span className="block text-xs text-muted">{o.d}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {/* El título va solo en su fila: en la media columna de la consola, junto a Horas y el botón, quedaba de 65 px. */}
      <Field label="Título"><input name="title" required minLength={3} maxLength={80} placeholder="Ej.: Matemáticas 6.° · 2027" className="input w-full" /></Field>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Horas" hint="Curso: menos de 160."><input name="hours" type="number" min={1} max={2000} placeholder="Ej.: 20" className="input !w-28" /></Field>
        <Submit pending="Creando…" className="btn btn-primary">Crear y editar</Submit>
      </div>
      <Notice state={state} />
    </form>
  );
}

/** Cargar un curso o una clase completos desde la plantilla de Excel. */
export function ImportForm() {
  const [state, action] = useActionState(importCourseAction, undefined);
  const [tooBig, setTooBig] = useState(false);
  return (
    <form action={action} className="panel space-y-4 p-5">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
        <li><a href="/admin/contenido/plantilla" download className="font-semibold text-cyan hover:underline">Descarga la plantilla de Excel</a>: trae instrucciones y un ejemplo completo.</li>
        <li>Llena las hojas Curso, Módulos, Lecciones y Actividades (puedes borrar el ejemplo).</li>
        <li>Súbela aquí. Se crea como borrador para que la revises antes de publicar.</li>
      </ol>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Archivo de Excel (.xlsx)">
          <input name="file" type="file" required accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => setTooBig((e.target.files?.[0]?.size ?? 0) > MAX_IMPORT_BYTES)}
            className="input file:mr-3 file:rounded-lg file:border-0 file:bg-cyan/15 file:px-3 file:py-1 file:font-semibold file:text-cyan" />
        </Field>
        <Submit pending="Importando…" className="btn btn-primary">Importar</Submit>
      </div>
      {tooBig && <p role="alert" className="text-sm text-err">El archivo pesa más de 900 KB: quita imágenes o formatos que no hagan falta.</p>}
      {state?.error && <p role="alert" className="text-sm text-err">{state.error}</p>}
      {state?.errors && (
        <div role="alert" className="space-y-2 rounded-xl border border-coral/40 bg-coral/10 p-3 text-sm">
          <p className="font-bold">Corrige esto en el archivo y vuelve a subirlo:</p>
          <ul className="list-disc space-y-1 pl-5">{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}
    </form>
  );
}

export interface CourseFormValues {
  kind: CourseKind; title: string; summary: string; guardian: string; element: string;
  area: string | null; grade: string | null; schoolYear: number | null; accessUntil: string | null;
  hours: number | null; trainerName: string | null; trainerTitle: string | null;
}

export function CourseForm({ action, values, guardians, elements }: {
  action: FormAction; values: CourseFormValues;
  guardians: { slug: string; name: string; obstacle: string }[]; elements: { key: string; label: string }[];
}) {
  const [state, run] = useActionState(action, undefined);
  const [kind, setKind] = useState<CourseKind>(values.kind);
  return (
    <form action={run} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <Field label="Tipo">
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as CourseKind)} className="input">
            <option value="clase">Clase</option>
            <option value="curso">Curso corto</option>
          </select>
        </Field>
        <Field label="Título"><input name="title" defaultValue={values.title} required minLength={3} maxLength={80} className="input" /></Field>
      </div>
      <Field label="Descripción" hint="Aparece en la Sala de Portales. Máximo 400 caracteres.">
        <textarea name="summary" defaultValue={values.summary} maxLength={400} rows={3} className="input" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Guardián del portal" hint="Trae su historia en las Crónicas (3 capítulos), su recompensa y su título al vencerlo.">
          <select name="guardian" defaultValue={values.guardian} className="input">
            {guardians.map((g) => <option key={g.slug} value={g.slug}>{g.name} · {g.obstacle}</option>)}
          </select>
        </Field>
        <Field label="Elemento (color del portal y escenario)">
          <select name="element" defaultValue={values.element} className="input">
            {elements.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>
        </Field>
      </div>
      {kind === "clase" ? (
        <fieldset className="grid gap-4 rounded-2xl border border-line p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-bold text-cyan">Datos de la clase</legend>
          <Field label="Área"><input name="area" defaultValue={values.area ?? ""} maxLength={60} placeholder="Matemáticas" className="input" /></Field>
          <Field label="Grado">
            <select name="grade" defaultValue={values.grade ?? ""} className="input">
              <option value="">Elige…</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Año lectivo"><input name="schoolYear" type="number" min={2020} max={2100} defaultValue={values.schoolYear ?? ""} className="input" /></Field>
          <Field label="Fin del año lectivo" hint="Hasta ese día dura el acceso anual."><input name="accessUntil" type="date" defaultValue={values.accessUntil ?? ""} className="input" /></Field>
          <Field label="Intensidad horaria (horas en el año)" hint="Opcional. Hasta 2000."><input name="hours" type="number" min={1} max={2000} defaultValue={values.hours ?? ""} className="input" /></Field>
        </fieldset>
      ) : (
        <fieldset className="grid gap-4 rounded-2xl border border-line p-4 sm:grid-cols-3">
          <legend className="px-1 text-sm font-bold text-cyan">Datos del curso corto (aparecen en la constancia)</legend>
          <Field label="Intensidad (horas)" hint="Menos de 160."><input name="hours" type="number" min={1} max={159} defaultValue={values.hours ?? ""} className="input" /></Field>
          <Field label="Nombre del formador"><input name="trainerName" defaultValue={values.trainerName ?? ""} maxLength={120} placeholder="Jesús David Álvarez Sáez" className="input" /></Field>
          <Field label="Título del formador"><input name="trainerTitle" defaultValue={values.trainerTitle ?? ""} maxLength={160} placeholder="Magíster en …" className="input" /></Field>
        </fieldset>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Submit pending="Guardando…">Guardar datos</Submit>
        <Notice state={state} />
      </div>
    </form>
  );
}

function useQuick() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<EditorState>(undefined);
  function run(fn: Quick, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    start(async () => {
      const r = await fn();
      setState(r);
      router.refresh();
    });
  }
  return { pending, state, run };
}

export function PublishBar({ published, publish, unpublish }: { published: boolean; publish: Quick; unpublish: Quick }) {
  const { pending, state, run } = useQuick();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`chip text-sm ${published ? "!border-green/60 !bg-green/15 text-ok" : "text-muted"}`}>{published ? "● Publicado" : "○ Borrador"}</span>
        {published ? (
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => run(unpublish, "¿Despublicar? Los estudiantes dejarán de verlo (su avance se conserva).")}>Despublicar</button>
        ) : (
          <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={() => run(publish)}>Publicar</button>
        )}
      </div>
      <Notice state={state} />
    </div>
  );
}

export function MissionForm({ action, kind, mission, submitLabel, modules = [], moduleId = null, defaultLessonKind = "reto" }: {
  action: FormAction; kind: CourseKind; mission?: MissionSummary; submitLabel: string;
  /** Módulos del curso corto (para elegir o cambiar el módulo de la lección). */
  modules?: Pick<Module, "id" | "title">[]; moduleId?: string | null;
  defaultLessonKind?: LessonKind;
}) {
  const [state, run] = useActionState(action, undefined);
  // Estado propio + campo oculto: así el tipo no se desincroniza cuando el formulario se reinicia.
  const [lessonKind, setLessonKind] = useState<LessonKind>(mission?.lessonKind ?? defaultLessonKind);
  const reading = lessonKind === "explicacion";
  return (
    <form action={run} className="space-y-3">
      <input type="hidden" name="lessonKind" value={lessonKind} />
      <fieldset className="flex flex-wrap gap-2">
        <legend className="label mb-1">Tipo de lección</legend>
        {(["explicacion", "reto"] as const).map((k) => (
          <label key={k} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold ${lessonKind === k ? "border-cyan bg-cyan/10 text-cyan" : "border-line text-muted"}`}>
            <input type="radio" name="lessonKindPick" value={k} checked={lessonKind === k} onChange={() => setLessonKind(k)} className="sr-only" />
            {k === "explicacion" ? "📖 " : "⚔️ "}{LESSON_KIND_LABEL[k]}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Field label="Título de la lección"><input name="title" defaultValue={mission?.title ?? ""} required minLength={3} maxLength={120} className="input" /></Field>
        {kind === "curso" && modules.length > 0 && (
          <Field label="Módulo">
            <select name="moduleId" defaultValue={mission?.moduleId ?? moduleId ?? modules[0].id} className="input">
              {modules.map((m, i) => <option key={m.id} value={m.id}>{i + 1}. {m.title}</option>)}
            </select>
          </Field>
        )}
        {kind === "clase" && (
          <Field label="Periodo">
            <select name="period" defaultValue={mission?.period ?? ""} className="input">
              <option value="">—</option>
              {PERIODS.map((p) => <option key={p} value={p}>{p}.° periodo</option>)}
            </select>
          </Field>
        )}
        <Field label="XP"><input key={lessonKind} name="xpReward" type="number" min={0} max={1000} defaultValue={mission?.xpReward ?? (reading ? READING_XP : 50)} className="input !w-24" /></Field>
      </div>
      <Field label="Introducción (la dice Sora antes de empezar)"><textarea name="intro" defaultValue={mission?.intro ?? ""} maxLength={400} rows={2} className="input" /></Field>
      {reading && (
        <>
          <Field label="Explicación" hint="Párrafos separados por una línea en blanco. «## » para un subtítulo, «- » para una lista y **así** para negrita.">
            <textarea name="body" defaultValue={mission?.body ?? ""} maxLength={MAX_BODY} rows={10} required minLength={20} className="input font-[inherit]" />
          </Field>
          <Field label="Video (opcional)" hint="Enlace de YouTube o Vimeo.">
            <input name="videoUrl" type="url" defaultValue={mission?.videoUrl ?? ""} placeholder="https://www.youtube.com/watch?v=…" className="input" />
          </Field>
        </>
      )}
      {!reading && <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isBoss" defaultChecked={mission?.isBoss ?? false} className="size-4 accent-accion" />
        {kind === "curso" && modules.length > 0
          ? "Es la prueba del Guardián del módulo (debe ser la última lección del módulo)"
          : "Es la prueba final contra el Guardián (debe ser la última lección)"}
      </label>}
      <div className="flex flex-wrap items-center gap-3">
        <Submit pending="Guardando…">{submitLabel}</Submit>
        <Notice state={state} />
      </div>
    </form>
  );
}

export function RowActions({ up, down, remove, removeConfirm, canUp, canDown, label }: {
  up: Quick; down: Quick; remove: Quick; removeConfirm: string; canUp: boolean; canDown: boolean; label: string;
}) {
  const { pending, state, run } = useQuick();
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button type="button" className="btn btn-ghost btn-sm" disabled={pending || !canUp} onClick={() => run(up)} aria-label={`Subir ${label}`}>↑</button>
      <button type="button" className="btn btn-ghost btn-sm" disabled={pending || !canDown} onClick={() => run(down)} aria-label={`Bajar ${label}`}>↓</button>
      <button type="button" className="btn btn-ghost btn-sm text-coral" disabled={pending} onClick={() => run(remove, removeConfirm)} aria-label={`Borrar ${label}`}>Borrar</button>
      <Notice state={state} />
    </div>
  );
}

const KIND_HELP: Record<ActivityKind, string> = {
  opcion: "Escribe de 2 a 6 opciones y marca la correcta.",
  vf: "Escribe una afirmación y marca si es verdadera o falsa.",
  completar: "El estudiante escribe la respuesta. Pon una respuesta aceptada por línea (no importan mayúsculas ni tildes).",
  ordenar: "Escribe los pasos en el orden correcto, uno por línea (2 a 6). El estudiante los verá desordenados.",
  relacionar: "Escribe de 2 a 6 parejas. El estudiante verá la columna derecha desordenada.",
};

export function QuestionForm({ action, question, submitLabel }: { action: FormAction; question?: EditableQuestion; submitLabel: string }) {
  const [state, run] = useActionState(action, undefined);
  const [kind, setKind] = useState<ActivityKind>(question?.kind ?? "opcion");
  const same = question?.kind === kind;
  const opts = [...(same ? question!.options : []), "", "", "", "", "", ""].slice(0, 6);
  const rights = [...(same ? question!.right : []), "", "", "", "", "", ""].slice(0, 6);
  const unique = same ? [...new Set(question!.options)] : [];
  return (
    <form action={run} className="space-y-3">
      {/* El tipo viaja en un campo oculto: al reiniciarse el formulario después de guardar, el selector no se desincroniza. */}
      <input type="hidden" name="kind" value={kind} />
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <Field label="Tipo de actividad">
          <select value={kind} onChange={(e) => setKind(e.target.value as ActivityKind)} className="input">
            {ACTIVITY_KINDS.map((k) => <option key={k} value={k}>{ACTIVITY_LABEL[k]}</option>)}
          </select>
        </Field>
        <Field label={kind === "vf" ? "Afirmación" : kind === "completar" ? "Pregunta (puedes usar ___ para el espacio)" : kind === "opcion" ? "Pregunta" : "Instrucción"}>
          <textarea name="prompt" defaultValue={question?.prompt ?? ""} required minLength={5} maxLength={400} rows={2} className="input" />
        </Field>
      </div>
      <p className="hint">{KIND_HELP[kind]}</p>
      {kind === "opcion" && (
        <fieldset key="opcion" className="space-y-2">
          <legend className="label">Opciones (de 2 a 6) · marca la correcta</legend>
          {opts.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" value={i} defaultChecked={same ? question!.correctIndex === i : i === 0} aria-label={`La opción ${i + 1} es la correcta`} className="size-4 shrink-0 accent-[#4ade80]" />
              <input name={`option${i}`} defaultValue={o} maxLength={200} placeholder={i < 2 ? `Opción ${i + 1}` : `Opción ${i + 1} (opcional)`} className="input !py-2" aria-label={`Opción ${i + 1}`} />
            </div>
          ))}
        </fieldset>
      )}
      {kind === "vf" && (
        <fieldset key="vf" className="flex flex-wrap gap-4">
          <legend className="label">La afirmación es…</legend>
          {["Verdadera", "Falsa"].map((t, i) => (
            <label key={t} className="flex items-center gap-2">
              <input type="radio" name="correct" value={i} defaultChecked={same ? question!.correctIndex === i : i === 0} className="size-4 accent-[#4ade80]" /> {t}
            </label>
          ))}
        </fieldset>
      )}
      {kind === "completar" && (
        <Field label="Respuestas aceptadas (una por línea)">
          <textarea key="completar" name="answers" defaultValue={unique.join("\n")} required rows={3} className="input" placeholder={"fotosíntesis\nla fotosíntesis"} />
        </Field>
      )}
      {kind === "ordenar" && (
        <Field label="Pasos en el orden correcto (uno por línea)">
          <textarea key="ordenar" name="steps" defaultValue={same ? question!.options.join("\n") : ""} required rows={5} className="input" placeholder={"Leer el problema\nHacer un plan\nResolver\nRevisar"} />
        </Field>
      )}
      {kind === "relacionar" && (
        <fieldset key="relacionar" className="space-y-2">
          <legend className="label">Parejas (de 2 a 6)</legend>
          {opts.map((o, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input name={`left${i}`} defaultValue={o} maxLength={200} placeholder={`Elemento ${i + 1}`} className="input !py-2" aria-label={`Pareja ${i + 1}, izquierda`} />
              <span aria-hidden="true" className="text-muted">→</span>
              <input name={`right${i}`} defaultValue={rights[i]} maxLength={200} placeholder="Su pareja" className="input !py-2" aria-label={`Pareja ${i + 1}, derecha`} />
            </div>
          ))}
        </fieldset>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Pista (ayuda «Pista»)"><textarea name="hint" defaultValue={question?.hint ?? ""} maxLength={200} rows={2} className="input" /></Field>
        <Field label="Explicación (se muestra al responder)"><textarea name="explanation" defaultValue={question?.explanation ?? ""} maxLength={500} rows={2} className="input" /></Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Submit pending="Guardando…">{submitLabel}</Submit>
        <Notice state={state} />
      </div>
    </form>
  );
}

/** Módulo de un curso corto: título, descripción y su Guardián. */
export function ModuleForm({ action, module, guardians, submitLabel }: {
  action: FormAction; module?: Module; guardians: { slug: string; name: string; obstacle: string }[]; submitLabel: string;
}) {
  const [state, run] = useActionState(action, undefined);
  return (
    <form action={run} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Título del módulo"><input name="title" defaultValue={module?.title ?? ""} required minLength={2} maxLength={80} className="input" /></Field>
        <Field label="Guardián del módulo" hint="Es el jefe de la última lección del módulo y trae su parte de la historia.">
          <select name="guardian" defaultValue={module?.guardian ?? guardians[0]?.slug} className="input">
            {guardians.map((g) => <option key={g.slug} value={g.slug}>{g.name} · {g.obstacle}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Descripción del módulo (opcional)"><textarea name="summary" defaultValue={module?.summary ?? ""} maxLength={400} rows={2} className="input" /></Field>
      <div className="flex flex-wrap items-center gap-3">
        <Submit pending="Guardando…">{submitLabel}</Submit>
        <Notice state={state} />
      </div>
    </form>
  );
}

/** «Ofrecer gratis»: el curso completo queda abierto para todos los estudiantes. */
export function FreeToggle({ free, toggle }: { free: boolean; toggle: Quick }) {
  const { pending, state, run } = useQuick();
  const [on, setOn] = useState(free);
  return (
    <div className="space-y-1">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={on} disabled={pending} className="size-4 accent-[#4ade80]"
          onChange={() => {
            if (!on && !confirm("¿Ofrecer este curso gratis? Cualquier estudiante podrá hacerlo completo, sin pagar.")) return;
            setOn(!on);
            run(toggle);
          }} />
        Ofrecer gratis (curso completo)
      </label>
      <Notice state={state} />
    </div>
  );
}
