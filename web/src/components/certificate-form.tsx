"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { CertState } from "@/app/actions/certificates";
import { DOC_TYPES } from "@/lib/certificates";

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>{pending ? "Expidiendo…" : "Expedir mi constancia"}</button>;
}

export function CertificateRequestForm({ action }: { action: (prev: CertState, fd: FormData) => Promise<CertState> }) {
  const [state, run] = useActionState(action, undefined);
  return (
    <form action={run} className="space-y-5">
      <div>
        <label htmlFor="name" className="label">Nombre completo (como aparece en tu documento)</label>
        <input id="name" name="name" required minLength={5} maxLength={120} autoComplete="name" className="input" placeholder="Nombres y apellidos" />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
        <div>
          <label htmlFor="docType" className="label">Tipo de documento</label>
          <select id="docType" name="docType" required className="input" defaultValue="CC">
            {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="docNumber" className="label">Número de documento</label>
          <input id="docNumber" name="docNumber" required minLength={4} maxLength={20} pattern="[A-Za-z0-9\-]{4,20}" inputMode="text" autoComplete="off" className="input" />
        </div>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-bg/40 p-3 text-sm">
        <input type="checkbox" name="confirm" required className="mt-1 size-5 shrink-0 accent-accion" />
        <span>Confirmo que mis datos son correctos. Entiendo que <strong>la constancia no se puede modificar</strong> una vez expedida.</span>
      </label>
      <div aria-live="polite">{state?.error && <p role="alert" className="rounded-xl border border-coral/50 bg-coral/10 px-4 py-3 text-sm font-medium text-err">{state.error}</p>}</div>
      <Submit />
    </form>
  );
}
