import { describe, expect, it } from "vitest";
import type { EditableCourse, EditableMission } from "@/lib/data/types";
import { publishProblems, slugify } from "./content";

const mission = (id: string, extra: Partial<EditableMission> = {}): EditableMission => ({
  id, courseSlug: "c", position: 1, title: `Lección ${id}`, intro: "", xpReward: 50, isBoss: false, period: 1, hasProgress: false,
  questions: [{ id: `${id}q`, position: 1, prompt: "¿Pregunta?", options: ["a", "b"], correctIndex: 0, hint: "", explanation: "" }],
  ...extra,
});
const base: EditableCourse = {
  slug: "c", title: "C", summary: "", element: "luz", guardian: "petrox", position: 1, price: null, published: false,
  kind: "curso", area: null, grade: null, schoolYear: null, accessUntil: null, hours: 20, trainerName: "Ana Pérez", trainerTitle: "Magíster en Educación",
  missions: [mission("a"), mission("b", { isBoss: true })],
};

describe("slugify", () => {
  it("quita tildes, espacios y signos", () => {
    expect(slugify("Matemáticas 6.° · 2027", "ab12")).toBe("matematicas-6-2027-ab12");
    expect(slugify("¡¡¡", "x1y2")).toBe("portal-x1y2");
  });
});

describe("publishProblems", () => {
  it("un curso completo se puede publicar", () => {
    expect(publishProblems(base)).toEqual([]);
  });

  it("un curso corto necesita horas, formador y su título", () => {
    expect(publishProblems({ ...base, hours: null, trainerName: null, trainerTitle: null })).toEqual([
      "Falta la intensidad horaria (menos de 160 horas).", "Falta el nombre del formador.", "Falta el título del formador.",
    ]);
  });

  it("una clase necesita área, grado, año, fin de año y periodos", () => {
    const p = publishProblems({ ...base, kind: "clase", missions: [mission("a", { period: null })] });
    expect(p).toEqual(expect.arrayContaining(["Falta el área.", "Falta el grado.", "Falta el año lectivo.", "Falta la fecha de fin del año lectivo.",
      "Cada lección de una clase necesita su periodo (1.° a 4.°)."]));
  });

  it("exige lecciones con preguntas y el Guardián al final", () => {
    expect(publishProblems({ ...base, missions: [] })).toContain("Agrega al menos una lección.");
    expect(publishProblems({ ...base, missions: [mission("a", { questions: [] })] })).toContain("La lección «Lección a» no tiene preguntas.");
    expect(publishProblems({ ...base, missions: [mission("a", { isBoss: true }), mission("b")] })).toContain("La prueba del Guardián debe ser la última lección.");
  });
});
