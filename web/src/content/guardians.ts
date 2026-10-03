import type { RankKey } from "@/lib/game/ranks";

export interface Guardian {
  slug: string;
  name: string;
  rank: RankKey;
  family: string;
  element: string;
  obstacle: string;
  weakness: string;
  blurb: string;
}

/** Los ocho Guardianes. Cada uno representa un obstáculo de aprendizaje, no una materia. */
export const GUARDIANS: readonly Guardian[] = [
  { slug: "petrox", name: "Petrox", rank: "E", family: "Gólem", element: "Naturaleza", obstacle: "«Es demasiado grande»", weakness: "Dividir en pasos pequeños", blurb: "Un gigante de piedra, torpe y tierno, que cree que ningún reto se puede empezar." },
  { slug: "ignaris", name: "Ignaris", rank: "D", family: "Dragón", element: "Fuego", obstacle: "Miedo a empezar y a equivocarse", weakness: "Probar, errar y reintentar", blurb: "Un dragón joven cuyas llamas se apagan con cada intento." },
  { slug: "brumalis", name: "Brumalis", rank: "C", family: "Espectro", element: "Sombra", obstacle: "El olvido", weakness: "Repasar y recordar", blurb: "Una figura de niebla que borra las pistas que ya viste." },
  { slug: "mirelle", name: "Mirelle", rank: "C", family: "Coloso acuático", element: "Agua", obstacle: "No saber expresarse", weakness: "Explicar con tus propias palabras", blurb: "Una medusa-nube que habla en burbujas de letras revueltas." },
  { slug: "quimax", name: "Quimax", rank: "B", family: "Quimera", element: "Éter", obstacle: "Ideas sueltas", weakness: "Conectar conceptos", blurb: "León, búho y serpiente en uno: cada parte guarda un tema distinto." },
  { slug: "sandrael", name: "Sandrael", rank: "B", family: "Bestia arcana", element: "Arena dorada", obstacle: "Dejarlo para después", weakness: "Planificar y priorizar", blurb: "Un ave de arena con un reloj en el pecho que susurra «mañana»." },
  { slug: "eclipsa", name: "Eclipsa", rank: "A", family: "Espectro", element: "Éter gris", obstacle: "La duda en uno mismo", weakness: "Reconocer tu propio progreso", blurb: "El espejo que dice mentiras. Se disuelve cuando le muestras lo que ya lograste." },
  { slug: "zhaal", name: "Zhaal, el Vacío", rank: "S", family: "Dragón de cristal", element: "Sombra y luz", obstacle: "Todo lo anterior", weakness: "Dominar todas las habilidades", blurb: "El jefe final del Gremio. En cada fase, su grieta de luz se abre más." },
];

export function guardianBySlug(slug: string): Guardian | undefined {
  return GUARDIANS.find((g) => g.slug === slug);
}

export const ELEMENT_COLOR: Record<string, string> = {
  luz: "#FFC83D", sombra: "#8A5CFF", fuego: "#FF6B6B", agua: "#2EE6D6", naturaleza: "#7FA36A", eter: "#E05CC8",
};
export const ELEMENT_LABEL: Record<string, string> = {
  luz: "Luz", sombra: "Sombra", fuego: "Fuego", agua: "Agua", naturaleza: "Naturaleza", eter: "Éter",
};
