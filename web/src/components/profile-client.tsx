"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { buyItemAction, selectAvatarAction, updateDisplayNameAction } from "@/app/actions/game";
import { AvatarFace } from "@/components/avatar-face";
import { AVATAR_BASES, AVATAR_NAMES, type AvatarBase } from "@/lib/data/types";

export function AvatarPicker({ current, rank }: { current: AvatarBase; rank: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState<AvatarBase>(current);
  const [error, setError] = useState<string | null>(null);

  function pick(base: AvatarBase) {
    if (base === value) return;
    const before = value;
    setValue(base);
    setError(null);
    start(async () => {
      const r = await selectAvatarAction(base);
      if (!r.ok) {
        setValue(before);
        setError("No pudimos cambiar tu avatar. Inténtalo de nuevo.");
      } else router.refresh();
    });
  }

  return (
    <fieldset disabled={pending} className="space-y-2">
      <legend className="label">Cambiar de avatar</legend>
      <div className="flex gap-2">
        {AVATAR_BASES.map((b) => (
          <label key={b} className="cursor-pointer">
            <input type="radio" name="avatar" value={b} checked={value === b} onChange={() => pick(b)} className="peer sr-only" />
            <span className="flex flex-col items-center gap-1 rounded-xl border-2 border-line bg-bg/40 p-2 transition peer-checked:border-gold peer-checked:bg-gold/10 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan hover:border-[#5a52b8]">
              <AvatarFace base={b} rank={rank} size={52} />
              <span className="text-xs font-bold">{AVATAR_NAMES[b]}</span>
            </span>
          </label>
        ))}
      </div>
      {error && <p role="alert" className="text-sm font-medium text-[#ffb3b3]">{error}</p>}
    </fieldset>
  );
}

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

export function BuyButton({ itemId, price, coins, owned, open, stack }: { itemId: string; price: number; coins: number; owned: boolean; open: boolean; stack?: Stack }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (owned) return <span className="chip !border-green/60 !bg-green/15 text-sm text-[#b6f5cb]">✔ Ya lo tienes</span>;
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
    </div>
  );
}
