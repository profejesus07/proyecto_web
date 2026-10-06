"use client";

import { Icon } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { assignStudentsAction, joinClassAction, leaveClassAction, manageClassAction, type ClassFormState } from "@/app/actions/classes";

function Submit({ children, pending }: { children: React.ReactNode; pending: string }) {
  const { pending: busy } = useFormStatus();
  return <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? pending : children}</button>;
}

function Notice({ state }: { state: ClassFormState }) {
  return (
    <div aria-live="polite">
      {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-err">{state.error}</p>}
      {state?.message && <p role="status" className="mt-2 text-sm font-medium text-green">{state.message}</p>}
    </div>
  );
}

export function CodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-lg border border-dashed border-[#b9a8f0] bg-[#f6f3ff] px-3.5 py-1.5 font-mono text-2xl font-bold tracking-[0.3em] text-[#3b1aa6]" aria-label={`Código de la clase: ${code.split("").join(" ")}`}>{code}</span>
      <button type="button" className="btn btn-secondary btn-sm" onClick={copy}><Icon name={copied ? "check" : "copy"} className="size-4" />{copied ? "Copiado" : "Copiar código"}</button>
    </div>
  );
}

export function ClassActions({ classId, name }: { classId: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [value, setValue] = useState(name);

  function run(action: "nuevo_codigo" | "renombrar" | "archivar", arg?: string, after?: () => void) {
    setError(null);
    start(async () => {
      const r = await manageClassAction(classId, action, arg);
      if (!r.ok) setError(r.error ?? "No pudimos guardar el cambio.");
      else {
        after?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      {renaming ? (
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); run("renombrar", value, () => setRenaming(false)); }}>
          <label htmlFor="rename" className="sr-only">Nuevo nombre</label>
          <input id="rename" value={value} onChange={(e) => setValue(e.target.value)} minLength={2} maxLength={60} required className="input min-w-0 flex-1" autoFocus />
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>Guardar</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRenaming(false)}>Cancelar</button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setRenaming(true)}>Renombrar</button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending}
            onClick={() => { if (confirm("El código actual dejará de funcionar. Quienes ya están en la clase siguen dentro. ¿Generar uno nuevo?")) run("nuevo_codigo"); }}>
            Nuevo código
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending}
            onClick={() => { if (confirm("El grupo se archivará: nadie más podrá unirse y dejará de aparecer a sus estudiantes. ¿Archivar?")) run("archivar", undefined, () => router.push("/admin/grupos")); }}>
            Archivar
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-sm font-medium text-err">{error}</p>}
    </div>
  );
}

export function RemoveStudentButton({ classId, studentId, name }: { classId: string; studentId: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn btn-ghost btn-sm" disabled={pending} aria-label={`Quitar a ${name} del grupo`}
      onClick={() => {
        if (!confirm(`¿Quitar a ${name} del grupo? Su progreso no se borra.`)) return;
        start(async () => {
          const r = await manageClassAction(classId, "quitar", studentId);
          if (r.ok) router.refresh();
        });
      }}>
      Quitar
    </button>
  );
}

export function JoinClassForm() {
  const [state, action] = useActionState(joinClassAction, undefined);
  return (
    <form action={action} className="space-y-2">
      <label htmlFor="class-code" className="label">Código de la clase</label>
      <div className="flex flex-wrap gap-2">
        <input id="class-code" name="code" required maxLength={8} autoComplete="off" autoCapitalize="characters" spellCheck={false}
          placeholder="ABC234" className="input min-w-0 flex-1 font-mono uppercase tracking-[0.2em]" />
        <Submit pending="Uniéndote…">Unirme</Submit>
      </div>
      <Notice state={state} />
    </form>
  );
}

export function LeaveClassButton({ classId, name }: { classId: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn btn-ghost btn-sm" disabled={pending}
      onClick={() => {
        if (!confirm(`¿Salir de «${name}»? Tu docente dejará de ver tu avance.`)) return;
        start(async () => {
          await leaveClassAction(classId);
          router.refresh();
        });
      }}>
      Salir
    </button>
  );
}

/** El administrador elige estudiantes (con búsqueda) y los asigna al grupo. */
export function AssignStudents({ classId, students }: { classId: string; students: { id: string; name: string; email: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const shown = students.filter((s) => norm(`${s.name} ${s.email}`).includes(norm(q.trim())));
  const toggle = (id: string) => setChosen((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  if (!students.length) return <p className="text-sm text-muted">Todos los estudiantes registrados ya están en este grupo.</p>;
  return (
    <div className="space-y-3">
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <label htmlFor={`buscar-${classId}`} className="sr-only">Buscar estudiantes para asignar</label>
        <input id={`buscar-${classId}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o correo" className="input !pl-9" />
      </div>
      <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-xl border border-line">
        {shown.length === 0 && <li className="px-4 py-3 text-sm text-muted">Nadie coincide con la búsqueda.</li>}
        {shown.map((s) => (
          <li key={s.id}>
            <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-[#fafafd]">
              <input type="checkbox" checked={chosen.has(s.id)} onChange={() => toggle(s.id)} className="size-4 accent-[#4a22c9]" aria-label={`Asignar a ${s.name}`} />
              <span className="min-w-0"><span className="block truncate font-medium">{s.name}</span><span className="block truncate text-xs text-muted">{s.email}</span></span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary btn-sm" disabled={pending || chosen.size === 0}
          onClick={() => start(async () => {
            const r = await assignStudentsAction(classId, [...chosen]);
            setMsg(r.added ? { ok: true, text: `${r.added} ${r.added === 1 ? "estudiante asignado" : "estudiantes asignados"}.${r.error ? ` ${r.error}` : ""}` } : { ok: false, text: r.error ?? "No pudimos asignar." });
            if (r.added) { setChosen(new Set()); router.refresh(); }
          })}>
          <Icon name="plus" className="size-4" /> Asignar {chosen.size > 0 ? `(${chosen.size})` : ""}
        </button>
        <p aria-live="polite" className={`text-sm font-medium ${msg?.ok ? "text-ok" : "text-err"}`}>{msg?.text}</p>
      </div>
    </div>
  );
}
