"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { createClassAction, joinClassAction, leaveClassAction, manageClassAction, type ClassFormState } from "@/app/actions/classes";

function Submit({ children, pending }: { children: React.ReactNode; pending: string }) {
  const { pending: busy } = useFormStatus();
  return <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? pending : children}</button>;
}

function Notice({ state }: { state: ClassFormState }) {
  return (
    <div aria-live="polite">
      {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-[#ffb3b3]">{state.error}</p>}
      {state?.message && <p role="status" className="mt-2 text-sm font-medium text-green">{state.message}</p>}
    </div>
  );
}

export function CreateClassForm() {
  const [state, action] = useActionState(createClassAction, undefined);
  return (
    <form action={action} className="panel space-y-3 p-5">
      <label htmlFor="class-name" className="label">Nombre de la clase</label>
      <div className="flex flex-wrap gap-2">
        <input id="class-name" name="name" required minLength={2} maxLength={60} placeholder="Por ejemplo: 6.º B · Ciencias" className="input min-w-0 flex-1" />
        <Submit pending="Creando…">Crear clase</Submit>
      </div>
      <p className="hint">Recibirás un código de 6 caracteres para compartir con tus estudiantes.</p>
      <Notice state={state} />
    </form>
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
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-xl border-2 border-dashed border-gold/70 bg-gold/10 px-4 py-2 font-mono text-3xl font-bold tracking-[0.3em] text-gold" aria-label={`Código de la clase: ${code.split("").join(" ")}`}>{code}</span>
      <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>{copied ? "✔ Copiado" : "Copiar código"}</button>
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
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setRenaming(true)}>✏️ Renombrar</button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending}
            onClick={() => { if (confirm("El código actual dejará de funcionar. Quienes ya están en la clase siguen dentro. ¿Generar uno nuevo?")) run("nuevo_codigo"); }}>
            🔄 Nuevo código
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending}
            onClick={() => { if (confirm("La clase se archivará: nadie más podrá unirse y dejará de aparecer a tus estudiantes. ¿Archivar?")) run("archivar", undefined, () => router.push("/maestro")); }}>
            🗄️ Archivar
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-sm font-medium text-[#ffb3b3]">{error}</p>}
    </div>
  );
}

export function RemoveStudentButton({ classId, studentId, name }: { classId: string; studentId: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn btn-ghost btn-sm" disabled={pending} aria-label={`Quitar a ${name} de la clase`}
      onClick={() => {
        if (!confirm(`¿Quitar a ${name} de la clase? Su progreso no se borra.`)) return;
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
