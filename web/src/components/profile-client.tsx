"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { buyItemAction, updateDisplayNameAction } from "@/app/actions/game";

export function DisplayNameForm({ current }: { current: string }) {
  const [state, action, pending] = useActionState(updateDisplayNameAction, null);
  return (
    <form action={action} className="space-y-2">
      <label htmlFor="displayName" className="label">Nombre de aventurero</label>
      <div className="flex flex-wrap gap-2">
        <input id="displayName" name="displayName" defaultValue={current} required minLength={2} maxLength={24} autoComplete="nickname" className="input min-w-0 flex-1" aria-describedby="displayName-msg" />
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</button>
      </div>
      <p id="displayName-msg" aria-live="polite" className={`text-sm font-medium ${state?.ok ? "text-green" : "text-[#ffb3b3]"}`}>{state?.message}</p>
    </form>
  );
}

interface Stack {
  have: number;
  max: number;
  dailyCap: number;
  /** Rango necesario si todavía no se puede comprar. */
  locked: string | null;
}

export function BuyButton({ itemId, price, coins, owned, open = true, stack, use }: { itemId: string; price: number; coins: number; owned: boolean; open?: boolean; stack?: Stack; /** Dónde usarlo después de comprarlo (p. ej. el Vestidor). */ use?: { href: string; label: string } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const useLink = use && <Link href={use.href} className="btn btn-secondary btn-sm w-full">{use.label}</Link>;
  if (owned) {
    return (
      <div className="space-y-2">
        <span className="chip !border-green/60 !bg-green/15 text-sm text-[#b6f5cb]">✔ Ya lo tienes</span>
        {useLink}
      </div>
    );
  }
  if (!open) return <span className="chip text-sm text-muted" title="La compra se abrirá pronto">🪙 {price} · Próximamente</span>;
  if (stack?.locked) return <span className="chip text-sm text-muted">🔒 Se desbloquea en rango {stack.locked}</span>;
  const poor = coins < price;
  const full = !!stack && stack.have >= stack.max;

  return (
    <div className="space-y-1.5">
      {stack && (
        <p className="flex justify-between text-xs text-muted">
          <span>En tu mochila: <strong className="text-text">{stack.have}</strong> / {stack.max}</span>
          <span>Máx. {stack.dailyCap} al día</span>
        </p>
      )}
      <button
        type="button"
        className="btn btn-primary btn-sm w-full"
        disabled={pending || poor || full}
        onClick={() =>
          start(async () => {
            const r = await buyItemAction(itemId);
            setMsg(r.ok ? { ok: true, text: r.quantity ? `¡+1 ${r.name}! Ahora tienes ${r.quantity}.` : `¡Conseguiste ${r.name}!` } : { ok: false, text: r.error });
            if (r.ok) router.refresh();
          })
        }
      >
        {pending ? "Comprando…" : full ? "Mochila llena" : <>🪙 {price} · Comprar</>}
      </button>
      {poor && !full && !msg && <p className="text-center text-xs text-muted">Te faltan {price - coins} monedas</p>}
      <p aria-live="polite" className={`text-center text-xs font-medium ${msg?.ok ? "text-green" : "text-[#ffb3b3]"}`}>{msg?.text}</p>
      {msg?.ok && useLink}
    </div>
  );
}
