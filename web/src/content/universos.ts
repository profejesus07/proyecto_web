/**
 * Universos de UMBRAL: cada uno es una forma distinta de vivir el aprendizaje, con su estilo visual,
 * su historia y sus personajes. Los cursos y clases de hoy viven en «El Gremio de los Portales».
 */
export interface Universe {
  id: "gremio" | "hacker" | "dragon" | "pixel";
  name: string;
  style: string;
  tagline: string;
  status: "disponible" | "proximamente";
}

export const UNIVERSES: readonly Universe[] = [
  {
    id: "gremio", name: "El Gremio de los Portales", style: "Fantasía · aventura RPG", status: "disponible",
    tagline: "El Saber se rompió en mil portales. Cada curso es uno: crúzalo, enfrenta a su Guardián y devuelve la luz al mundo.",
  },
  {
    id: "hacker", name: "Academia Hacker", style: "Ciberpunk · terminal", status: "proximamente",
    tagline: "Una red secreta necesita mentes que piensen distinto. Descifra, programa y protege la ciudad desde la consola.",
  },
  {
    id: "dragon", name: "El Dragón de los Elementos", style: "Fantasía elemental", status: "proximamente",
    tagline: "Fuego, agua, tierra y aire perdieron su equilibrio. Aprende de cada elemento para despertar al dragón que los une.",
  },
  {
    id: "pixel", name: "Reino Pixel", style: "Pixel art · retro", status: "proximamente",
    tagline: "Un reino de 8 bits donde cada nivel superado reconstruye un pedazo del mapa. Clásico, directo y adictivo.",
  },
];
