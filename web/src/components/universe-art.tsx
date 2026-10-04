import { Sprite, asset } from "@/components/sprite";
import type { Universe } from "@/content/universos";

/** Miniatura del estilo de cada universo. */
export function UniverseArt({ u, className = "" }: { u: Universe; className?: string }) {
  // Por ahora, el único universo es el Gremio de los Portales.
  return (
    <div className={`relative overflow-hidden ${className}`} data-universe={u.id}>
      <Sprite src={asset.scene("gremio", "dia")} alt="" decorative className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <Sprite src={asset.sora("saludar")} alt="" decorative className="absolute bottom-0 right-[10%] h-[82%] w-auto" />
      <Sprite src={asset.kuro("saludar")} alt="" decorative className="absolute bottom-[2%] left-[12%] h-[34%] w-auto" />
    </div>
  );
}
