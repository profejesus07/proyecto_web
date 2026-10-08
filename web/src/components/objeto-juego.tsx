import type { PowerKind } from "@/lib/game/powers";
import type { RankKey } from "@/lib/game/ranks";

/*
 * Objetos del juego en tamaño de ícono: monedas, gemas, XP, racha, ayudas, poderes y rangos. Son los SVG de la
 * biblioteca (public/assets/objetos), no íconos de línea: lo que pertenece al mundo se ve como en el juego.
 * La interfaz (estados, acciones, menú) usa los íconos de línea de icons.tsx.
 * Son decorativos: el texto de al lado dice qué son. Por omisión toman el tamaño de la letra.
 */
const ARCHIVOS = {
  moneda: "recurso/obj_recurso_moneda",
  gema: "recurso/obj_recurso_gema",
  xp: "recurso/obj_recurso_xp",
  racha: "interfaz/obj_ui_racha",
  pista: "ayuda/obj_ayuda_pista",
  "5050": "ayuda/obj_ayuda_5050",
} as const;

export type ObjetoJuegoNombre = keyof typeof ARCHIVOS;

const EN_TEXTO = "inline-block size-[1.3em] shrink-0 align-[-0.3em]";

function Imagen({ src, className }: { src: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" aria-hidden="true" decoding="async" draggable={false} className={className ?? EN_TEXTO} />;
}

export function ObjetoJuego({ nombre, className }: { nombre: ObjetoJuegoNombre; className?: string }) {
  return <Imagen src={`/assets/objetos/${ARCHIVOS[nombre]}.svg`} className={className} />;
}

/** El objeto de un poder (el mismo que se ve en la tienda). */
export function PoderIcono({ poder, className }: { poder: PowerKind; className?: string }) {
  return <Imagen src={`/assets/objetos/poder/obj_poder_${poder}.svg`} className={className} />;
}

/** La insignia de un rango. */
export function RangoIcono({ rango, className }: { rango: RankKey; className?: string }) {
  return <Imagen src={`/assets/objetos/rango/obj_rango_${rango.toLowerCase()}.svg`} className={className} />;
}
