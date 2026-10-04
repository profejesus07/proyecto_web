import { Sprite, asset } from "@/components/sprite";
import type { Universe } from "@/content/universos";

// Castillo de 16×14 píxeles para Reino Pixel (cada letra es un color).
const CASTLE = [
  ".......rr.......",
  ".......rrr......",
  ".......k........",
  "..k.k..k...k.k..",
  "..kkk.kkk..kkk..",
  "..kgk.kgk..kgk..",
  "..kgkkkgkkkkgk..",
  "..kgggggggggggk.",
  "..kggkgggggkggk.",
  "..kgggggyggggggk",
  "..kgggggyyggggk.",
  "..kgggggyygggggk",
  "GGGGGGGGGGGGGGGG",
  "GgGGGgGGGGgGGGgG",
];
const PALETTE: Record<string, string> = { k: "#1d2b53", g: "#c2c3c7", y: "#ffa300", r: "#ff004d", G: "#00b543" };

function PixelCastle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 14" className={className} shapeRendering="crispEdges" aria-hidden="true">
      {CASTLE.flatMap((row, y) => [...row].map((c, x) => (PALETTE[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PALETTE[c]} /> : null)))}
    </svg>
  );
}

/** Miniatura del estilo de cada universo. */
export function UniverseArt({ u, className = "" }: { u: Universe; className?: string }) {
  if (u.id === "gremio") {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Sprite src={asset.scene("gremio", "dia")} alt="" decorative className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <Sprite src={asset.sora("saludar")} alt="" decorative className="absolute bottom-0 right-[10%] h-[82%] w-auto" />
        <Sprite src={asset.kuro("saludar")} alt="" decorative className="absolute bottom-[2%] left-[12%] h-[34%] w-auto" />
      </div>
    );
  }
  if (u.id === "hacker") {
    return (
      <div className={`u-hacker relative overflow-hidden p-5 text-[0.8rem] leading-relaxed ${className}`}>
        <div className="scan absolute inset-0" />
        <p className="opacity-60">umbral@academia:~$ ./mision --nivel 1</p>
        <p>&gt; descifrando señal… <span className="opacity-60">[████████░░] 82%</span></p>
        <p>&gt; acceso_concedido</p>
        <p className="mt-2 text-lg font-bold tracking-tight">ACADEMIA_HACKER<span className="cursor ml-1" /></p>
      </div>
    );
  }
  if (u.id === "dragon") {
    return (
      <div className={`u-dragon relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgb(255_255_255/0.55),transparent_45%)]" />
        {[["#ff6b3d", "18%", "22%"], ["#2ec4ff", "70%", "20%"], ["#3ddc84", "20%", "68%"], ["#f4f1ea", "72%", "66%"]].map(([c, x, y]) => (
          <span key={c} className="absolute size-10 rounded-full border-2 border-white/70 shadow-lg" style={{ background: c, left: x, top: y }} />
        ))}
        <p className="absolute inset-x-0 bottom-3 px-2 text-center font-display text-sm font-extrabold leading-tight text-white drop-shadow sm:text-base">Fuego · Agua · Tierra · Aire</p>
      </div>
    );
  }
  return (
    <div className={`u-pixel relative grid place-items-center overflow-hidden ${className}`}>
      <span className="absolute left-[12%] top-[14%] h-3 w-10 bg-white" />
      <span className="absolute right-[16%] top-[22%] h-3 w-14 bg-white" />
      <PixelCastle className="h-[78%] w-auto" />
      <p className="px absolute top-3 text-sm font-bold text-white">NIVEL 1-1</p>
    </div>
  );
}
