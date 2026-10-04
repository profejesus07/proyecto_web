import { RANK_S_POWERS } from "./powers";
import { ranksReached } from "./ranks";

/** Qué obtiene el estudiante al vencer a cada Guardián. */
export const GUARDIAN_REWARDS: Record<string, { item: string; title: string }> = {
  petrox: { item: "obj_recompensa_capa", title: "obj_titulo_constructor" },
  ignaris: { item: "obj_recompensa_brasas", title: "obj_titulo_valiente" },
  brumalis: { item: "obj_recompensa_linterna", title: "obj_titulo_memorioso" },
  mirelle: { item: "obj_recompensa_pluma", title: "obj_titulo_narrador" },
  quimax: { item: "obj_recompensa_hilo", title: "obj_titulo_conector" },
  sandrael: { item: "obj_recompensa_reloj", title: "obj_titulo_estratega" },
  eclipsa: { item: "obj_recompensa_espejo", title: "obj_titulo_seguro_de_si" },
  zhaal: { item: "obj_recompensa_corona", title: "obj_titulo_maestro_del_saber" },
};

export interface FirstCompletionContext {
  isBoss: boolean;
  /** Es la última lección del curso (con módulos, solo el último jefe cierra el curso). */
  courseEnd?: boolean;
  guardian: string;
  element: string;
  xpBefore: number;
  xpGain: number;
  /** true si el estudiante nunca había aprobado una misión */
  firstEver: boolean;
}

/**
 * Objetos que se entregan SOLO la primera vez que se aprueba una misión.
 * La base de datos decide si de verdad era la primera vez; aquí solo se prepara la lista.
 */
export function itemsOnFirstCompletion(ctx: FirstCompletionContext): string[] {
  const items = new Set<string>();
  if (ctx.firstEver) {
    items.add("obj_insignia_primera_mision");
    items.add("obj_rango_e");
  }
  for (const r of ranksReached(ctx.xpBefore, ctx.xpBefore + ctx.xpGain)) {
    items.add(`obj_rango_${r.key.toLowerCase()}`);
    // Llegar a rango S regala los dos poderes legendarios.
    if (r.key === "S") for (const id of RANK_S_POWERS) items.add(id);
  }
  if (ctx.isBoss) {
    // Cada Guardián vencido (el de cada módulo) da su recompensa y su título.
    const reward = GUARDIAN_REWARDS[ctx.guardian];
    if (reward) {
      items.add(reward.item);
      items.add(reward.title);
    }
    items.add("obj_insignia_primer_guardian");
  }
  if (ctx.isBoss && ctx.courseEnd !== false) {
    // Cerrar el curso: sello del elemento y certificado del portal.
    items.add("obj_insignia_primer_portal");
    items.add(`obj_sello_${ctx.element}`);
    items.add("obj_sello_completado");
    items.add("obj_certificado_portal");
  }
  return [...items];
}
