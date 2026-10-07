"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Menú desplegable con <details>: funciona sin JavaScript y, con él, además se cierra al cambiar de página,
 * con la tecla Escape (devolviendo el foco al botón) y al tocar fuera.
 */
export function Desplegable({ resumen, className, claseResumen, children }: {
  resumen: React.ReactNode; className?: string; claseResumen?: string; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    function alTocar(e: PointerEvent) {
      const d = ref.current;
      if (d?.open && !d.contains(e.target as Node)) d.open = false;
    }
    function alTeclear(e: KeyboardEvent) {
      const d = ref.current;
      if (e.key === "Escape" && d?.open) {
        d.open = false;
        d.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", alTocar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("pointerdown", alTocar);
      document.removeEventListener("keydown", alTeclear);
    };
  }, []);

  return (
    <details ref={ref} className={className}>
      <summary className={claseResumen}>{resumen}</summary>
      {children}
    </details>
  );
}
