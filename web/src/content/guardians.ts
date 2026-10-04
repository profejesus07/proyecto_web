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
  /** Lo que dice al empezar la batalla (su obstáculo hablando). */
  taunt: string;
  /** Lo que dice al purificarse. */
  thanks: string;
}

/** Los ocho Guardianes. Cada uno representa un obstáculo de aprendizaje, no una materia. */
export const GUARDIANS: readonly Guardian[] = [
  { slug: "petrox", name: "Petrox", rank: "E", family: "Gólem", element: "Naturaleza", obstacle: "«Es demasiado grande»", weakness: "Dividir en pasos pequeños", blurb: "Un gigante de piedra, torpe y tierno, que cree que ningún reto se puede empezar.", taunt: "Es demasiado grande… nadie puede con todo esto de una vez. ¿De verdad crees que tú sí?", thanks: "Piedra a piedra… ahora lo veo. Gracias por recordarme cómo se empieza. Vuelvo a construir puentes." },
  { slug: "ignaris", name: "Ignaris", rank: "D", family: "Dragón", element: "Fuego", obstacle: "Miedo a empezar y a equivocarse", weakness: "Probar, errar y reintentar", blurb: "Un dragón joven cuyas llamas se apagan con cada intento.", taunt: "¿Y si te equivocas? Mejor no lo intentes… mis llamas se apagan con solo pensarlo.", thanks: "¡Mis llamas vuelven a arder! Cada error era una pista. Gracias por enseñarme a intentarlo otra vez." },
  { slug: "brumalis", name: "Brumalis", rank: "C", family: "Espectro", element: "Sombra", obstacle: "El olvido", weakness: "Repasar y recordar", blurb: "Una figura de niebla que borra las pistas que ya viste.", taunt: "Shhh… lo que aprendiste ya se está borrando. Pronto no recordarás nada.", thanks: "La niebla se disipa… repasar trae de vuelta la luz. Gracias por no olvidar." },
  { slug: "mirelle", name: "Mirelle", rank: "C", family: "Coloso acuático", element: "Agua", obstacle: "No saber expresarse", weakness: "Explicar con tus propias palabras", blurb: "Una medusa-nube que habla en burbujas de letras revueltas.", taunt: "Blub… las palabras se revuelven… nadie entiende lo que piensas.", thanks: "¡Ahora se entiende! Explicarlo con tus palabras aclaró mis burbujas. Gracias." },
  { slug: "quimax", name: "Quimax", rank: "B", family: "Quimera", element: "Éter", obstacle: "Ideas sueltas", weakness: "Conectar conceptos", blurb: "León, búho y serpiente en uno: cada parte guarda un tema distinto.", taunt: "Tres cabezas, tres ideas… y ninguna se conecta con las demás.", thanks: "Ahora mis partes se escuchan entre sí. Conectar las ideas lo cambió todo. Gracias." },
  { slug: "sandrael", name: "Sandrael", rank: "B", family: "Bestia arcana", element: "Arena dorada", obstacle: "Dejarlo para después", weakness: "Planificar y priorizar", blurb: "Un ave de arena con un reloj en el pecho que susurra «mañana».", taunt: "Tic, tac… ¿para qué ahora? Mañana habrá tiempo. Siempre hay un mañana.", thanks: "Mi reloj vuelve a marcar el presente. Planear y empezar hoy… gracias por mostrármelo." },
  { slug: "eclipsa", name: "Eclipsa", rank: "A", family: "Espectro", element: "Éter gris", obstacle: "La duda en uno mismo", weakness: "Reconocer tu propio progreso", blurb: "El espejo que dice mentiras. Se disuelve cuando le muestras lo que ya lograste.", taunt: "Mírate en mi espejo: no eres capaz. Nunca lo fuiste.", thanks: "El espejo ya no miente: mira todo lo que lograste. Gracias por creer en ti." },
  { slug: "zhaal", name: "Zhaal, el Vacío", rank: "S", family: "Dragón de cristal", element: "Sombra y luz", obstacle: "Todo lo anterior", weakness: "Dominar todas las habilidades", blurb: "El jefe final del Gremio. En cada fase, su grieta de luz se abre más.", taunt: "Soy cada obstáculo que enfrentaste. Juntos, somos el Vacío. ¿Aún crees que puedes?", thanks: "La grieta de luz se abre por completo… dominaste todo lo que aprendiste. El Saber vuelve a brillar." },
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
