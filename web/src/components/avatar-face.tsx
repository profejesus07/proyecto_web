import { Sprite, asset } from "@/components/sprite";
import type { AvatarLook } from "@/lib/avatar-look";

/** Recorte de cabeza y torso del avatar, para usarlo en círculos y tarjetas pequeñas (con su marco, si lo eligió). */
export function AvatarFace({ base, rank, look, size = 40, className = "" }: { base: string; rank: string; look?: AvatarLook; size?: number; className?: string }) {
  return (
    <span className={`relative block shrink-0 ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <span className="absolute inset-0 overflow-hidden rounded-full bg-panel-2">
        <Sprite src={asset.avatar(base, rank, look)} alt="" decorative className="absolute left-1/2 top-[2%] !h-auto !max-w-none w-[175%] -translate-x-1/2" />
      </span>
      {look?.frame && (
        // El aro del marco tiene su borde interior en r = 75 de 256: así rodea el círculo sin taparlo.
        <Sprite src={`/assets/objetos/marco/${look.frame}.svg`} alt="" decorative width={Math.round(size * 1.71)} height={Math.round(size * 1.71)}
          className="pointer-events-none absolute left-1/2 top-1/2 !max-w-none -translate-x-1/2 -translate-y-1/2" />
      )}
    </span>
  );
}
