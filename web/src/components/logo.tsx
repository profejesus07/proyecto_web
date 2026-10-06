import Link from "next/link";

/* Logotipo de Academia Umbral (SVG en /public/brand). Hay dos tintas: texto claro para fondos
   oscuros (juego y sitio público) y texto índigo para fondos claros (paneles de trabajo); el CSS muestra la que toca. */
function Brand({ name, className, ...size }: { name: string; className?: string; width?: number; height?: number }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/brand/${name}-oscuro.svg`} alt="" className={`${className ?? ""} brand-oscuro`} {...size} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/brand/${name}-claro.svg`} alt="" className={`${className ?? ""} brand-claro`} {...size} />
    </>
  );
}

export function Emblem({ size = 32 }: { size?: number }) {
  return <Brand name="academia-umbral-isotipo-estatico" className="shrink-0" width={size} height={size} />;
}

/**
 * Logotipo horizontal que lleva al inicio. size: clases de alto. compact: en celular (menos de 640 px)
 * se muestra solo el isotipo, para que la cabecera quepa junto a los botones de la cuenta.
 */
export function Logo({ href = "/", size = "h-14 sm:h-[4.5rem]", compact = false }: { href?: string; compact?: boolean; size?: string }) {
  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="Academia Virtual Umbral, ir al inicio">
      {compact && <span className="inline-flex sm:hidden"><Brand name="academia-umbral-isotipo-estatico" className="size-11" /></span>}
      <span className={compact ? "hidden sm:inline-flex" : "inline-flex"}><Brand name="academia-umbral-horizontal" className={`${size} w-auto`} /></span>
    </Link>
  );
}
