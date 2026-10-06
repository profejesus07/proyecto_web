"use client";

import { useEffect, useRef } from "react";

/**
 * Portada interactiva: al mover el cursor, una luz violeta lo sigue, la cuadrícula se ilumina a su
 * alrededor y el titular se desplaza apenas (paralaje). La escena animada no reacciona al cursor:
 * sobre ella el efecto se apaga para no distraer de la historia.
 * Solo con ratón o trackpad y sin «reducir movimiento». Las posiciones van en variables CSS
 * (--mx, --my, --px, --py) que se actualizan una vez por cuadro.
 */
export function HeroStage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scene = el.querySelector<HTMLElement>("[data-hero-scene]");
    let frame = 0;
    let last: PointerEvent | null = null;

    const paint = () => {
      frame = 0;
      if (!last) return;
      const box = el.getBoundingClientRect();
      const x = last.clientX - box.left;
      const y = last.clientY - box.top;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      // Paralaje del texto: de −1 a 1 según la posición en la portada.
      el.style.setProperty("--px", ((x / box.width) * 2 - 1).toFixed(3));
      el.style.setProperty("--py", ((y / box.height) * 2 - 1).toFixed(3));
    };
    const leave = () => {
      last = null;
      delete el.dataset.active;
      for (const v of ["--px", "--py"]) el.style.setProperty(v, "0");
    };
    const move = (e: PointerEvent) => {
      // Sobre la escena animada, el efecto se apaga.
      if (scene && scene.contains(e.target as Node)) return leave();
      last = e;
      el.dataset.active = "";
      if (!frame) frame = requestAnimationFrame(paint);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={ref} className={`hero-stage ${className}`}>
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
      {children}
    </section>
  );
}
