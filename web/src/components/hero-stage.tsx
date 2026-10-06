"use client";

import { useEffect, useRef } from "react";

/**
 * Portada interactiva: al mover el cursor, una luz violeta lo sigue, la cuadrícula se ilumina a su
 * alrededor, la escena se inclina en 3D con un reflejo y el titular se desplaza apenas (paralaje).
 * Solo con ratón o trackpad y sin «reducir movimiento». Las posiciones van en variables CSS
 * (--mx, --my, --rx, --ry, --gx, --gy, --px, --py) que se actualizan una vez por cuadro.
 */
export function HeroStage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tilt = el.querySelector<HTMLElement>("[data-hero-tilt]");
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
      if (tilt) {
        const t = tilt.getBoundingClientRect();
        const tx = Math.min(Math.max((last.clientX - t.left) / t.width, -0.25), 1.25);
        const ty = Math.min(Math.max((last.clientY - t.top) / t.height, -0.25), 1.25);
        tilt.style.setProperty("--ry", `${((tx - 0.5) * 10).toFixed(2)}deg`);
        tilt.style.setProperty("--rx", `${((0.5 - ty) * 8).toFixed(2)}deg`);
        tilt.style.setProperty("--gx", `${(tx * 100).toFixed(1)}%`);
        tilt.style.setProperty("--gy", `${(ty * 100).toFixed(1)}%`);
      }
    };
    const move = (e: PointerEvent) => {
      last = e;
      el.dataset.active = "";
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = () => {
      last = null;
      delete el.dataset.active;
      for (const v of ["--px", "--py"]) el.style.setProperty(v, "0");
      if (tilt) for (const v of ["--rx", "--ry"]) tilt.style.setProperty(v, "0deg");
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
