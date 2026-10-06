"use client";

import { useEffect, useState } from "react";
import { preload } from "react-dom";
import { Sprite, asset } from "@/components/sprite";

/**
 * Historia de la portada: «Aria y el Portal de los Pasos Pequeños».
 * Cuenta en 30 segundos lo mismo que vive un estudiante en la academia: una guía le abre la
 * lección, practica con retos pequeños, cada acierto la hace subir de rango (E → D → C) y,
 * con lo aprendido, vence al Guardián del módulo. Petrox, el gólem que cree que todo es
 * demasiado grande, es la idea central: un reto enorme se vence en pasos pequeños.
 * Kuro, su compañero, crece con ella (de cachorro a joven).
 *
 * Los trajes de Aria cambian con su rango: antes de evolucionar se usan sus animaciones
 * generales (rango E) y después, solo las de su nuevo rango, para que el atuendo no salte.
 */
type Slot = { src: string; cls: string };
interface Beat {
  bg: string;
  chapter: string;
  speaker: string;
  line: string;
  /** Descripción para lectores de pantalla. */
  label: string;
  rank: "E" | "D" | "C";
  hero: string;
  kuro: Slot;
  right?: Slot;
  flash?: boolean;
  ms: number;
}

const aria = (anim: string) => asset.avatarAnim("aria", anim);
const KURO_S = "bottom-[5%] left-[11%] h-[22%]";
const KURO_L = "bottom-[5%] left-[11%] h-[29%]";
const HERO = "bottom-[4%] left-[31%] h-[47%]";
const SORA = "bottom-[4%] left-[72%] h-[56%]";
const SLIME = "bottom-[6%] left-[73%] h-[27%]";
const PETROX = "bottom-[3%] left-[73%] h-[60%]";

const BEATS: Beat[] = [
  {
    bg: asset.scene("gremio", "dia"), chapter: "El llamado", speaker: "Sora", line: "Aria, el Portal de los Pasos Pequeños te espera.",
    label: "En el Gremio, Sora invita a Aria, aprendiz de rango E, a su primera misión. Kuro la saluda.",
    rank: "E", hero: aria("rango-e-reposo"), kuro: { src: asset.kuro("saludar"), cls: KURO_S }, right: { src: asset.sora("hablar"), cls: SORA }, ms: 3600,
  },
  {
    bg: asset.scene("portales", "disponible"), chapter: "El portal", speaker: "Sora", line: "Cada lección es una puerta. Crúzala.",
    label: "En la Sala de Portales, Sora traza el portal de la lección y Aria lo mira asombrada.",
    rank: "E", hero: aria("asombro"), kuro: { src: asset.kuro("alerta"), cls: KURO_S }, right: { src: asset.sora("abrir-portal"), cls: SORA }, ms: 3600,
  },
  {
    bg: asset.scene("mazmorra", "sombra"), chapter: "Primer reto", speaker: "Slime Confuso", line: "¡Te enredo la pregunta!",
    label: "En la mazmorra, el Slime Confuso intenta confundir a Aria, que levanta la mano para responder.",
    rank: "E", hero: aria("levantar-la-mano"), kuro: { src: asset.kuro("pensar"), cls: KURO_S }, right: { src: asset.enemy("slime-confuso", "especial-confundir"), cls: SLIME }, ms: 3400,
  },
  {
    bg: asset.scene("mazmorra", "sombra"), chapter: "Acierto", speaker: "Aria", line: "Paso a paso, la respuesta es clara.",
    label: "Aria responde bien: su acierto se vuelve poder y el Slime Confuso cae.",
    rank: "E", hero: aria("activar-poder"), kuro: { src: asset.kuro("animar"), cls: KURO_S }, right: { src: asset.enemy("slime-confuso", "derrota"), cls: SLIME }, ms: 3200,
  },
  {
    bg: asset.scene("mazmorra", "sombra"), chapter: "¡Rango D!", speaker: "Kuro", line: "¡Cada acierto te hace más fuerte!",
    label: "Aria sube a rango D y estrena su nuevo atuendo; Kuro lo celebra.",
    rank: "D", hero: aria("rango-d-subir-rango"), kuro: { src: asset.kuro("celebrar"), cls: KURO_S }, flash: true, ms: 3400,
  },
  {
    bg: asset.scene("arena", "calma"), chapter: "El Guardián", speaker: "Petrox", line: "¡Es demasiado grande para ti!",
    label: "En la arena aparece Petrox, el gólem de piedra que cree que todo es demasiado grande. Kuro, ya crecido, se pone alerta.",
    rank: "D", hero: aria("rango-d-reposo"), kuro: { src: asset.kuro("alerta", "joven"), cls: KURO_L }, right: { src: asset.boss("petrox", "aparecer"), cls: PETROX }, ms: 3600,
  },
  {
    bg: asset.scene("arena", "combate"), chapter: "La furia", speaker: "Petrox", line: "¡Nadie termina algo tan enorme!",
    label: "Petrox ataca furioso; Aria se mantiene firme.",
    rank: "D", hero: aria("rango-d-reposo"), kuro: { src: asset.kuro("alerta", "joven"), cls: KURO_L }, right: { src: asset.boss("petrox", "furia-atacar"), cls: PETROX }, ms: 3400,
  },
  {
    bg: asset.scene("arena", "combate"), chapter: "Pasos pequeños", speaker: "Aria", line: "Lo enorme se vence un paso a la vez.",
    label: "Aria usa todo lo aprendido, evoluciona a rango C y Petrox cae.",
    rank: "C", hero: aria("rango-c-subir-rango"), kuro: { src: asset.kuro("animar", "joven"), cls: KURO_L }, right: { src: asset.boss("petrox", "derrota"), cls: PETROX }, flash: true, ms: 3600,
  },
  {
    bg: asset.scene("arena", "victoria"), chapter: "¡Misión superada!", speaker: "Petrox", line: "Gracias… paso a paso sí se puede.",
    label: "Petrox queda purificado. Aria, ya en rango C, celebra con Kuro: misión superada.",
    rank: "C", hero: aria("rango-c-reposo"), kuro: { src: asset.kuro("celebrar", "joven"), cls: KURO_L }, right: { src: asset.boss("petrox", "purificado"), cls: PETROX }, ms: 4200,
  },
];

const BACKGROUNDS = [...new Set(BEATS.map((b) => b.bg))];
const RANK_COLOR = { E: "#9aa3b5", D: "#7fd67f", C: "#5ec8ff" } as const;

export function HeroStory() {
  const [n, setN] = useState(0);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    // Con «reducir movimiento», se queda en el final feliz.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = window.setTimeout(() => setN(BEATS.length - 1), 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      if (document.hidden) return setRetry((r) => r + 1); // pestaña oculta: la historia espera
      setN((i) => (i + 1) % BEATS.length);
    }, BEATS[n].ms);
    return () => window.clearTimeout(t);
  }, [n, retry]);

  // Lo del siguiente momento se pide antes, para que el cambio no parpadee.
  const next = BEATS[(n + 1) % BEATS.length];
  for (const src of [next.hero, next.kuro.src, next.right?.src]) if (src) preload(src, { as: "image" });

  const b = BEATS[n];
  return (
    <div className="relative" data-hero-scene>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border-4 border-white bg-[#14123b] shadow-[0_30px_60px_-28px_rgb(21_16_63/0.55)]"
        role="img" aria-label={`Capítulo ${n + 1} de ${BEATS.length}: ${b.label}`}>
        {BACKGROUNDS.map((bg, i) => (
          <Sprite key={bg} src={bg} alt="" decorative priority={i === 0}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-[1100ms] ease-in-out ${bg === b.bg ? "opacity-100" : "opacity-0"}`} />
        ))}
        <div aria-hidden="true">
          <Sprite key={`k-${b.kuro.src}`} src={b.kuro.src} alt="" decorative priority className={`absolute w-auto -translate-x-1/2 animate-[fadein_.5s_ease-out] ${b.kuro.cls}`} />
          <Sprite key={`h-${b.hero}`} src={b.hero} alt="" decorative priority className={`absolute w-auto -translate-x-1/2 animate-[fadein_.5s_ease-out] ${HERO}`} />
          {b.right && <Sprite key={`r-${b.right.src}`} src={b.right.src} alt="" decorative priority className={`absolute w-auto -translate-x-1/2 animate-[fadein_.5s_ease-out] ${b.right.cls}`} />}
        </div>
        {b.flash && <div key={`flash-${n}`} aria-hidden="true" className="story-flash pointer-events-none absolute inset-0" />}
      </div>

      {/* Subtítulo del momento, bajo la escena para no tapar a nadie. */}
      <p className="mt-3 flex min-h-[3.25rem] items-center justify-center rounded-2xl bg-[#15103f] px-4 py-2 text-center text-sm leading-snug text-white shadow-lg" aria-hidden="true">
        <span key={`d-${n}`} className="animate-[fadein_.45s_ease-out]"><strong className="mr-1.5 text-[#ffc83d]">{b.speaker}:</strong>{b.line}</span>
      </p>

      {/* Ficha de la heroína: su rango cambia cuando evoluciona. */}
      <div className="drift absolute -left-4 top-6 hidden rounded-2xl bg-white px-4 py-3 text-[#14123b] shadow-xl sm:-left-10 sm:block" style={{ ["--r" as string]: "-4deg" }} aria-hidden="true">
        <p className="text-xs font-bold uppercase tracking-wider text-[#6b3bf5]">Aprendiz</p>
        <p className="flex items-center gap-2 font-display text-xl font-extrabold">
          Aria
          <span key={b.rank} className="animate-[fadein_.5s_ease-out] rounded-md px-1.5 text-sm" style={{ background: RANK_COLOR[b.rank] }}>Rango {b.rank}</span>
        </p>
      </div>
      {/* Capítulo y avance de la historia. */}
      <div className="drift absolute -top-5 right-2 min-w-48 rounded-2xl bg-[#ffc83d] px-4 py-3 text-[#14123b] shadow-xl [animation-delay:1.5s] sm:-right-6" style={{ ["--r" as string]: "3deg" }} aria-hidden="true">
        <p className="text-xs font-bold uppercase tracking-wider">Capítulo {n + 1} de {BEATS.length}</p>
        <p key={`c-${n}`} className="font-display text-base font-extrabold leading-tight animate-[fadein_.5s_ease-out]">{b.chapter}</p>
        <div className="mt-2 flex gap-0.5">
          {BEATS.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= n ? "bg-[#15103f]" : "bg-[#15103f]/20"}`} />)}
        </div>
      </div>
    </div>
  );
}
