/**
 * Universos de UMBRAL: cada uno es una forma distinta de vivir el aprendizaje, con su estilo visual,
 * su historia y sus personajes. Los cursos y clases de hoy viven en «El Gremio de los Portales».
 *
 * Agregar un universo:
 * 1. Su id en UniverseId y una entrada en UNIVERSES (empieza como "proximamente" si aún no tiene cursos).
 * 2. Sus tokens en globals.css, bajo [data-universo="<id>"] (acento y tipografía de títulos; por ejemplo,
 *    una fuente pixel art).
 * 3. Su miniatura en components/universe-art.tsx.
 * 4. Qué cursos le pertenecen en universoDeCurso.
 * Mientras no haya un universo «próximamente» con nombre, el inicio muestra una tarjeta genérica.
 */
import type { Course } from "@/lib/data/types";

export type UniverseId = "gremio";

export interface Universe {
  id: UniverseId;
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

/**
 * Universo al que pertenece un curso. La base de datos aún no guarda el universo de cada curso, así que hoy
 * todos son del Gremio de los Portales. Cuando haya un segundo universo con cursos, esto pasa a leer una
 * columna del curso (cambio en la base de datos, con aprobación).
 */
export function universoDeCurso(curso: Pick<Course, "slug">): UniverseId {
  void curso;
  return "gremio";
}

/** Los cursos de un universo, en el orden en que llegan. */
export function cursosDelUniverso<T extends Pick<Course, "slug">>(id: UniverseId, cursos: readonly T[]): T[] {
  return cursos.filter((c) => universoDeCurso(c) === id);
}
