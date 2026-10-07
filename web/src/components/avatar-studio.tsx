"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveAvatarAction } from "@/app/actions/game";
import { AvatarFace } from "@/components/avatar-face";
import { Sprite, asset } from "@/components/sprite";
import { BASE_PALETTE, EYES, GEAR, HAIR, PANTS, SKIN, TOP, WEAR_LABEL, WEAR_SLOTS, avatarSrc, canWearGear, gearRank, sanitizeLook, type AvatarLook, type WearSlot, type Swatch } from "@/lib/avatar-look";
import { HAIRSTYLES } from "@/lib/avatar-hair";
import { AVATAR_BASES, AVATAR_NAMES, type AvatarBase } from "@/lib/data/types";
import { RANKS, type RankKey } from "@/lib/game/ranks";

type ColorSlot = "skin" | "hair" | "eyes" | "top" | "pants";

const DEFAULT_EYES: Record<AvatarBase, number> = { aria: 1, leo: 0, tomas: 0, nuri: 1 };

function originalColor(base: AvatarBase, slot: ColorSlot): string {
  const p = BASE_PALETTE[base];
  if (slot === "skin") return p.skin[0];
  if (slot === "hair") return p.hair[0];
  if (slot === "top") return p.top[0];
  if (slot === "pants") return "#1E1B4B";
  return EYES[DEFAULT_EYES[base]].stops[1];
}

const ROWS: { slot: ColorSlot; title: string; swatches: readonly Swatch[] }[] = [
  { slot: "skin", title: "Piel", swatches: SKIN },
  { slot: "hair", title: "Cabello", swatches: HAIR },
  { slot: "eyes", title: "Ojos", swatches: EYES.map((e) => ({ name: e.name, color: e.stops[1] })) },
  { slot: "top", title: "Chaqueta", swatches: TOP },
  { slot: "pants", title: "Pantalón", swatches: PANTS },
];

function ColorRow({ title, slot, swatches, base, value, onPick }: { title: string; slot: ColorSlot; swatches: readonly Swatch[]; base: AvatarBase; value: number | undefined; onPick: (v: number | undefined) => void }) {
  const opts: { key: string; name: string; color: string; v: number | undefined }[] = [
    { key: "o", name: "Original", color: originalColor(base, slot), v: undefined },
    ...swatches.map((s, i) => ({ key: String(i), name: s.name, color: s.color, v: i })),
  ];
  const current = opts.find((o) => o.v === value) ?? opts[0];
  return (
    <fieldset className="space-y-2">
      <legend className="label">{title} <span className="font-normal text-muted">· {current.name}</span></legend>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <label key={o.key} className="cursor-pointer" title={o.name}>
            <input type="radio" name={slot} checked={o.v === value} onChange={() => onPick(o.v)} className="peer sr-only" aria-label={o.name} />
            <span
              className={`grid size-10 place-items-center rounded-full border-2 border-line transition peer-checked:scale-110 peer-checked:border-cyan peer-checked:shadow-[0_0_0_3px_color-mix(in_srgb,var(--cyan)_35%,transparent)] peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan ${o.v === undefined ? "border-dashed" : ""}`}
              style={{ background: o.color }}
            >
              {o.v === undefined && <span aria-hidden="true" className="text-[10px] font-extrabold text-white drop-shadow-[0_1px_1px_#000]">ORIG</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function StyleOption({ label, checked, onPick, base, rank, look }: { label: string; checked: boolean; onPick: () => void; base: AvatarBase; rank: RankKey; look: AvatarLook }) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name="style" checked={checked} onChange={onPick} className="peer sr-only" aria-label={label} />
      <span className="flex h-full flex-col items-center gap-1 rounded-xl border-2 border-line bg-bg/40 p-1.5 text-center transition peer-checked:border-cyan peer-checked:bg-cyan/10 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan">
        <AvatarFace base={base} rank={rank} look={{ ...look, gear: "E" }} size={52} />
        <span className="text-[11px] font-bold leading-tight">{label}</span>
      </span>
    </label>
  );
}

export interface OwnedOption { id: string; name: string; image: string }
export interface OwnedItems { wear: Record<WearSlot, OwnedOption[]>; frames: OwnedOption[]; titles: OwnedOption[]; pets: OwnedOption[] }

/** Fila de objetos que tiene: «Ninguno» + los suyos. */
function ItemRow({ title, name, options, value, onPick, none = "Ninguno", round = false }: { title: string; name: string; options: OwnedOption[]; value: string | undefined; onPick: (v: string | undefined) => void; none?: string | null; round?: boolean }) {
  const current = options.find((o) => o.id === value);
  return (
    <fieldset className="space-y-2">
      <legend className="label">{title} <span className="font-normal text-muted">· {current?.name ?? none ?? ""}</span></legend>
      <div className="flex flex-wrap gap-2">
        {none !== null && (
          <label className="cursor-pointer">
            <input type="radio" name={name} checked={!value} onChange={() => onPick(undefined)} className="peer sr-only" aria-label={none} />
            <span className="grid size-16 place-items-center rounded-xl border-2 border-dashed border-line bg-bg/40 text-xs font-bold text-muted transition peer-checked:border-cyan peer-checked:bg-cyan/10 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan">{none}</span>
          </label>
        )}
        {options.map((o) => (
          <label key={o.id} className="cursor-pointer" title={o.name}>
            <input type="radio" name={name} checked={value === o.id} onChange={() => onPick(o.id)} className="peer sr-only" aria-label={o.name} />
            <span className={`grid size-16 place-items-center overflow-hidden rounded-xl border-2 border-line bg-bg/40 transition peer-checked:border-cyan peer-checked:bg-cyan/10 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan ${round ? "p-0.5" : "p-1"}`}>
              <Sprite src={o.image} alt="" decorative className="size-full object-contain" />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function AvatarStudio({ initialBase, initialLook, rank, owned }: { initialBase: AvatarBase; initialLook: AvatarLook; rank: RankKey; owned: OwnedItems }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [base, setBase] = useState<AvatarBase>(initialBase);
  const [look, setLook] = useState<AvatarLook>(initialLook);
  const [saved, setSaved] = useState(() => JSON.stringify({ b: initialBase, l: initialLook }));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = JSON.stringify({ b: base, l: look }) !== saved;

  function set<K extends keyof AvatarLook>(key: K, v: AvatarLook[K]) {
    setMsg(null);
    setLook((l) => {
      const next = { ...l };
      if (v === undefined) delete next[key];
      else next[key] = v;
      return next;
    });
  }

  function save() {
    start(async () => {
      const r = await saveAvatarAction(base, look);
      if (r.ok) {
        setSaved(JSON.stringify({ b: base, l: look }));
        setMsg({ ok: true, text: "¡Listo! Tu avatar se guardó." });
        router.refresh();
      } else setMsg({ ok: false, text: "No pudimos guardar tu avatar. Inténtalo de nuevo." });
    });
  }

  const wearing = gearRank(rank, look) as RankKey;
  const colors: AvatarLook = { ...look, gear: undefined };
  const pet = owned.pets.find((p) => p.id === look.pet);
  const titleName = owned.titles.find((t) => t.id === look.title)?.name;
  const anyWear = WEAR_SLOTS.some((s) => owned.wear[s].length > 0);

  function setWear(slot: WearSlot, id: string | undefined) {
    setMsg(null);
    setLook((l) => {
      const wear = { ...l.wear };
      if (id) wear[slot] = id;
      else delete wear[slot];
      const next: AvatarLook = { ...l, wear };
      if (!Object.keys(wear).length) delete next.wear;
      return next;
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr] md:items-start">
      <section aria-label="Vista previa" data-fija="arriba" className="panel panel-glow sticky top-[4.5rem] z-10 flex items-center gap-4 overflow-hidden !bg-panel p-3 md:top-20 md:flex-col md:p-6">
        <div className="relative h-32 w-24 shrink-0 md:h-96 md:w-full" style={{ background: "radial-gradient(60% 60% at 50% 60%, rgba(46,230,214,.18), transparent 70%)" }}>
          <Sprite src={avatarSrc(base, rank, look)} alt={`Vista previa de ${AVATAR_NAMES[base]}`} priority className="absolute inset-0 size-full object-contain" />
          {pet && <Sprite src={pet.image} alt={`Tu compañero: ${pet.name}`} className="absolute bottom-0 right-0 h-1/3 w-auto md:right-4" />}
        </div>
        <div className="min-w-0 flex-1 space-y-2 md:w-full md:text-center">
          <div className="flex items-center gap-3 md:justify-center">
            <AvatarFace base={base} rank={rank} look={look} size={40} className="hidden md:block" />
            <p className="font-display text-lg font-bold leading-tight">{AVATAR_NAMES[base]} <span className="block text-xs font-normal text-muted">{titleName ? `«${titleName}» · ` : ""}{GEAR[wearing]}</span></p>
          </div>
          <button type="button" onClick={save} disabled={!dirty || pending} className="btn btn-primary btn-sm w-full">
            {pending ? "Guardando…" : dirty ? "Guardar cambios" : "Guardado ✔"}
          </button>
          <button type="button" onClick={() => { setLook((l) => sanitizeLook({ gear: l.gear, style: l.style, wear: l.wear, frame: l.frame, title: l.title, pet: l.pet })); setMsg(null); }} className="btn btn-ghost btn-sm w-full !py-1">
            Colores originales
          </button>
          <p aria-live="polite" className={`text-xs font-medium ${msg?.ok ? "text-green" : "text-err"}`}>{msg?.text}</p>
        </div>
      </section>

      <div className="space-y-6">
        <section className="panel space-y-5 p-5 sm:p-6" aria-labelledby="pers-t">
          <h2 id="pers-t" className="text-xl">Personaje</h2>
          <fieldset className="space-y-2">
            <legend className="sr-only">Personaje</legend>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_BASES.map((b) => (
                <label key={b} className="cursor-pointer">
                  <input type="radio" name="base" value={b} checked={base === b} onChange={() => { setBase(b); setMsg(null); }} className="peer sr-only" />
                  <span className="flex flex-col items-center gap-1 rounded-xl border-2 border-line bg-bg/40 p-1.5 transition peer-checked:border-cyan peer-checked:bg-cyan/10 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan">
                    <AvatarFace base={b} rank={rank} look={look} size={56} />
                    <span className="text-xs font-bold">{AVATAR_NAMES[b]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="panel space-y-5 p-5 sm:p-6" aria-labelledby="pein-t">
          <h2 id="pein-t" className="text-xl">Peinado</h2>
          {(["masculino", "femenino"] as const).map((g) => (
            <fieldset key={g} className="space-y-2">
              <legend className="label">{g === "masculino" ? "Peinados masculinos" : "Peinados femeninos"}</legend>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {g === "masculino" && <StyleOption label="Original" checked={look.style === undefined} onPick={() => set("style", undefined)} base={base} rank={rank} look={{ ...look, style: undefined }} />}
                {HAIRSTYLES.map((h, i) => h.group === g && (
                  <StyleOption key={h.id} label={h.name} checked={look.style === i} onPick={() => set("style", i)} base={base} rank={rank} look={{ ...look, style: i }} />
                ))}
              </div>
            </fieldset>
          ))}
          <p className="hint">Cualquier peinado se puede elegir; el color se cambia en «Cabello».</p>
        </section>

        <section className="panel space-y-5 p-5 sm:p-6" aria-labelledby="col-t">
          <h2 id="col-t" className="text-xl">Colores</h2>
          {ROWS.map((r) => (
            <ColorRow key={r.slot} title={r.title} slot={r.slot} swatches={r.swatches} base={base} value={look[r.slot]} onPick={(v) => set(r.slot, v)} />
          ))}
        </section>

        <section className="panel space-y-5 p-5 sm:p-6" aria-labelledby="acc-t">
          <div>
            <h2 id="acc-t" className="text-xl">Accesorios</h2>
            <p className="text-sm text-muted">Lo que consigas en la tienda aparece aquí para ponértelo.</p>
          </div>
          {WEAR_SLOTS.filter((s) => owned.wear[s].length > 0).map((s) => (
            <ItemRow key={s} title={WEAR_LABEL[s]} name={`wear-${s}`} options={owned.wear[s]} value={look.wear?.[s]} onPick={(v) => setWear(s, v)} />
          ))}
          <ItemRow title="Marco del retrato" name="frame" options={owned.frames} value={look.frame} onPick={(v) => set("frame", v)} none="Sin marco" round />
          {owned.titles.length > 0 && <ItemRow title="Título" name="title" options={owned.titles} value={look.title} onPick={(v) => set("title", v)} none="Sin título" />}
          {owned.pets.length > 0 && <ItemRow title="Compañero" name="pet" options={owned.pets} value={look.pet} onPick={(v) => set("pet", v)} none="Sin compañero" />}
          {!anyWear && (
            <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
              Aún no tienes capas, gafas, sombreros ni otros accesorios. <Link href="/tienda?c=cosmetico" className="font-semibold text-cyan underline underline-offset-4">Visita la tienda</Link> con las monedas que ganas en las misiones.
            </p>
          )}
        </section>

        <section className="panel space-y-4 p-5 sm:p-6" aria-labelledby="atu-t">
          <div>
            <h2 id="atu-t" className="text-xl">Atuendos</h2>
            <p className="text-sm text-muted">Cada rango que alcanzas te deja vestir su equipo. Puedes volver a uno anterior cuando quieras.</p>
          </div>
          <fieldset>
            <legend className="sr-only">Atuendo</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {RANKS.map((r) => {
                const open = canWearGear(r.key, rank);
                return (
                  <label key={r.key} className={open ? "cursor-pointer" : "cursor-not-allowed"}>
                    <input type="radio" name="gear" disabled={!open} checked={wearing === r.key} onChange={() => set("gear", r.key === rank ? undefined : r.key)} className="peer sr-only" aria-label={`${GEAR[r.key]}, rango ${r.key}${open ? "" : ", bloqueado"}`} />
                    <span className={`flex h-full flex-col items-center gap-1 rounded-xl border-2 border-line bg-bg/40 p-2 text-center transition peer-checked:border-cyan peer-checked:bg-cyan/10 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan ${open ? "" : "opacity-50"}`}>
                      <span className="relative block h-28 w-full">
                        <Sprite src={open ? avatarSrc(base, r.key, colors) : asset.avatar(base, r.key)} alt="" decorative className={`absolute inset-0 size-full object-contain ${open ? "" : "grayscale"}`} />
                        {!open && <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-2xl">🔒</span>}
                      </span>
                      <span className="text-xs font-bold">{GEAR[r.key]}</span>
                      <span className="rounded-md px-1.5 text-[11px] font-extrabold" style={{ background: r.color, color: "var(--ink)" }}>{open ? `Rango ${r.key}` : `Se abre en rango ${r.key}`}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>

        <p className="text-center text-sm text-muted">
          <Link href="/perfil" className="font-semibold text-cyan underline underline-offset-4">Volver a tu perfil</Link>
        </p>
      </div>
    </div>
  );
}
