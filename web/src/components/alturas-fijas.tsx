"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Publica en <html> cuánto ocupan los elementos fijos, para que scroll-padding (globals.css) deje ese
 * espacio y nada con el foco ni nada a lo que se desplace la página quede tapado (WCAG 2.4.11):
 *   --alto-fijo-arriba: lo fijo arriba que ocupa casi todo el ancho ([data-fija="arriba"]: las cabeceras y,
 *                       en celular, la vista previa del Vestidor), medido hasta su borde inferior;
 *   --alto-fijo-abajo:  la barra de menú fija abajo ([data-fija="abajo"]), si se ve.
 * Se mide en vez de usar números fijos: las alturas cambian con cada rango de ancho y con cada página.
 */
export function AlturasFijas() {
  const pathname = usePathname();

  useEffect(() => {
    const raiz = document.documentElement;
    let cuadro = 0;

    function medir() {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        let arriba = 0;
        for (const el of document.querySelectorAll<HTMLElement>('[data-fija="arriba"]')) {
          const r = el.getBoundingClientRect();
          // Solo lo que cruza la página (una columna lateral fija no tapa el contenido de al lado).
          if (r.height === 0 || r.width < innerWidth * 0.6) continue;
          const tope = parseFloat(getComputedStyle(el).top) || 0;
          arriba = Math.max(arriba, tope + r.height);
        }
        let abajo = 0;
        for (const el of document.querySelectorAll<HTMLElement>('[data-fija="abajo"]')) abajo = Math.max(abajo, el.getBoundingClientRect().height);
        raiz.style.setProperty("--alto-fijo-arriba", `${Math.round(arriba)}px`);
        raiz.style.setProperty("--alto-fijo-abajo", `${Math.round(abajo)}px`);
      });
    }

    const observador = new ResizeObserver(medir);
    for (const el of document.querySelectorAll<HTMLElement>("[data-fija]")) observador.observe(el);
    addEventListener("resize", medir);
    medir();
    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      removeEventListener("resize", medir);
    };
  }, [pathname]);

  return null;
}
