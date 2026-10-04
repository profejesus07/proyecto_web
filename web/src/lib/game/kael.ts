/**
 * Kael, el rival amistoso (biblia §3.2): reta al estudiante a superar su puntaje en cada misión.
 * Su nota sale de la misión (siempre la misma), así no hace falta guardarla: el duelo se decide
 * con la mejor nota del estudiante. Es competitivo pero justo, y con el tiempo se vuelve aliado.
 */
const KAEL_SCORES = [60, 65, 70, 75, 80, 85, 90] as const;

export function kaelScore(missionId: string): number {
  let h = 7;
  for (const ch of missionId) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return KAEL_SCORES[h % KAEL_SCORES.length];
}

export type DuelResult = "gana" | "empata" | "pierde";
export const duel = (score: number, missionId: string): DuelResult => {
  const k = kaelScore(missionId);
  return score > k ? "gana" : score === k ? "empata" : "pierde";
};

/** Victorias para que Kael pase de rival a aliado. */
export const KAEL_ALLY_AT = 5;

export interface KaelRecord {
  wins: number;
  losses: number;
  ties: number;
  ally: boolean;
  /** Una misión ya jugada donde Kael va por delante (para la revancha). */
  rematch: string | null;
}

export function kaelRecord(played: { missionId: string; bestScore: number }[]): KaelRecord {
  let wins = 0, losses = 0, ties = 0;
  let rematch: string | null = null;
  for (const p of played) {
    const r = duel(p.bestScore, p.missionId);
    if (r === "gana") wins++;
    else if (r === "empata") ties++;
    else {
      losses++;
      rematch ??= p.missionId;
    }
  }
  return { wins, losses, ties, ally: wins >= KAEL_ALLY_AT, rematch };
}
