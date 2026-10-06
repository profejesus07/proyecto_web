"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { deleteClassAction, deleteCourseAction, deleteUserAction } from "@/app/actions/admin";

type Kind = "curso" | "grupo" | "cuenta";
const ACTION = { curso: deleteCourseAction, grupo: deleteClassAction, cuenta: deleteUserAction };

/**
 * Botón para eliminar con confirmación fuerte: abre un cuadro que explica qué se pierde
 * y pide escribir ELIMINAR. No se puede deshacer.
 */
export function DeleteButton({ kind, id, name, consequences }: { kind: Kind; id: string; name: string; consequences: string[] }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const inputId = useId();
  const [word, setWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ready = word.trim().toUpperCase() === "ELIMINAR";

  function open() {
    setWord("");
    setError(null);
    ref.current?.showModal();
  }
  function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    start(async () => {
      const r = await ACTION[kind](id, word);
      if (!r.ok) { setError(r.error ?? "No se pudo eliminar."); return; }
      ref.current?.close();
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" onClick={open} className="btn btn-sm border-coral/50 text-err hover:bg-coral/10" aria-label={`Eliminar ${kind} ${name}`}>
        Eliminar
      </button>
      <dialog ref={ref} aria-labelledby={titleId} className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-coral/40 bg-bg-2 p-0 text-text backdrop:bg-black/70">
        <form onSubmit={confirm} className="space-y-4 p-6">
          <h2 id={titleId} className="text-xl">¿Eliminar {kind === "cuenta" ? "la cuenta de" : kind === "grupo" ? "el grupo" : "el curso"} «{name}»?</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {consequences.map((c) => <li key={c}>{c}</li>)}
            <li className="font-semibold text-err">No se puede deshacer.</li>
          </ul>
          <div>
            <label htmlFor={inputId} className="label">Escribe <strong>ELIMINAR</strong> para confirmar</label>
            <input id={inputId} value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" spellCheck={false} className="input font-mono uppercase" />
          </div>
          {error && <p role="alert" className="text-sm font-medium text-err">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => ref.current?.close()}>Cancelar</button>
            <button type="submit" disabled={!ready || pending} className="btn bg-coral font-bold text-ink disabled:opacity-50">
              {pending ? "Eliminando…" : "Eliminar definitivamente"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
