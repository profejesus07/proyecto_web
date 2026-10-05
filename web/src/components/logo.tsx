import Link from "next/link";

/* Logotipo de Academia Umbral (SVG en /public/brand). Hay dos tintas: texto claro para fondos
   oscuros (juego, consola) y texto índigo para el sitio claro (.theme-site); el CSS muestra la que toca. */
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

/** compact se conserva por compatibilidad: el logotipo ya es una sola pieza que escala. */
export function Logo({ href = "/" }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center" aria-label="Academia Virtual Umbral, ir al inicio">
      <Brand name="academia-umbral-horizontal" className="h-10 w-auto" />
    </Link>
  );
}
