"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { familyCodeAction, linkFamilyAction, readFamilyMessagesAction, sendFamilyMessageAction, unlinkFamilyAction } from "@/app/actions/family";
import { FAMILY_MESSAGES } from "@/content/elenco";

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Vinculando…" : "Vincular"}</button>;
}

/** La familia escribe el código de 8 caracteres que le dio el estudiante. */
export function LinkFamilyForm() {
  const [state, action] = useActionState(linkFamilyAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <label htmlFor="family-code" className="label">Código de familia</label>
      <div className="flex flex-wrap gap-2">
        <input id="family-code" name="code" required autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={12}
          placeholder="Ej.: K7PQ2MXA" className="input min-w-0 flex-1 font-mono uppercase tracking-widest" aria-describedby="family-code-hint" />
        <Submit />
      </div>
      <p id="family-code-hint" className="hint">Tu hijo o hija lo encuentra en su perfil, en «Mi familia».</p>
      <div aria-live="polite">
        {state?.error && <p role="alert" className="text-sm font-medium text-[#ffb3b3]">{state.error}</p>}
        {state?.message && <p role="status" className="text-sm font-medium text-green">{state.message}</p>}
      </div>
    </form>
  );
}

/** Botón para desvincular (lo usan la familia y el estudiante). */
export function UnlinkButton({ otherId, label, confirmText }: { otherId: string; label: string; confirmText: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button type="button" className="btn btn-ghost btn-sm" disabled={pending}
        onClick={() => {
          if (!window.confirm(confirmText)) return;
          start(async () => {
            const r = await unlinkFamilyAction(otherId);
            if (r.ok) router.refresh();
            else setError(r.error ?? "No se pudo.");
          });
        }}>
        {pending ? "Quitando…" : label}
      </button>
      {error && <span role="alert" className="text-xs text-[#ffb3b3]">{error}</span>}
    </span>
  );
}

/** El estudiante ve su código (se crea al pedirlo) y puede cambiarlo. */
export function FamilyCodeCard() {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  function load(renew: boolean) {
    setError(null);
    start(async () => {
      const r = await familyCodeAction(renew);
      if (r.ok && r.code) setCode(r.code);
      else setError(r.error ?? "No se pudo.");
    });
  }

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!code) {
    return (
      <div className="space-y-2">
        <button type="button" className="btn btn-secondary btn-sm" disabled={pending} onClick={() => load(false)}>
          {pending ? "Cargando…" : "👪 Mostrar mi código de familia"}
        </button>
        {error && <p role="alert" className="text-sm text-[#ffb3b3]">{error}</p>}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl border-2 border-dashed border-gold/70 bg-gold/10 px-4 py-2 font-mono text-2xl font-bold tracking-[0.25em] text-gold"
          aria-label={`Tu código de familia: ${code.split("").join(" ")}`}>{code}</span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>{copied ? "✔ Copiado" : "Copiar"}</button>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" disabled={pending}
        onClick={() => window.confirm("¿Cambiar el código? El anterior dejará de servir (las familias ya vinculadas siguen vinculadas).") && load(true)}>
        {pending ? "Cambiando…" : "Cambiar código"}
      </button>
      {error && <p role="alert" className="text-sm text-[#ffb3b3]">{error}</p>}
    </div>
  );
}

/** La familia elige una frase de apoyo y se la envía a su hijo o hija. */
export function SendMessage({ studentId, name, left }: { studentId: string; name: string; left: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [choice, setChoice] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [remaining, setRemaining] = useState(left);

  function send() {
    if (!choice) return;
    start(async () => {
      const r = await sendFamilyMessageAction(studentId, choice);
      if (r.ok) {
        setRemaining(r.remaining ?? 0);
        setMsg({ ok: true, text: `¡Enviado! ${name} lo verá al entrar al Gremio.` });
        setChoice(null);
        router.refresh();
      } else setMsg({ ok: false, text: r.error ?? "No se pudo enviar." });
    });
  }

  return (
    <fieldset disabled={pending || remaining <= 0} className="space-y-3">
      <legend className="label">Envíale un mensaje de apoyo</legend>
      <div className="flex flex-wrap gap-2">
        {Object.entries(FAMILY_MESSAGES).map(([key, m]) => (
          <label key={key} className="cursor-pointer">
            <input type="radio" name={`msg-${studentId}`} checked={choice === key} onChange={() => { setChoice(key); setMsg(null); }} className="peer sr-only" />
            <span className="block rounded-full border-2 border-line bg-bg/40 px-3 py-1.5 text-sm transition peer-checked:border-gold peer-checked:bg-gold/10 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan">{m.text}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary btn-sm" disabled={!choice || pending} onClick={send}>{pending ? "Enviando…" : "💌 Enviar"}</button>
        <span className="text-xs text-muted">{remaining > 0 ? `Te quedan ${remaining} hoy.` : "Ya enviaste los mensajes de hoy."}</span>
      </div>
      <p aria-live="polite" className={`text-sm font-medium ${msg?.ok ? "text-green" : "text-[#ffb3b3]"}`}>{msg?.text}</p>
    </fieldset>
  );
}

/** El estudiante agradece los mensajes (quedan como leídos). */
export function ThanksButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn btn-secondary btn-sm" disabled={pending}
      onClick={() => start(async () => { await readFamilyMessagesAction(); router.refresh(); })}>
      {pending ? "…" : "💛 ¡Gracias!"}
    </button>
  );
}
