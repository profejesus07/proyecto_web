"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

/**
 * Suaviza el cambio de página: al navegar, el contenido nuevo (#contenido) aparece con un fundido
 * corto. La cabecera no se mueve. Antes de pintar, para que no se vea un salto.
 */
export function PageTransition() {
  const pathname = usePathname();
  const first = useRef(true);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = document.getElementById("contenido");
    if (!el || !el.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const anim = el.animate(
      [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
      { duration: 420, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
    );
    return () => anim.cancel();
  }, [pathname]);

  return null;
}
