"use client";

import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { Sprite, asset } from "@/components/sprite";

type Mood = "saludar" | "animar" | "celebrar";
const PHRASES = ["¡Me alegra verte!", "¿Listo para tu primera lección?", "¡Aprender contigo es lo mejor!", "¡Vamos paso a paso!"];

/**
 * Kuro de la portada: se inclina suavemente hacia el cursor, se anima cuando pasas sobre él
 * y celebra (con una frase) cuando lo tocas o haces clic. Con «reducir movimiento» no se inclina.
 */
export function KuroGreeter() {
  const box = useRef<HTMLButtonElement>(null);
  const [mood, setMood] = useState<Mood>("saludar");
  const [phrase, setPhrase] = useState<string | null>(null);
  const timer = useRef(0);

  for (const m of ["animar", "celebrar"] as const) preload(asset.kuro(m), { as: "image" });

  useEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = el.getBoundingClientRect();
        // De −1 a 1 según dónde está el cursor respecto a Kuro (se satura lejos de él).
        const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 500));
        const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / 400));
        el.style.setProperty("--kx", dx.toFixed(3));
        el.style.setProperty("--ky", dy.toFixed(3));
      });
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function celebrate() {
    window.clearTimeout(timer.current);
    setMood("celebrar");
    setPhrase((p) => PHRASES[(PHRASES.indexOf(p ?? "") + 1) % PHRASES.length]);
    timer.current = window.setTimeout(() => { setMood("saludar"); setPhrase(null); }, 2600);
  }

  return (
    <div className="relative mx-auto w-fit">
      <p aria-live="polite" className={`absolute -top-3 left-1/2 z-10 w-max max-w-56 -translate-x-1/2 -translate-y-full rounded-2xl bg-white px-3.5 py-2 text-sm font-semibold text-[#14123b] shadow-xl transition-all duration-300 after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-white ${phrase ? "opacity-100" : "pointer-events-none translate-y-[calc(-100%+6px)] opacity-0"}`}>
        {phrase}
      </p>
      <button ref={box} type="button" onClick={celebrate} aria-label="Saludar a Kuro"
        onPointerEnter={() => mood === "saludar" && setMood("animar")} onPointerLeave={() => mood === "animar" && setMood("saludar")}
        className="kuro-greeter block cursor-pointer rounded-3xl focus-visible:outline-offset-4">
        <Sprite key={mood} src={asset.kuro(mood)} alt="Kuro te da la bienvenida" priority className="mx-auto h-40 w-auto md:h-56" />
      </button>
    </div>
  );
}
