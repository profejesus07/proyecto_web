import type { CourseKind, EditableCourse } from "@/lib/data/types";

/** Curso de educación informal: siempre menos de 160 horas (Decreto 1075 de 2015, art. 2.6.6.8). */
export const MAX_INFORMAL_HOURS = 159;

/** Leyenda obligatoria en toda promoción de un curso de educación informal. */
export const INFORMAL_NOTICE = "Educación informal (Ley 115 de 1994 y Decreto 1075 de 2015). No conduce a título ni a certificado de aptitud ocupacional; al finalizar se expide una constancia de asistencia.";

export const KIND_LABEL: Record<CourseKind, string> = { clase: "Clase", curso: "Curso corto" };
export const PERIODS = [1, 2, 3, 4] as const;
export const GRADES = ["Transición", "1.°", "2.°", "3.°", "4.°", "5.°", "6.°", "7.°", "8.°", "9.°", "10.°", "11.°"] as const;

/** Identificador de la dirección web de un portal: «matematicas-6-2027-x7k2». */
export function slugify(title: string, suffix: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return `${base || "portal"}-${suffix}`;
}

/** Lo que falta para poder publicar un portal (vacío = listo). */
export function publishProblems(c: EditableCourse): string[] {
  const out: string[] = [];
  if (c.kind === "clase") {
    if (!c.area) out.push("Falta el área.");
    if (!c.grade) out.push("Falta el grado.");
    if (!c.schoolYear) out.push("Falta el año lectivo.");
    if (!c.accessUntil) out.push("Falta la fecha de fin del año lectivo.");
    if (c.missions.some((m) => !m.period)) out.push("Cada lección de una clase necesita su periodo (1.° a 4.°).");
  } else {
    if (!c.hours) out.push("Falta la intensidad horaria (menos de 160 horas).");
    if (!c.trainerName) out.push("Falta el nombre del formador.");
    if (!c.trainerTitle) out.push("Falta el título del formador.");
  }
  if (c.missions.length === 0) out.push("Agrega al menos una lección.");
  c.missions.forEach((m) => {
    if (m.questions.length === 0) out.push(`La lección «${m.title}» no tiene preguntas.`);
  });
  if (c.kind === "curso" && !c.modules.length) out.push("Organiza el curso en módulos (al menos uno).");
  if (c.kind === "curso" && c.modules.length) {
    // Curso por módulos: cada módulo termina con la prueba de su Guardián (y es la única del módulo).
    if (c.missions.some((m) => !m.moduleId)) out.push("Cada lección debe estar dentro de un módulo.");
    for (const mod of c.modules) {
      const ls = c.missions.filter((m) => m.moduleId === mod.id).sort((a, b) => a.position - b.position);
      if (!ls.length) { out.push(`El módulo «${mod.title}» no tiene lecciones.`); continue; }
      const bosses = ls.filter((m) => m.isBoss);
      if (bosses.length !== 1 || ls[ls.length - 1].id !== bosses[0].id) out.push(`El módulo «${mod.title}» debe terminar con una sola prueba de su Guardián (su última lección).`);
    }
    return out;
  }
  const bosses = c.missions.filter((m) => m.isBoss);
  if (bosses.length > 1) out.push("Solo puede haber una prueba del Guardián.");
  if (bosses.length === 1 && c.missions[c.missions.length - 1]?.id !== bosses[0].id) out.push("La prueba del Guardián debe ser la última lección.");
  return out;
}
