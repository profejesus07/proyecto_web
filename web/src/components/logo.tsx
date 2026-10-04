import Link from "next/link";

export function Emblem({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="emb-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a5cff" />
          <stop offset="1" stopColor="#2ee6d6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="#14123b" stroke="url(#emb-g)" strokeWidth="2.5" />
      <path d="M13 36V23a11 11 0 0 1 22 0v13" fill="none" stroke="#ffc83d" strokeWidth="4" strokeLinecap="round" />
      <path d="M24 16.5l1.6 3.9 3.9 1.6-3.9 1.6-1.6 3.9-1.6-3.9-3.9-1.6 3.9-1.6z" fill="#2ee6d6" />
    </svg>
  );
}

/** compact: en pantallas pequeñas se ve solo «UMBRAL» (cabecera del juego, con monedas y avatar). */
export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 font-display tracking-tight" aria-label="Academia Virtual Umbral, ir al inicio">
      <Emblem />
      <span className={`flex flex-col leading-none ${compact ? "max-[379px]:sr-only" : ""}`}>
        <span className={`whitespace-nowrap text-[0.6rem] font-bold uppercase tracking-[0.1em] opacity-70 sm:tracking-[0.22em] ${compact ? "hidden sm:block" : ""}`}>Academia Virtual</span>
        <span className="text-xl font-extrabold">UMBRAL</span>
      </span>
    </Link>
  );
}
