import { describe, expect, it } from "vitest";
import type { EditableCourse, EditableMission } from "@/lib/data/types";
import { publishProblems, slugify } from "./content";

const mission = (id: string, extra: Partial<EditableMission> = {}): EditableMission => ({
  id, courseSlug: "c", position: 1, title: `Lección ${id}`, intro: "", xpReward: 50, isBoss: false, period: 1, moduleId: null, lessonKind: "reto", body: "", videoUrl: null, hasProgress: false,
  questions: [{ id: `${id}q`, position: 1, prompt: "¿Pregunta?", kind: "opcion", options: ["a", "b"], correctIndex: 0, right: [], hint: "", explanation: "" }],
  ...extra,
});
const base: EditableCourse = {
  slug: "c", title: "C", summary: "", element: "luz", guardian: "petrox", position: 1, price: null, published: false,
  kind: "curso", area: null, grade: null, schoolYear: null, accessUntil: null, hours: 20, trainerName: "Ana Pérez", trainerTitle: "Magíster en Educación",
  isFree: false, modules: [{ id: "m1", position: 1, title: "Uno", summary: "", guardian: "petrox" }],
  missions: [mission("a", { moduleId: "m1", lessonKind: "explicacion", body: "Así se divide un reto grande en pasos.", questions: [] }), mission("b", { moduleId: "m1", position: 2, isBoss: true })],
};
const reading = (id: string, extra: Partial<EditableMission> = {}) => mission(id, { lessonKind: "explicacion", body: "Texto suficiente para explicar el tema.", questions: [], ...extra });

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
    expect(publishProblems({ ...base, missions: [mission("a", { isBoss: true, moduleId: "m1" }), mission("b", { moduleId: "m1", position: 2 })] }))
      .toContain("El módulo «Uno» debe terminar con una sola prueba de su Guardián (su última lección).");
    expect(publishProblems({ ...base, modules: [] })).toContain("Organiza el curso en módulos (al menos uno).");
    // Las clases (por periodos) siguen con un solo Guardián al final.
    const clase = { ...base, kind: "clase" as const, area: "Ciencias", grade: "5.°", schoolYear: 2027, accessUntil: "2027-11-30", modules: [] };
    expect(publishProblems({ ...clase, missions: [mission("a", { isBoss: true }), mission("b")] })).toContain("La prueba del Guardián debe ser la última lección.");
  });
});

describe("publishProblems con módulos", () => {
  const mods = [{ id: "m1", position: 1, title: "Uno", summary: "", guardian: "petrox" }, { id: "m2", position: 2, title: "Dos", summary: "", guardian: "ignaris" }];
  it("cada módulo termina con la prueba de su Guardián", () => {
    const ok: EditableCourse = { ...base, modules: mods, missions: [
      reading("a", { moduleId: "m1", position: 1 }), mission("b", { moduleId: "m1", position: 2, isBoss: true }),
      reading("c0", { moduleId: "m2", position: 3 }), mission("c", { moduleId: "m2", position: 4, isBoss: true }),
    ] };
    expect(publishProblems(ok)).toEqual([]);
    const bad: EditableCourse = { ...ok, missions: [mission("a", { moduleId: "m1", position: 1, isBoss: true }), mission("b", { moduleId: "m1", position: 2 }), mission("c", { position: 3 })] };
    const problems = publishProblems(bad);
    expect(problems).toContain("Cada lección debe estar dentro de un módulo.");
    expect(problems.some((p) => p.includes("«Uno» debe terminar"))).toBe(true);
    expect(problems.some((p) => p.includes("«Dos» no tiene lecciones"))).toBe(true);
  });
});

describe("lecciones de explicación", () => {
  it("cada módulo necesita su explicación, con texto; no lleva preguntas", () => {
    const sinExplicacion: EditableCourse = { ...base, missions: [mission("a", { moduleId: "m1" }), mission("b", { moduleId: "m1", position: 2, isBoss: true })] };
    expect(publishProblems(sinExplicacion)).toContain("El módulo «Uno» necesita una lección de explicación (lo ideal: la primera).");
    const vacia: EditableCourse = { ...base, missions: [reading("a", { moduleId: "m1", body: "" }), mission("b", { moduleId: "m1", position: 2, isBoss: true })] };
    expect(publishProblems(vacia)).toContain("La explicación «Lección a» no tiene texto.");
    expect(publishProblems(base).some((p) => p.includes("no tiene preguntas"))).toBe(false);
  });
});
