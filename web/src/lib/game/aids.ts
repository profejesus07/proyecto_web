import { RANKS } from "./ranks";

/** Ayudas consumibles que ya funcionan dentro de las misiones. Las reglas se aplican en la base de datos (0004_ayudas.sql). */
export type AidKind = "pista" | "5050";

export interface AidRule {
  itemId: string;
  kind: AidKind;
  /** Unidades pagadas que se pueden gastar al día. */
  dailyCap: number;
  /** Máximo que se puede guardar en la mochila. */
  maxStock: number;
  /** XP mínima para usarla y comprarla. */
  minXp: number;
  minRank: string;
}

const rankXp = (key: string) => RANKS.find((r) => r.key === key)!.min;

export const AIDS: Record<AidKind, AidRule> = {
  pista: { itemId: "obj_ayuda_pista", kind: "pista", dailyCap: 10, maxStock: 20, minXp: 0, minRank: "E" },
  "5050": { itemId: "obj_ayuda_5050", kind: "5050", dailyCap: 5, maxStock: 20, minXp: rankXp("D"), minRank: "D" },
};

export function aidByItem(itemId: string): AidRule | undefined {
  return Object.values(AIDS).find((a) => a.itemId === itemId);
}

/** Fecha de hoy en Colombia (la misma que usa la base de datos para rachas y topes). */
export function todayBogota(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
