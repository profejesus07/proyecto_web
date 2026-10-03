export type RankKey = "E" | "D" | "C" | "B" | "A" | "S";

export interface Rank {
  key: RankKey;
  /** XP mínima para alcanzarlo */
  min: number;
  name: string;
  color: string;
}

export const RANKS: readonly Rank[] = [
  { key: "E", min: 0, name: "Aprendiz", color: "#9AA0B4" },
  { key: "D", min: 150, name: "Explorador", color: "#4ADE80" },
  { key: "C", min: 400, name: "Cazador", color: "#2EE6D6" },
  { key: "B", min: 900, name: "Maestro de portales", color: "#8A5CFF" },
  { key: "A", min: 1800, name: "Élite", color: "#FF6B6B" },
  { key: "S", min: 3500, name: "Leyenda", color: "#FFC83D" },
];

export function rankForXp(xp: number): Rank {
  let current = RANKS[0];
  for (const r of RANKS) if (xp >= r.min) current = r;
  return current;
}

export interface RankProgress {
  rank: Rank;
  next: Rank | null;
  /** XP ganada dentro del rango actual */
  into: number;
  /** XP que separa este rango del siguiente (0 si es el último) */
  span: number;
  /** 0-100 */
  pct: number;
  remaining: number;
}

export function rankProgress(xp: number): RankProgress {
  const rank = rankForXp(xp);
  const idx = RANKS.findIndex((r) => r.key === rank.key);
  const next = RANKS[idx + 1] ?? null;
  if (!next) return { rank, next, into: xp - rank.min, span: 0, pct: 100, remaining: 0 };
  const span = next.min - rank.min;
  const into = xp - rank.min;
  return { rank, next, into, span, pct: Math.min(100, Math.round((into / span) * 100)), remaining: next.min - xp };
}

/** Rangos nuevos alcanzados al pasar de `before` a `after` XP (en orden). */
export function ranksReached(before: number, after: number): Rank[] {
  return RANKS.filter((r) => r.min > before && r.min <= after);
}
