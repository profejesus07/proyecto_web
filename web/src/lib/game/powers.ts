import { RANKS } from "./ranks";

/**
 * Poderes con efecto real en las misiones. Las reglas (rango, unidades, tope diario) se aplican
 * en la base de datos (0018_poderes.sql); aquí está lo que se muestra y los números que se envían.
 */
export type PowerKind = "rayo" | "escudo" | "aura" | "lluvia" | "kuro" | "pulso" | "sombra" | "aliento";

export interface PowerRule {
  kind: PowerKind;
  itemId: string;
  name: string;
  /** Qué hace en la misión, en una frase (botón y tienda). */
  effect: string;
  /** Usos al día (pagados o no). */
  dailyCap: number;
  /** Máximo que se puede guardar en la mochila (0 = no se compra: es de rango S). */
  maxStock: number;
  minXp: number;
  minRank: string;
  /** Sombra Dorada y Segundo Aliento: se ganan al llegar al rango S y no se gastan. */
  permanent: boolean;
  /** Dibujo del efecto (640 × 480) que se superpone a la escena. */
  fx: string;
}

const rankXp = (key: string) => RANKS.find((r) => r.key === key)!.min;
const rule = (kind: PowerKind, name: string, effect: string, dailyCap: number, maxStock: number, minRank: string): PowerRule => ({
  kind, itemId: `obj_poder_${kind}`, name, effect, dailyCap, maxStock, minXp: rankXp(minRank), minRank, permanent: maxStock === 0,
  fx: `/assets/objetos/poder/poder_${kind}_efecto.svg`,
});

export const POWERS: Record<PowerKind, PowerRule> = {
  rayo: rule("rayo", "Rayo de Claridad", "Resalta las palabras de la pregunta donde está la pista.", 5, 10, "D"),
  escudo: rule("escudo", "Escudo de Calma", "Si fallas esta pregunta, la respuesta no queda fija y puedes intentarlo otra vez.", 5, 10, "D"),
  aura: rule("aura", "Aura de Concentración", "Te da más tiempo para pensar: la pregunta pasa al final de la misión.", 5, 10, "B"),
  lluvia: rule("lluvia", "Lluvia de Estrellas", "Si aciertas esta pregunta, ganas 15 XP extra.", 3, 10, "B"),
  kuro: rule("kuro", "Invocación de Kuro", "Kuro te dice la pista en voz alta y descarta una opción incorrecta.", 3, 5, "B"),
  pulso: rule("pulso", "Pulso de Memoria", "Vuelve a mostrar todas las pistas que ya habías visto en esta misión.", 3, 5, "B"),
  sombra: rule("sombra", "Sombra Dorada", "Si ya acertaste esta pregunta antes, tu sombra marca la respuesta que elegiste.", 3, 0, "S"),
  aliento: rule("aliento", "Segundo Aliento", "Devuelve una pregunta fallada para que la respondas otra vez.", 1, 0, "S"),
};
export const POWER_KINDS = Object.keys(POWERS) as PowerKind[];
/** Los que se ganan al llegar al rango S. */
export const RANK_S_POWERS = POWER_KINDS.filter((k) => POWERS[k].permanent).map((k) => POWERS[k].itemId);

export function powerByItem(itemId: string): PowerRule | undefined {
  return POWER_KINDS.map((k) => POWERS[k]).find((p) => p.itemId === itemId);
}

/** Raíz de una palabra para comparar con las del Rayo de Claridad (igual que en la base de datos). */
export function stemOf(word: string): string {
  return word.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "").replace(/ñ/g, "n").slice(0, 5);
}
