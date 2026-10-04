import { Sprite } from "@/components/sprite";
import { guideSrc, type Guide } from "@/content/elenco";

/** Retrato en círculo de un Maestro o Guardián del Hogar (la cabeza está al 48 % de ancho y 26 % de alto). */
export function GuideFace({ guide, size = 40, className = "" }: { guide: Guide; size?: number; className?: string }) {
  const w = size * 3.1;
  const h = w * (602 / 400);
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full bg-panel-2 ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <Sprite src={guideSrc(guide)} alt="" decorative width={Math.round(w)} height={Math.round(h)}
        className="absolute !max-w-none" style={{ left: size / 2 - w * 0.48, top: size / 2 - h * 0.25 }} />
    </span>
  );
}
