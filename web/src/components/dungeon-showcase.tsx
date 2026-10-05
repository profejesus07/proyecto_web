"use client";

import { useEffect, useState } from "react";
import { preload } from "react-dom";
import { Sprite, asset } from "@/components/sprite";

/**
 * Escena de la portada: una historia corta en cada mazmorra (fuego, agua y sombra).
 *   1. Reto: el Guardián ataca furioso; el aventurero (rango E) y Kuro se asombran.
 *   2. Giro: un destello de luz; el aventurero evoluciona (sube a rango D) y el Guardián cae.
 *   3. Victoria: el Guardián queda purificado y el aventurero luce su nuevo atuendo.
 * Luego, fundido a la siguiente mazmorra.
 * La escena de 1280 × 720 se recorta a 4:3, así que las posiciones salen de los marcadores
 * del escenario (x − 160) / 960.
 */
const SCENES = [
  { state: "fuego", name: "Mazmorra de Fuego", hero: "aria", heroName: "Aria", boss: "ignaris", bossName: "Ignaris" },
  { state: "agua", name: "Mazmorra de Agua", hero: "leo", heroName: "Leo", boss: "eclipsa", bossName: "Eclipsa" },
  { state: "sombra", name: "Mazmorra de Sombra", hero: "nuri", heroName: "Nuri", boss: "brumalis", bossName: "Brumalis" },
] as const;

type Scene = (typeof SCENES)[number];
type Phase = "reto" | "giro" | "victoria";

/** Cuánto dura cada momento (ms). */
const DURATION: Record<Phase, number> = { reto: 4200, giro: 3400, victoria: 3600 };
const NEXT: Record<Phase, Phase> = { reto: "giro", giro: "victoria", victoria: "reto" };

function sprites(s: Scene, phase: Phase) {
  if (phase === "reto") return { kuro: asset.kuro("alerta"), hero: asset.avatarAnim(s.hero, "asombro"), boss: asset.boss(s.boss, "furia-atacar") };
  if (phase === "giro") return { kuro: asset.kuro("animar"), hero: asset.avatarAnim(s.hero, "rango-d-subir-rango"), boss: asset.boss(s.boss, "derrota") };
  return { kuro: asset.kuro("celebrar"), hero: asset.avatarAnim(s.hero, "rango-d-reposo"), boss: asset.boss(s.boss, "purificado") };
}

function caption(s: Scene, phase: Phase) {
  if (phase === "reto") return { top: `Guardián: ${s.bossName}`, main: s.name, label: `${s.name}: ${s.bossName}, el Guardián, ataca furioso; ${s.heroName} y Kuro lo miran asombrados` };
  if (phase === "giro") return { top: "¡Giro de la historia!", main: `${s.heroName} despierta su poder`, label: `${s.name}: ${s.heroName} evoluciona y ${s.bossName} cae derrotado` };
  return { top: "¡Victoria!", main: `${s.bossName} purificado`, label: `${s.name}: ${s.bossName} queda purificado y ${s.heroName} celebra con Kuro` };
}

export function DungeonShowcase() {
  const [scene, setScene] = useState(0);
  const [phase, setPhase] = useState<Phase>("reto");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    // Con «reducir movimiento», se queda quieta en el final feliz de la primera mazmorra.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = window.setTimeout(() => setPhase("victoria"), 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      if (document.hidden) return setRetry((r) => r + 1); // pestaña oculta: la historia espera
      if (phase === "victoria") setScene((n) => (n + 1) % SCENES.length);
      setPhase(NEXT[phase]);
    }, DURATION[phase]);
    return () => window.clearTimeout(t);
  }, [phase, scene, retry]);

  // Las imágenes del siguiente momento se piden antes, para que el cambio no parpadee.
  const current = SCENES[scene];
  for (const p of ["giro", "victoria"] as const) for (const src of Object.values(sprites(current, p))) preload(src, { as: "image" });

  const text = caption(current, phase);
  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border-4 border-white/20 bg-[#14123b] shadow-2xl shadow-black/30"
        role="img" aria-label={text.label}>
        {SCENES.map((s, n) => {
          const active = n === scene;
          const img = sprites(s, active ? phase : "reto");
          return (
            <div key={s.state} aria-hidden="true" data-scene={s.state} data-phase={active ? phase : undefined}
              className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${active ? "opacity-100" : "opacity-0"}`}>
              <Sprite src={asset.scene("mazmorra", s.state)} alt="" decorative priority={n === 0} className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
              <Sprite key={img.kuro} src={img.kuro} alt="" decorative priority className="absolute bottom-[5%] left-[11%] h-[24%] w-auto -translate-x-1/2" />
              <Sprite key={img.hero} src={img.hero} alt="" decorative priority className="absolute bottom-[4%] left-[26%] h-[46%] w-auto -translate-x-1/2" />
              <Sprite key={img.boss} src={img.boss} alt="" decorative priority className="absolute bottom-[4%] left-[75%] h-[52%] w-auto -translate-x-1/2" />
            </div>
          );
        })}
        {/* Destello que marca el giro de la historia. */}
        {phase === "giro" && <div key={`flash-${scene}`} aria-hidden="true" className="story-flash pointer-events-none absolute inset-0" />}
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden="true">
          {SCENES.map((s, n) => (
            <span key={s.state} className={`h-1.5 rounded-full bg-white transition-all duration-500 ${n === scene ? "w-6 opacity-100" : "w-1.5 opacity-50"}`} />
          ))}
        </div>
      </div>

      <div className="drift absolute -left-4 top-6 hidden rounded-2xl bg-white px-4 py-3 text-[#14123b] shadow-xl sm:-left-10 sm:block" style={{ ["--r" as string]: "-4deg" }} aria-hidden="true">
        <p className="text-xs font-bold uppercase tracking-wider text-[#6b3bf5]">{phase === "victoria" ? "Misión superada" : "Misión en curso"}</p>
        <p className="font-display text-xl font-extrabold">{phase === "victoria" ? "+60 XP ✨" : "⚔️ ¡A la batalla!"}</p>
      </div>
      <div className="drift absolute -top-5 right-2 min-w-44 rounded-2xl bg-[#ffc83d] px-4 py-3 text-[#14123b] shadow-xl [animation-delay:1.5s] sm:-right-6" style={{ ["--r" as string]: "3deg" }} aria-hidden="true">
        <p key={`t-${scene}-${phase}`} className="text-xs font-bold uppercase tracking-wider animate-[fadein_.5s_ease-out]">{text.top}</p>
        <p key={`m-${scene}-${phase}`} className="font-display text-base font-extrabold leading-tight animate-[fadein_.6s_ease-out]">{text.main}</p>
      </div>
    </div>
  );
}
