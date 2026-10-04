/**
 * Puesta en escena de las misiones: qué enemigo custodia cada pregunta, en qué escenario
 * ocurre y qué animación toca en cada momento. No decide nada del juego (eso lo hace el servidor).
 */
export type BeatKind = "enter" | "hit" | "miss";

export interface Enemy {
  slug: string;
  name: string;
  /** Su jugada especial (animación «especial-…»), la que usa cuando el estudiante falla. */
  special: string;
}

const ENEMIES: readonly Enemy[] = [
  { slug: "slime-confuso", name: "Slime Confuso", special: "confundir" },
  { slug: "duende-enredador", name: "Duende Enredador", special: "enredar" },
  { slug: "sombrita", name: "Sombrita", special: "desvanecer" },
];
const MIMIC: Enemy = { slug: "cofre-mimico", name: "Cofre Mímico", special: "enganar" };
export const ALL_ENEMIES: readonly Enemy[] = [...ENEMIES, MIMIC];

/** Cada pregunta la custodia un enemigo menor; la última de una misión larga es el Cofre Mímico (sorpresa). */
export function enemyFor(index: number, total: number): Enemy {
  return total >= 4 && index === total - 1 ? MIMIC : ENEMIES[index % ENEMIES.length];
}

// La Mazmorra tiene tres variantes; cada elemento usa la más cercana.
const MAZMORRA: Record<string, string> = { fuego: "fuego", luz: "fuego", agua: "agua", naturaleza: "agua", sombra: "sombra", eter: "sombra" };

export function sceneFor(boss: boolean, element: string): { name: string; state: string } {
  return boss ? { name: "arena", state: "combate" } : { name: "mazmorra", state: MAZMORRA[element] ?? "sombra" };
}

interface BeatInput {
  boss: boolean;
  kind: BeatKind;
  /** 0 = la acción, 1 = el estado en que queda */
  phase: number;
  /** El Guardián está enfurecido porque la respuesta anterior fue un error. */
  fury: boolean;
  firstEnter: boolean;
  /** Enemigo menor de la pregunta (para su jugada especial). */
  enemy?: Enemy;
}

export function foeAnim({ boss, kind, phase, fury, firstEnter, enemy }: BeatInput): string {
  if (!boss) {
    if (kind === "enter") return phase === 0 ? "aparecer" : "reposo";
    if (kind === "hit") return phase === 0 ? "recibir-golpe" : "derrota";
    // Al fallar: primero su jugada especial (confunde, enreda, se desvanece, engaña) y luego se burla.
    return phase === 0 ? (enemy ? `especial-${enemy.special}` : "burla") : "burla";
  }
  if (kind === "enter") return firstEnter && phase === 0 ? "aparecer" : fury ? "furia-reposo" : "reposo";
  if (kind === "hit") return phase === 0 ? (fury ? "furia-golpe" : "golpe") : "reposo";
  return phase === 0 ? "transicion-furia" : "furia-reposo";
}

/** Milisegundos que dura la acción antes de pasar al estado en que queda (0 = no cambia). */
export function beatDuration({ boss, kind, firstEnter }: Pick<BeatInput, "boss" | "kind" | "firstEnter">): number {
  if (!boss) return kind === "enter" ? 900 : kind === "hit" ? 700 : 1800;
  if (kind === "enter") return firstEnter ? 1100 : 0;
  return kind === "hit" ? 1300 : 1200;
}

export function kuroAnim(result: { correct: boolean } | null): "pensar" | "celebrar" | "animar" {
  return !result ? "pensar" : result.correct ? "celebrar" : "animar";
}

/** Kuro crece con el estudiante: cachorro (E-D), joven (C-B), majestuoso (A-S). */
export function kuroStage(rank: string): "cachorro" | "joven" | "majestuoso" {
  return rank === "A" || rank === "S" ? "majestuoso" : rank === "C" || rank === "B" ? "joven" : "cachorro";
}
