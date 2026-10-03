import { Sprite, asset } from "@/components/sprite";

/** Recorte de cabeza y torso del avatar, para usarlo en círculos y tarjetas pequeñas. */
export function AvatarFace({ base, rank, size = 40, className = "" }: { base: string; rank: string; size?: number; className?: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full bg-panel-2 ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <Sprite src={asset.avatar(base, rank)} alt="" decorative className="absolute left-1/2 top-[2%] !h-auto !max-w-none w-[175%] -translate-x-1/2" />
    </span>
  );
}
