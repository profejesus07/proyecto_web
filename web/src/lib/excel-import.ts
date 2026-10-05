/**
 * Importación de cursos y clases desde Excel. Funciones puras: reciben las hojas ya leídas
 * (filas de celdas) y devuelven un plan listo para guardar o la lista de errores, con su hoja y fila.
 *
 * Hojas (los nombres y encabezados no distinguen mayúsculas ni tildes):
 *   Curso        Campo | Valor
 *   Módulos      Módulo | Título | Descripción | Guardián                       (solo cursos cortos)
 *   Lecciones    Lección | Módulo | Periodo | Tipo | Título | Introducción | Explicación | Video | XP | Jefe
 *   Actividades  Lección | Tipo | Enunciado | Opción 1…6 | Correcta | Derecha 1…6 | Pista | Retroalimentación
 */
import { ACTIVITY_KINDS, normalizeActivity, type ActivityKind } from "@/lib/activities";
import { ELEMENT_LABEL, GUARDIANS } from "@/content/guardians";
import { MAX_CLASS_HOURS, MAX_INFORMAL_HOURS } from "@/lib/content";
import type { CourseInput, Element, LessonKind, MissionInput, ModuleInput, QuestionInput } from "@/lib/data/types";
import { MAX_BODY, READING_XP, videoEmbedUrl } from "@/lib/lessons";

export type Cell = string | number | boolean | Date | null | undefined;
export interface SheetIn { sheet: string; data: Cell[][] }

export interface PlannedLesson {
  number: number;
  moduleNumber: number | null;
  mission: Omit<MissionInput, "moduleId">;
  activities: QuestionInput[];
}

export interface ImportPlan {
  course: CourseInput;
  price: number | null;
  isFree: boolean;
  modules: (ModuleInput & { number: number })[];
  /** En el orden en que quedan en el curso (por módulo y número de lección). */
  lessons: PlannedLesson[];
}

export type ImportResult = { ok: true; plan: ImportPlan } | { ok: false; errors: string[] };

export const LIMITS = { modules: 30, lessons: 200, activities: 2000, errors: 30 };
/** Tamaño máximo del Excel (las acciones del servidor aceptan 1 MB con todo el formulario). */
export const MAX_IMPORT_BYTES = 900_000;

/** Minúsculas, sin tildes ni signos: para comparar nombres de hojas, encabezados y valores. */
export function norm(v: Cell): string {
  return text(v).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function text(v: Cell): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? "" : v.toISOString().slice(0, 10);
  return String(v).trim();
}

const yes = (v: Cell) => v === true || ["si", "s", "x", "1", "verdadero", "true", "yes"].includes(norm(v));

const KIND_WORDS: Record<string, ActivityKind> = {
  opcion: "opcion", "seleccion multiple": "opcion", seleccion: "opcion", multiple: "opcion",
  vf: "vf", "verdadero o falso": "vf", "verdadero falso": "vf", "falso o verdadero": "vf",
  completar: "completar", "respuesta corta": "completar", "completar respuesta corta": "completar",
  ordenar: "ordenar", "ordenar pasos": "ordenar", relacionar: "relacionar", "relacionar parejas": "relacionar", parejas: "relacionar",
};

function findSheet(sheets: SheetIn[], ...names: string[]): SheetIn | undefined {
  const want = names.map(norm);
  return sheets.find((s) => want.includes(norm(s.sheet)));
}

/** Filas como objetos por encabezado (normalizado), sin las filas vacías. Guarda el número de fila de Excel. */
function rowsOf(s: SheetIn): { line: number; get: (...keys: string[]) => Cell }[] {
  const [header, ...rest] = s.data;
  if (!header) return [];
  const cols = header.map((h) => norm(h));
  return rest
    .map((cells, i) => ({ cells, line: i + 2 }))
    .filter(({ cells }) => cells.some((c) => text(c) !== ""))
    .map(({ cells, line }) => ({
      line,
      get: (...keys: string[]) => {
        for (const k of keys) {
          const idx = cols.indexOf(norm(k));
          if (idx >= 0 && text(cells[idx]) !== "") return cells[idx];
        }
        return null;
      },
    }));
}

function guardianOf(v: Cell): string | null {
  const n = norm(v);
  if (!n) return null;
  const g = GUARDIANS.find((x) => x.slug === n || norm(x.name) === n || norm(x.name).split(" ")[0] === n);
  return g?.slug ?? null;
}

function elementOf(v: Cell): Element | null {
  const n = norm(v);
  const hit = Object.entries(ELEMENT_LABEL).find(([k, label]) => k === n || norm(label) === n);
  return (hit?.[0] as Element | undefined) ?? null;
}

function int(v: Cell): number | null {
  const t = text(v).replace(/[.\s$]/g, "").replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isInteger(n) ? n : NaN;
}

export function parseWorkbook(sheets: SheetIn[]): ImportResult {
  const errors: string[] = [];
  const err = (msg: string) => { if (errors.length < LIMITS.errors) errors.push(msg); };

  // ===== Curso =====
  const cs = findSheet(sheets, "curso", "clase", "curso o clase");
  if (!cs) return { ok: false, errors: ["Falta la hoja «Curso». Descarga la plantilla y úsala como base."] };
  const fields = new Map<string, Cell>();
  for (const row of cs.data) if (row && text(row[0])) fields.set(norm(row[0]), row[1] ?? null);
  const f = (...keys: string[]) => { for (const k of keys) { const v = fields.get(norm(k)); if (text(v) !== "") return v; } return null; };
  const at = (field: string) => `Hoja «Curso», campo «${field}»`;

  const kindWord = norm(f("tipo"));
  const kind = kindWord.startsWith("clase") ? "clase" : kindWord.startsWith("curso") || kindWord === "" ? "curso" : null;
  if (!kind) err(`${at("Tipo")}: escribe «curso» o «clase».`);
  const title = text(f("titulo", "nombre"));
  if (title.length < 3 || title.length > 80) err(`${at("Título")}: debe tener entre 3 y 80 caracteres.`);
  const summary = text(f("descripcion", "resumen"));
  if (summary.length > 400) err(`${at("Descripción")}: máximo 400 caracteres.`);
  const guardian = guardianOf(f("guardian")) ?? (f("guardian") ? null : "petrox");
  if (!guardian) err(`${at("Guardián")}: no existe. Usa uno de: ${GUARDIANS.map((g) => g.name).join(", ")}.`);
  const element = elementOf(f("elemento")) ?? (f("elemento") ? null : kind === "clase" ? "luz" : "eter");
  if (!element) err(`${at("Elemento")}: usa ${Object.values(ELEMENT_LABEL).join(", ")}.`);
  const hours = int(f("horas", "intensidad", "intensidad horaria"));
  const maxHours = kind === "clase" ? MAX_CLASS_HOURS : MAX_INFORMAL_HOURS;
  if (hours !== null && (Number.isNaN(hours) || hours < 1 || hours > maxHours)) err(`${at("Horas")}: ${kind === "clase" ? `entre 1 y ${MAX_CLASS_HOURS}` : "un curso corto dura entre 1 y 159 horas"}.`);
  const price = int(f("precio", "precio cop", "valor"));
  if (price !== null && (Number.isNaN(price) || price < 0 || price > 100_000_000)) err(`${at("Precio")}: escribe solo el número, en pesos.`);
  const isFree = yes(f("gratis"));
  const trainerName = text(f("formador", "nombre del formador")) || null;
  const trainerTitle = text(f("titulo del formador")) || null;
  if (trainerName && (trainerName.length < 3 || trainerName.length > 120)) err(`${at("Formador")}: entre 3 y 120 caracteres.`);
  if (trainerTitle && (trainerTitle.length < 3 || trainerTitle.length > 160)) err(`${at("Título del formador")}: entre 3 y 160 caracteres.`);
  const area = text(f("area")) || null;
  if (area && (area.length < 2 || area.length > 60)) err(`${at("Área")}: entre 2 y 60 caracteres.`);
  const grade = text(f("grado")) || null;
  if (grade && grade.length > 20) err(`${at("Grado")}: máximo 20 caracteres.`);
  const schoolYear = int(f("ano lectivo", "año lectivo", "ano"));
  if (schoolYear !== null && (Number.isNaN(schoolYear) || schoolYear < 2020 || schoolYear > 2100)) err(`${at("Año lectivo")}: un año entre 2020 y 2100.`);
  const untilRaw = f("fin del ano lectivo", "fin del año lectivo", "acceso hasta");
  const accessUntil = untilRaw ? text(untilRaw) : null;
  if (accessUntil && !/^\d{4}-\d{2}-\d{2}$/.test(accessUntil)) err(`${at("Fin del año lectivo")}: usa una fecha (AAAA-MM-DD).`);

  const course: CourseInput = {
    kind: kind ?? "curso", title, summary, guardian: guardian ?? "petrox", element: element ?? "eter",
    area: kind === "clase" ? area : null, grade: kind === "clase" ? grade : null,
    schoolYear: kind === "clase" ? schoolYear : null, accessUntil: kind === "clase" ? accessUntil : null,
    hours: Number.isNaN(hours) ? null : hours,
    trainerName: kind === "curso" ? trainerName : null, trainerTitle: kind === "curso" ? trainerTitle : null,
  };

  // ===== Módulos =====
  const modules: ImportPlan["modules"] = [];
  if (course.kind === "curso") {
    const ms = findSheet(sheets, "modulos", "módulos");
    if (!ms) err("Falta la hoja «Módulos»: un curso corto se organiza en módulos.");
    else for (const r of rowsOf(ms)) {
      const at2 = `Hoja «Módulos», fila ${r.line}`;
      const number = int(r.get("modulo", "numero", "n"));
      const t = text(r.get("titulo"));
      const g = guardianOf(r.get("guardian")) ?? (r.get("guardian") ? null : course.guardian);
      if (number === null || Number.isNaN(number) || number < 1) { err(`${at2}: falta el número del módulo.`); continue; }
      if (modules.some((m) => m.number === number)) err(`${at2}: el módulo ${number} está repetido.`);
      if (t.length < 2 || t.length > 80) err(`${at2}: el título debe tener entre 2 y 80 caracteres.`);
      const s = text(r.get("descripcion", "resumen"));
      if (s.length > 400) err(`${at2}: la descripción puede tener máximo 400 caracteres.`);
      if (!g) err(`${at2}: ese Guardián no existe.`);
      modules.push({ number, title: t, summary: s, guardian: g ?? course.guardian });
    }
    if (ms && !modules.length) err("La hoja «Módulos» está vacía: agrega al menos un módulo.");
    if (modules.length > LIMITS.modules) err(`Máximo ${LIMITS.modules} módulos por curso.`);
    modules.sort((a, b) => a.number - b.number);
  }

  // ===== Lecciones =====
  const ls = findSheet(sheets, "lecciones", "leccion");
  const lessons: PlannedLesson[] = [];
  if (!ls) err("Falta la hoja «Lecciones».");
  else for (const r of rowsOf(ls)) {
    const at2 = `Hoja «Lecciones», fila ${r.line}`;
    const number = int(r.get("leccion", "numero", "n"));
    if (number === null || Number.isNaN(number) || number < 1) { err(`${at2}: falta el número de la lección.`); continue; }
    if (lessons.some((l) => l.number === number)) err(`${at2}: la lección ${number} está repetida.`);
    const kindCell = norm(r.get("tipo"));
    const lessonKind: LessonKind = kindCell.startsWith("expl") || kindCell.startsWith("lect") || kindCell.startsWith("teor") ? "explicacion" : "reto";
    const t = text(r.get("titulo"));
    if (t.length < 3 || t.length > 120) err(`${at2}: el título debe tener entre 3 y 120 caracteres.`);
    const intro = text(r.get("introduccion"));
    if (intro.length > 400) err(`${at2}: la introducción puede tener máximo 400 caracteres.`);
    const body = text(r.get("explicacion", "texto", "texto de la explicacion", "contenido"));
    if (lessonKind === "explicacion" && body.length < 20) err(`${at2}: escribe el texto de la explicación (al menos 20 caracteres).`);
    if (body.length > MAX_BODY) err(`${at2}: la explicación puede tener máximo ${MAX_BODY} caracteres.`);
    const video = text(r.get("video")) || null;
    if (video && !videoEmbedUrl(video)) err(`${at2}: el video debe ser un enlace de YouTube o Vimeo.`);
    const xp = int(r.get("xp"));
    if (xp !== null && (Number.isNaN(xp) || xp < 0 || xp > 1000)) err(`${at2}: XP entre 0 y 1000.`);
    const isBoss = yes(r.get("jefe", "guardian", "prueba del guardian"));
    if (isBoss && lessonKind === "explicacion") err(`${at2}: una explicación no puede ser el reto del Guardián.`);
    let moduleNumber: number | null = null;
    let period: number | null = null;
    if (course.kind === "curso") {
      moduleNumber = int(r.get("modulo"));
      if (moduleNumber === null || Number.isNaN(moduleNumber) || !modules.some((m) => m.number === moduleNumber)) err(`${at2}: indica un módulo que exista en la hoja «Módulos».`);
    } else {
      period = int(r.get("periodo"));
      if (period !== null && (Number.isNaN(period) || period < 1 || period > 4)) err(`${at2}: el periodo va de 1 a 4.`);
    }
    lessons.push({
      number, moduleNumber, activities: [],
      mission: {
        title: t, intro, xpReward: xp ?? (lessonKind === "explicacion" ? READING_XP : 50), isBoss: lessonKind === "reto" && isBoss,
        period: Number.isNaN(period) ? null : period, lessonKind, body: lessonKind === "explicacion" ? body : "", videoUrl: lessonKind === "explicacion" ? video : null,
      },
    });
  }
  if (ls && !lessons.length) err("La hoja «Lecciones» está vacía.");
  if (lessons.length > LIMITS.lessons) err(`Máximo ${LIMITS.lessons} lecciones por curso.`);

  // ===== Actividades =====
  const as = findSheet(sheets, "actividades", "preguntas");
  let count = 0;
  if (as) for (const r of rowsOf(as)) {
    const at2 = `Hoja «Actividades», fila ${r.line}`;
    const n = int(r.get("leccion"));
    const lesson = lessons.find((l) => l.number === n);
    if (!lesson) { err(`${at2}: la lección ${text(r.get("leccion")) || "(vacía)"} no existe en la hoja «Lecciones».`); continue; }
    if (lesson.mission.lessonKind === "explicacion") { err(`${at2}: la lección ${n} es una explicación; las actividades van en los retos.`); continue; }
    const kindN = norm(r.get("tipo"));
    const kind = KIND_WORDS[kindN] ?? (ACTIVITY_KINDS as readonly string[]).find((k) => k === kindN) as ActivityKind | undefined;
    if (!kind) { err(`${at2}: tipo de actividad no válido. Usa: selección múltiple, verdadero o falso, completar, ordenar o relacionar.`); continue; }
    const prompt = text(r.get("enunciado", "pregunta"));
    if (prompt.length < 5 || prompt.length > 400) err(`${at2}: el enunciado debe tener entre 5 y 400 caracteres.`);
    const hint = text(r.get("pista"));
    if (hint.length > 200) err(`${at2}: la pista puede tener máximo 200 caracteres.`);
    const explanation = text(r.get("retroalimentacion", "explicacion"));
    if (explanation.length > 500) err(`${at2}: la retroalimentación puede tener máximo 500 caracteres.`);
    const options = [1, 2, 3, 4, 5, 6].map((i) => text(r.get(`opcion ${i}`, `respuesta ${i}`, `paso ${i}`, `izquierda ${i}`)).slice(0, 200));
    const right = [1, 2, 3, 4, 5, 6].map((i) => text(r.get(`derecha ${i}`)).slice(0, 200));
    const correctCell = r.get("correcta", "respuesta correcta");
    let correctIndex = -1;
    if (kind === "vf") {
      const c = norm(correctCell);
      correctIndex = ["verdadero", "v", "si", "true", "1"].includes(c) ? 0 : ["falso", "f", "no", "false", "0", "2"].includes(c) ? 1 : -1;
    } else if (kind === "opcion") {
      const c = int(correctCell);
      if (c !== null && !Number.isNaN(c)) correctIndex = c - 1;
      else { const byText = options.findIndex((o) => o && norm(o) === norm(correctCell)); correctIndex = byText; }
    }
    const activity = normalizeActivity({ kind, options, right, correctIndex });
    if ("error" in activity) { err(`${at2}: ${activity.error}`); continue; }
    lesson.activities.push({ prompt, hint, explanation, kind, ...activity });
    count++;
  }
  if (count > LIMITS.activities) err(`Máximo ${LIMITS.activities} actividades por curso.`);
  for (const l of lessons) if (l.mission.lessonKind === "reto" && !l.activities.length) err(`La lección ${l.number} («${l.mission.title}») es un reto y no tiene actividades en la hoja «Actividades».`);

  if (errors.length) return { ok: false, errors };

  // Orden final: por módulo y luego por número de lección.
  const modPos = new Map(modules.map((m, i) => [m.number, i]));
  lessons.sort((a, b) => (modPos.get(a.moduleNumber ?? -1) ?? 0) - (modPos.get(b.moduleNumber ?? -1) ?? 0) || a.number - b.number);
  return { ok: true, plan: { course, price: price === null || Number.isNaN(price) ? null : price, isFree, modules, lessons } };
}
