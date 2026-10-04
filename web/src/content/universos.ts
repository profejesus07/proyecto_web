/**
 * Universos de UMBRAL: cada uno es una forma distinta de vivir el aprendizaje, con su estilo visual,
 * su historia y sus personajes. Los cursos y clases de hoy viven en «El Gremio de los Portales».
 * Los próximos universos se agregan aquí cuando estén listos.
 */
export interface Universe {
  id: "gremio";
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
];
