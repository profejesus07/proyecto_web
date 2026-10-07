import Link from "next/link";

/* Logotipo de UNEX Academy (SVG de la marca UNEX en /public/brand, copiados sin modificar).
   Hay dos versiones: negativo para fondos oscuros (juego y sitio público) y normal para fondos claros
   (paneles de trabajo); el CSS muestra la que toca (.brand-oscuro / .brand-claro). */
const ARCHIVOS = {
  horizontal: { oscuro: "unex-academy-negativo", claro: "unex-academy", width: 575, height: 185 },
  isotipo: { oscuro: "unex-academy-isotipo-negativo", claro: "unex-academy-isotipo", width: 191, height: 191 },
} as const;

/** size (opcional): ancho y alto en px; si falta, las medidas del SVG solo fijan la proporción. */
function Brand({ kind, className, size }: { kind: keyof typeof ARCHIVOS; className?: string; size?: number }) {
  const a = ARCHIVOS[kind];
  const width = size ?? a.width;
  const height = size ?? a.height;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/brand/${a.oscuro}.svg`} alt="" width={width} height={height} className={`${className ?? ""} brand-oscuro`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/brand/${a.claro}.svg`} alt="" width={width} height={height} className={`${className ?? ""} brand-claro`} />
    </>
  );
}

/** Isotipo de UNEX Academy. El manual pide 24 px como mínimo. */
export function Emblem({ size = 32 }: { size?: number }) {
  return <Brand kind="isotipo" className="shrink-0" size={size} />;
}

/**
 * Logotipo horizontal que lleva al inicio. size: clases de alto. compact: en celular (menos de 640 px)
 * se muestra solo el isotipo, para que la cabecera quepa junto a los botones de la cuenta.
 * Regla del manual: el logo horizontal nunca por debajo de 160 px de ancho. Por eso su alto mínimo es
 * 3,25 rem (52 px × 3,1 de proporción ≈ 161 px), aunque quien lo use pida un alto menor.
 */
export function Logo({ href = "/", size = "h-14 sm:h-[4.5rem]", compact = false }: { href?: string; compact?: boolean; size?: string }) {
  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="UNEX Academy, ir al inicio">
      {compact && <span className="inline-flex sm:hidden"><Brand kind="isotipo" className="size-11" /></span>}
      <span className={compact ? "hidden sm:inline-flex" : "inline-flex"}><Brand kind="horizontal" className={`${size} min-h-[3.25rem] w-auto`} /></span>
    </Link>
  );
}
