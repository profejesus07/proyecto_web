"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  assignTeacherAction, createLinkedClassAction, createTeacherAction, grantAccessAction, resetPasswordAction, revokeAccessAction, setPriceAction, setRoleAction, type AdminFormState,
} from "@/app/actions/admin";

function Submit({ children, pending, className = "btn btn-primary" }: { children: React.ReactNode; pending: string; className?: string }) {
  const { pending: busy } = useFormStatus();
  return <button type="submit" className={className} disabled={busy}>{busy ? pending : children}</button>;
}

function Notice({ state }: { state: AdminFormState }) {
  return (
    <div aria-live="polite">
      {state?.error && <p role="alert" className="text-sm font-medium text-err">{state.error}</p>}
      {state?.message && !state.password && <p role="status" className="text-sm font-medium text-green">{state.message}</p>}
    </div>
  );
}

export function CreateTeacherForm() {
  const [state, action] = useActionState(createTeacherAction, undefined);
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-4">
      <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="t-name" className="label">Nombre que verán sus estudiantes</label>
          <input id="t-name" name="name" required minLength={2} maxLength={24} placeholder="Profe Ana" className="input" />
        </div>
        <div>
          <label htmlFor="t-email" className="label">Correo del docente</label>
          <input id="t-email" name="email" type="email" required placeholder="ana@colegio.edu.co" className="input" />
        </div>
        <Submit pending="Creando…">Crear cuenta</Submit>
      </form>
      <Notice state={state} />
      {state?.password && (
        <div role="status" className="space-y-2 rounded-2xl border border-green/50 bg-green/10 p-4">
          <p className="font-semibold text-ok">✔ {state.message}</p>
          <p className="text-sm">Envíale estos datos para que ingrese. <strong>La contraseña solo se muestra ahora</strong>; pídele que la cambie en Perfil → Cambiar mi contraseña.</p>
          <dl className="grid gap-1 rounded-xl bg-bg/50 p-3 font-mono text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
            <dt className="text-muted">Correo</dt><dd>{state.email}</dd>
            <dt className="text-muted">Contraseña temporal</dt><dd className="font-bold text-gold">{state.password}</dd>
          </dl>
          <button type="button" className="btn btn-secondary btn-sm" onClick={async () => {
            try {
              await navigator.clipboard.writeText(`Academia Virtual Umbral — tu cuenta de docente\nIngresa en: ${location.origin}/ingresar\nCorreo: ${state.email}\nContraseña temporal: ${state.password}\nCámbiala en Perfil → Cambiar mi contraseña.`);
              setCopied(true);
            } catch { setCopied(false); }
          }}>{copied ? "✔ Copiado" : "Copiar mensaje para enviar"}</button>
        </div>
      )}
    </div>
  );
}

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "No se pudo guardar.");
      else router.refresh();
    });
  }
  return { pending, error, run };
}

export function RoleSelect({ userId, role, name }: { userId: string; role: string; name: string }) {
  const { pending, error, run } = useRun();
  if (role === "admin") return <span className="chip text-xs">Administrador</span>;
  return (
    <div>
      <label htmlFor={`rol-${userId}`} className="sr-only">Rol de {name}</label>
      <select id={`rol-${userId}`} defaultValue={role} disabled={pending} className="input !w-auto !py-1.5 text-sm"
        onChange={(e) => {
          const next = e.target.value;
          if (next === "docente" && !confirm(`¿Dar a ${name} una cuenta de docente? Supervisará el avance de los estudiantes que le asignes y dejará de jugar.`)) { e.target.value = role; return; }
          run(() => setRoleAction(userId, next));
        }}>
        <option value="estudiante">Estudiante</option>
        <option value="familia">Familia</option>
        <option value="docente">Docente</option>
      </select>
      {error && <p role="alert" className="mt-1 text-xs text-err">{error}</p>}
    </div>
  );
}

export function AccessChip({ userId, course, title, expiresAt, expired }: { userId: string; course: string; title: string; expiresAt: string | null; expired: boolean }) {
  const { pending, run } = useRun();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold ${expired ? "bg-coral/15 text-err" : "bg-green/15 text-ok"}`}>
      {title}{expiresAt ? ` · ${expired ? "venció" : "hasta"} ${new Date(expiresAt).toLocaleDateString("es-CO")}` : ""}
      <button type="button" disabled={pending} aria-label={`Quitar acceso a ${title}`} className="rounded px-1 hover:bg-white/10"
        onClick={() => { if (confirm(`¿Quitar el acceso a «${title}»?`)) run(() => revokeAccessAction(userId, course)); }}>✕</button>
    </span>
  );
}

export function GrantAccess({ userId, name, courses }: { userId: string; name: string; courses: { slug: string; title: string }[] }) {
  const { pending, error, run } = useRun();
  const [course, setCourse] = useState(courses[0]?.slug ?? "");
  const [months, setMonths] = useState("0");
  if (!courses.length) return null;
  return (
    <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); run(() => grantAccessAction(userId, course, months === "0" ? null : Number(months))); }}>
      <label htmlFor={`c-${userId}`} className="sr-only">Curso para {name}</label>
      <select id={`c-${userId}`} value={course} onChange={(e) => setCourse(e.target.value)} className="input !w-auto !py-1.5 text-sm">
        {courses.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
      </select>
      <label htmlFor={`m-${userId}`} className="sr-only">Duración</label>
      <select id={`m-${userId}`} value={months} onChange={(e) => setMonths(e.target.value)} className="input !w-auto !py-1.5 text-sm">
        <option value="0">Sin vencimiento</option>
        <option value="-1">Hasta fin del año lectivo (clases)</option>
        <option value="1">1 mes</option>
        <option value="6">6 meses</option>
        <option value="12">1 año</option>
      </select>
      <button type="submit" disabled={pending} className="btn btn-secondary btn-sm">Activar</button>
      {error && <p role="alert" className="w-full text-xs text-err">{error}</p>}
    </form>
  );
}

export function PriceForm({ course, title, price, isFree }: { course: string; title: string; price: number | null; isFree: boolean }) {
  const [state, action] = useActionState(setPriceAction, undefined);
  const [free, setFree] = useState(isFree);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="course" value={course} />
      <label className="mr-2 flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="free" checked={free} onChange={(e) => setFree(e.target.checked)} className="size-4 accent-[var(--cyan)]" />
        Gratis
      </label>
      <label htmlFor={`p-${course}`} className="sr-only">Precio de {title} en pesos</label>
      <span className="text-muted">$</span>
      <input id={`p-${course}`} name="price" inputMode="numeric" defaultValue={price ?? ""} placeholder="Sin precio" disabled={free} className="input !w-36 !py-1.5 disabled:opacity-50" />
      {free && price !== null && <input type="hidden" name="price" value={price} />}
      <span className="text-sm text-muted">COP</span>
      <Submit pending="Guardando…" className="btn btn-secondary btn-sm">Guardar</Submit>
      <Notice state={state} />
    </form>
  );
}

/** Crea un grupo: un docente supervisa a sus estudiantes; si se liga a una clase, también les da su acceso anual. */
export function CreateLinkedClassForm({ clases, teachers }: { clases: { slug: string; title: string }[]; teachers: { id: string; name: string }[] }) {
  const [state, action] = useActionState(createLinkedClassAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.3fr_auto] md:items-end">
        <label className="block space-y-1"><span className="label">Nombre del grupo</span>
          <input name="name" required minLength={2} maxLength={60} placeholder="6.° A · Ciencias" className="input" />
        </label>
        <label className="block space-y-1"><span className="label">Docente que lo supervisa</span>
          <select name="teacher" className="input">{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        </label>
        <label className="block space-y-1"><span className="label">Clase (opcional)</span>
          <select name="course" className="input">
            <option value="">Ninguna: solo seguimiento</option>
            {clases.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
          </select>
        </label>
        <Submit pending="Creando…">Crear grupo</Submit>
      </div>
      <div aria-live="polite">
        {state?.error && <p role="alert" className="text-sm font-medium text-err">{state.error}</p>}
        {state?.message && (
          <p role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-green/50 bg-green/10 px-4 py-2 font-semibold text-ok">
            ✔ {state.message}
            {state.id && <Link href={`/admin/grupos/${state.id}`} className="text-accion underline underline-offset-4">Asignar estudiantes →</Link>}
          </p>
        )}
      </div>
    </form>
  );
}

export function TeacherSelect({ classId, teacherId, teachers, name }: { classId: string; teacherId: string; teachers: { id: string; name: string }[]; name: string }) {
  const { pending, error, run } = useRun();
  return (
    <div>
      <label htmlFor={`doc-${classId}`} className="sr-only">Docente de {name}</label>
      <select id={`doc-${classId}`} defaultValue={teacherId} disabled={pending} className="input !w-auto !py-1.5 text-sm"
        onChange={(e) => run(() => assignTeacherAction(classId, e.target.value))}>
        {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      {error && <p role="alert" className="mt-1 text-xs text-err">{error}</p>}
    </div>
  );
}

/** Pone una contraseña temporal nueva y la muestra una vez (para cuentas con usuario, que no tienen correo). */
export function ResetPassword({ userId, name }: { userId: string; name: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ password?: string; error?: string } | null>(null);
  if (result?.password) {
    return <span role="status" className="inline-flex items-center gap-2 rounded-lg bg-[#e7f6ee] px-2.5 py-1 text-xs text-ok">Nueva contraseña: <strong className="font-mono text-sm text-text">{result.password}</strong></span>;
  }
  return (
    <span className="inline-flex flex-col">
      <button type="button" className="btn btn-ghost btn-sm" disabled={pending} aria-label={`Nueva contraseña para ${name}`}
        onClick={() => { if (confirm(`¿Crear una contraseña nueva para ${name}? La actual dejará de funcionar.`)) start(async () => setResult(await resetPasswordAction(userId))); }}>
        Nueva contraseña
      </button>
      {result?.error && <span role="alert" className="text-xs text-err">{result.error}</span>}
    </span>
  );
}
