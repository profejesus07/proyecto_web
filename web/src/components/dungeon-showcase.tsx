"use client";

import { useEffect, useState } from "react";
import { Sprite, asset } from "@/components/sprite";

/**
 * Escena de la portada: las tres mazmorras (fuego, agua y sombra) se suceden con un fundido,
 * cada una con su aventurero, Kuro y el Guardián del lugar en reposo.
 * La escena de 1280 × 720 se recorta a 4:3, así que las posiciones salen de los marcadores
 * del escenario (x − 160) / 960.
 */
const SCENES = [
  { state: "fuego", name: "Mazmorra de Fuego", hero: "aria", boss: "sandrael", bossName: "Sandrael" },
  { state: "agua", name: "Mazmorra de Agua", hero: "leo", boss: "quimax", bossName: "Quimax" },
  { state: "sombra", name: "Mazmorra de Sombra", hero: "nuri", boss: "eclipsa", bossName: "Eclipsa" },
] as const;

const STEP_MS = 6500;

export function DungeonShowcase() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setI((n) => (n + 1) % SCENES.length);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, []);

  const current = SCENES[i];
  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border-4 border-white/20 bg-[#14123b] shadow-2xl shadow-black/30"
        role="img" aria-label={`${current.name}: un aventurero y Kuro frente a ${current.bossName}, el Guardián`}>
        {SCENES.map((s, n) => (
          <div key={s.state} aria-hidden="true" data-scene={s.state}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${n === i ? "opacity-100" : "opacity-0"}`}>
            <Sprite src={asset.scene("mazmorra", s.state)} alt="" decorative priority={n === 0} className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
            <Sprite src={asset.kuro("reposo")} alt="" decorative priority className="absolute bottom-[5%] left-[11%] h-[24%] w-auto -translate-x-1/2" />
            <Sprite src={`/assets/avatares/${s.hero}/${s.hero}-rango-c-reposo.svg`} alt="" decorative priority className="absolute bottom-[4%] left-[26%] h-[46%] w-auto -translate-x-1/2" />
            <Sprite src={asset.boss(s.boss)} alt="" decorative priority className="absolute bottom-[4%] left-[75%] h-[52%] w-auto -translate-x-1/2" />
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden="true">
          {SCENES.map((s, n) => (
            <span key={s.state} className={`h-1.5 rounded-full bg-white transition-all duration-500 ${n === i ? "w-6 opacity-100" : "w-1.5 opacity-50"}`} />
          ))}
        </div>
      </div>

      <div className="drift absolute -left-4 top-6 hidden rounded-2xl sm:block bg-white px-4 py-3 text-[#14123b] shadow-xl sm:-left-10" style={{ ["--r" as string]: "-4deg" }} aria-hidden="true">
        <p className="text-xs font-bold uppercase tracking-wider text-[#6d3ff2]">Misión superada</p>
        <p className="font-display text-xl font-extrabold">+60 XP ✨</p>
      </div>
      <div className="drift absolute -top-5 right-2 min-w-44 rounded-2xl bg-[#ffc83d] px-4 py-3 text-[#14123b] shadow-xl [animation-delay:1.5s] sm:-right-6" style={{ ["--r" as string]: "3deg" }} aria-hidden="true">
        <p className="text-xs font-bold uppercase tracking-wider">Guardián: {current.bossName}</p>
        <p key={current.state} className="font-display text-base font-extrabold leading-tight animate-[fadein_.6s_ease-out]">{current.name}</p>
      </div>
    </div>
  );
}
