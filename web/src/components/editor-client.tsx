"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { createCourseAction, type EditorState } from "@/app/actions/content";
import { GRADES, PERIODS } from "@/lib/content";
import type { CourseKind, EditableQuestion, MissionSummary } from "@/lib/data/types";

type FormAction = (prev: EditorState, fd: FormData) => Promise<EditorState>;
type Quick = () => Promise<EditorState>;

function Submit({ children, pending, className = "btn btn-primary btn-sm" }: { children: React.ReactNode; pending: string; className?: string }) {
  const { pending: busy } = useFormStatus();
  return <button type="submit" className={className} disabled={busy}>{busy ? pending : children}</button>;
}

function Notice({ state }: { state: EditorState }) {
  return (
    <div aria-live="polite" className="empty:hidden">
      {state?.error && <p role="alert" className="text-sm font-medium text-[#ffb3b3]">{state.error}</p>}
      {state?.problems && <ul className="mt-1 list-disc pl-5 text-sm text-[#ffe3a0]">{state.problems.map((p) => <li key={p}>{p}</li>)}</ul>}
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
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1"><Field label="Título"><input name="title" required minLength={3} maxLength={80} placeholder="Ej.: Matemáticas 6.° · 2027" className="input" /></Field></div>
        <Submit pending="Creando…" className="btn btn-primary">Crear y editar</Submit>
      </div>
      <Notice state={state} />
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
        <span className={`chip text-sm ${published ? "!border-green/60 !bg-green/15 text-[#b6f5cb]" : "text-muted"}`}>{published ? "● Publicado" : "○ Borrador"}</span>
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

export function MissionForm({ action, kind, mission, submitLabel }: { action: FormAction; kind: CourseKind; mission?: MissionSummary; submitLabel: string }) {
  const [state, run] = useActionState(action, undefined);
  return (
    <form action={run} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Field label="Título de la lección"><input name="title" defaultValue={mission?.title ?? ""} required minLength={3} maxLength={120} className="input" /></Field>
        {kind === "clase" && (
          <Field label="Periodo">
            <select name="period" defaultValue={mission?.period ?? ""} className="input">
              <option value="">—</option>
              {PERIODS.map((p) => <option key={p} value={p}>{p}.° periodo</option>)}
            </select>
          </Field>
        )}
        <Field label="XP"><input name="xpReward" type="number" min={0} max={1000} defaultValue={mission?.xpReward ?? 50} className="input !w-24" /></Field>
      </div>
      <Field label="Introducción (la dice Sora antes de empezar)"><textarea name="intro" defaultValue={mission?.intro ?? ""} maxLength={400} rows={2} className="input" /></Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isBoss" defaultChecked={mission?.isBoss ?? false} className="size-4 accent-[#2ee6d6]" />
        Es la prueba final contra el Guardián (debe ser la última lección)
      </label>
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

export function QuestionForm({ action, question, submitLabel }: { action: FormAction; question?: EditableQuestion; submitLabel: string }) {
  const [state, run] = useActionState(action, undefined);
  const opts = [...(question?.options ?? []), "", "", "", "", "", ""].slice(0, 6);
  return (
    <form action={run} className="space-y-3">
      <Field label="Pregunta"><textarea name="prompt" defaultValue={question?.prompt ?? ""} required minLength={5} maxLength={400} rows={2} className="input" /></Field>
      <fieldset className="space-y-2">
        <legend className="label">Opciones (de 2 a 6) · marca la correcta</legend>
        {opts.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="correct" value={i} defaultChecked={question ? question.correctIndex === i : i === 0} aria-label={`La opción ${i + 1} es la correcta`} className="size-4 shrink-0 accent-[#4ade80]" />
            <input name={`option${i}`} defaultValue={o} maxLength={200} placeholder={i < 2 ? `Opción ${i + 1}` : `Opción ${i + 1} (opcional)`} className="input !py-2" aria-label={`Opción ${i + 1}`} />
          </div>
        ))}
      </fieldset>
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
