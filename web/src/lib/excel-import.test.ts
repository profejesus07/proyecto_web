import { describe, expect, it } from "vitest";
import { parseWorkbook, type SheetIn } from "./excel-import";
import { templateSheets } from "./excel-template";

/** La plantilla, como la leería read-excel-file (solo los valores). */
const fromTemplate = (): SheetIn[] => templateSheets().map((s) => ({ sheet: s.sheet, data: s.data.map((r) => r.map((c) => c?.value ?? null)) }));
const replace = (sheets: SheetIn[], name: string, data: SheetIn["data"]) => sheets.map((s) => (s.sheet === name ? { ...s, data } : s));

describe("parseWorkbook", () => {
  it("la plantilla de ejemplo se importa completa", () => {
    const r = parseWorkbook(fromTemplate());
    if (!r.ok) throw new Error(r.errors.join("\n"));
    expect(r.plan.course).toMatchObject({ kind: "curso", title: "Aprender a aprender", guardian: "petrox", element: "naturaleza", hours: 12 });
    expect(r.plan.price).toBe(20000);
    expect(r.plan.isFree).toBe(false);
    expect(r.plan.modules).toHaveLength(1);
    expect(r.plan.lessons.map((l) => [l.number, l.mission.lessonKind, l.mission.isBoss, l.activities.length])).toEqual([
      [1, "explicacion", false, 0], [2, "reto", false, 2], [3, "reto", true, 3],
    ]);
    const [opcion, ordenar] = r.plan.lessons[1].activities;
    expect(opcion).toMatchObject({ kind: "opcion", correctIndex: 1, options: ["Esperar a tener ganas", "Dividirlo en pasos", "Hacerlo todo de una vez"] });
    expect(ordenar).toMatchObject({ kind: "ordenar", options: ["Escribir el objetivo", "Listar los pasos", "Hacer el primer paso"] });
    const [vf, rel, comp] = r.plan.lessons[2].activities;
    expect(vf).toMatchObject({ kind: "vf", correctIndex: 0 });
    expect(rel).toMatchObject({ kind: "relacionar", options: ["Objetivo", "Paso"], data: { right: ["Aprobar el examen", "Repasar un tema hoy"] } });
    expect(comp).toMatchObject({ kind: "completar", options: ["pequeños", "pequenos"] });
  });

  it("señala la hoja y la fila de cada error", () => {
    let s = fromTemplate();
    s = replace(s, "Lecciones", [
      ["Lección", "Módulo", "Periodo", "Tipo", "Título", "Introducción", "Explicación", "Video", "XP", "Jefe"],
      [1, 9, null, "Explicación", "Hola", null, "corta", "https://malo.com/v", null, "no"],
      [2, 1, null, "Reto", "Sin actividades", null, null, null, null, "sí"],
    ]);
    s = replace(s, "Actividades", [["Lección", "Tipo", "Enunciado"], [7, "opcion", "¿Algo aquí?"], [2, "dibujar", "¿Qué tipo es este?"]]);
    const r = parseWorkbook(s);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toEqual(expect.arrayContaining([
      "Hoja «Lecciones», fila 2: escribe el texto de la explicación (al menos 20 caracteres).",
      "Hoja «Lecciones», fila 2: el video debe ser un enlace de YouTube o Vimeo.",
      "Hoja «Lecciones», fila 2: indica un módulo que exista en la hoja «Módulos».",
      "Hoja «Actividades», fila 2: la lección 7 no existe en la hoja «Lecciones».",
      "Hoja «Actividades», fila 3: tipo de actividad no válido. Usa: selección múltiple, verdadero o falso, completar, ordenar o relacionar.",
      "La lección 2 («Sin actividades») es un reto y no tiene actividades en la hoja «Actividades».",
    ]));
  });

  it("una clase usa periodos, admite más horas y no necesita módulos", () => {
    let s = fromTemplate().filter((x) => x.sheet !== "Módulos");
    s = replace(s, "Curso", [["Campo", "Valor"], ["Tipo", "Clase"], ["Título", "Ciencias 5.° · 2027"], ["Horas", 160], ["Área", "Ciencias"], ["Grado", "5.°"], ["Año lectivo", 2027], ["Fin del año lectivo", new Date("2027-11-30T00:00:00Z")], ["Gratis", "sí"]]);
    s = replace(s, "Lecciones", [["Lección", "Periodo", "Tipo", "Título", "Explicación"], [1, 1, "Explicación", "Los seres vivos", "Los seres vivos nacen, crecen y se reproducen."], [2, 1, "Reto", "Practica"]]);
    s = replace(s, "Actividades", [["Lección", "Tipo", "Enunciado", "Correcta"], [2, "Verdadero o falso", "Las plantas son seres vivos.", "Verdadero"]]);
    const r = parseWorkbook(s);
    if (!r.ok) throw new Error(r.errors.join("\n"));
    expect(r.plan.course).toMatchObject({ kind: "clase", hours: 160, area: "Ciencias", grade: "5.°", schoolYear: 2027, accessUntil: "2027-11-30", trainerName: null });
    expect(r.plan.isFree).toBe(true);
    expect(r.plan.lessons.map((l) => l.mission.period)).toEqual([1, 1]);
  });

  it("sin la hoja «Curso» no sigue", () => {
    expect(parseWorkbook([{ sheet: "Hoja1", data: [] }])).toEqual({ ok: false, errors: ["Falta la hoja «Curso». Descarga la plantilla y úsala como base."] });
  });
});

describe("archivo real", () => {
  it("la plantilla escrita como .xlsx se vuelve a leer e importar", async () => {
    const { default: writeXlsxFile } = await import("write-excel-file/node");
    const { default: readXlsxFile } = await import("read-excel-file/node");
    const sheets = templateSheets();
    const buffer = await writeXlsxFile(sheets.map((s) => ({ sheet: s.sheet, data: s.data, columns: s.columns })) as never).toBuffer();
    const read = await readXlsxFile(buffer);
    expect(read.map((s) => s.sheet)).toEqual(["Instrucciones", "Curso", "Módulos", "Lecciones", "Actividades"]);
    const r = parseWorkbook(read as SheetIn[]);
    if (!r.ok) throw new Error(r.errors.join("\n"));
    expect(r.plan.lessons).toHaveLength(3);
    expect(r.plan.lessons[0].mission.body).toContain("## El truco");
  });
});
