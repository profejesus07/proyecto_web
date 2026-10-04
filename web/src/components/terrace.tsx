import { Sprite, asset } from "@/components/sprite";
import { getItem } from "@/lib/catalog";

/**
 * La Terraza del Hogar con la decoración que los estudiantes le regalan a su familia.
 * La escena es 16:9 (1280 × 720); cada objeto tiene su lugar libre en ella (en % de la escena).
 */
const SPOTS: Record<string, { left: number; bottom: number; width: number }> = {
  obj_decoracion_banderines: { left: 26, bottom: 72, width: 48 },
  obj_decoracion_macetas: { left: 58, bottom: 34, width: 13 },
  obj_decoracion_farol: { left: 80, bottom: 34, width: 9 },
  obj_decoracion_telescopio: { left: 20, bottom: 6, width: 17 },
  obj_decoracion_mesita: { left: 37, bottom: 4, width: 15 },
  obj_decoracion_cojin: { left: 55, bottom: 3, width: 12 },
};
export const DECOR_IDS = Object.keys(SPOTS);

export function Terrace({ decor, state = "manana", className = "" }: { decor: string[]; state?: "manana" | "atardecer" | "noche"; className?: string }) {
  const placed = DECOR_IDS.filter((id) => decor.includes(id));
  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-2xl ${className}`}>
      <Sprite src={asset.scene("terraza", state)} alt="" decorative className="absolute inset-0 size-full object-cover" />
      {placed.map((id) => {
        const s = SPOTS[id];
        const item = getItem(id);
        return (
          <Sprite key={id} src={`/assets/objetos/decoracion/${id}-terraza.svg`} alt={item?.nombre ?? ""}
            className="absolute h-auto" style={{ left: `${s.left}%`, bottom: `${s.bottom}%`, width: `${s.width}%` }} />
        );
      })}
    </div>
  );
}
