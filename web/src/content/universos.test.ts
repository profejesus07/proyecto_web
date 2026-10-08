import { describe, expect, it } from "vitest";
import { UNIVERSES, cursosDelUniverso, universoDeCurso } from "./universos";

describe("universos", () => {
  it("el Gremio de los Portales es el primero y está disponible", () => {
    expect(UNIVERSES[0]).toMatchObject({ id: "gremio", status: "disponible" });
  });

  it("los ids no se repiten", () => {
    expect(new Set(UNIVERSES.map((u) => u.id)).size).toBe(UNIVERSES.length);
  });

  it("cada curso pertenece a un universo que existe", () => {
    const ids = new Set(UNIVERSES.map((u) => u.id));
    for (const slug of ["primer-portal", "portal-del-primer-intento", "otro"]) expect(ids.has(universoDeCurso({ slug }))).toBe(true);
  });

  it("los cursos del Gremio conservan el orden del catálogo", () => {
    const cursos = [{ slug: "b" }, { slug: "a" }, { slug: "c" }];
    expect(cursosDelUniverso("gremio", cursos).map((c) => c.slug)).toEqual(["b", "a", "c"]);
  });
});
