"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { MAX_BODY, videoEmbedUrl } from "@/lib/lessons";
import readXlsxFile from "read-excel-file/node";
import { MAX_IMPORT_BYTES, parseWorkbook, type SheetIn } from "@/lib/excel-import";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GUARDIANS } from "@/content/guardians";
import { getViewer } from "@/lib/auth";
import { MAX_CLASS_HOURS, MAX_INFORMAL_HOURS, publishProblems, slugify } from "@/lib/content";
import { getRepo } from "@/lib/data";
import { asKind, normalizeActivity } from "@/lib/activities";
import type { CourseInput, MissionInput, ModuleInput, QuestionInput } from "@/lib/data/types";
import { isAdmin } from "@/lib/roles";

// Editor de contenido: cada acción comprueba que quien llama es el administrador.

export type EditorState = { error?: string; message?: string; problems?: string[] } | undefined;

async function requireAdminId(): Promise<string | null> {
  const viewer = await getViewer();
  return viewer && isAdmin(viewer.role) ? viewer.id : null;
}

const NOT_ADMIN = "Solo el administrador puede editar el contenido.";
const text = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label}: escribe al menos ${min} caracteres.`).max(max, `${label}: máximo ${max} caracteres.`);
const optText = (max: number, label: string) => z.string().trim().max(max, `${label}: máximo ${max} caracteres.`);
const blankToNull = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
};

const ELEMENTS = ["luz", "sombra", "fuego", "agua", "naturaleza", "eter"] as const;

const courseSchema = z.object({
  kind: z.enum(["clase", "curso"]),
  title: text(3, 80, "Título"),
  summary: optText(400, "Descripción"),
  guardian: z.enum(GUARDIANS.map((g) => g.slug) as [string, ...string[]]),
  element: z.enum(ELEMENTS),
  area: z.string().trim().min(2).max(60).nullable(),
  grade: z.string().trim().min(1).max(20).nullable(),
  schoolYear: z.coerce.number().int().min(2020, "Año lectivo no válido.").max(2100, "Año lectivo no válido.").nullable(),
  accessUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida.").nullable(),
  hours: z.coerce.number().int().min(1, "La intensidad debe ser de al menos 1 hora.").max(MAX_CLASS_HOURS, `La intensidad puede ser de máximo ${MAX_CLASS_HOURS} horas.`).nullable(),
  trainerName: z.string().trim().min(3, "Nombre del formador: al menos 3 caracteres.").max(120).nullable(),
  trainerTitle: z.string().trim().min(3, "Título del formador: al menos 3 caracteres.").max(160).nullable(),
}).refine((c) => c.kind !== "curso" || c.hours === null || c.hours <= MAX_INFORMAL_HOURS, { message: "Un curso de educación informal debe durar menos de 160 horas.", path: ["hours"] });

function readCourse(fd: FormData) {
  return courseSchema.safeParse({
    kind: fd.get("kind"), title: fd.get("title") ?? "", summary: fd.get("summary") ?? "",
    guardian: fd.get("guardian"), element: fd.get("element"),
    area: blankToNull(fd.get("area")), grade: blankToNull(fd.get("grade")),
    schoolYear: blankToNull(fd.get("schoolYear")), accessUntil: blankToNull(fd.get("accessUntil")),
    hours: blankToNull(fd.get("hours")), trainerName: blankToNull(fd.get("trainerName")), trainerTitle: blankToNull(fd.get("trainerTitle")),
  });
}

function refresh(slug?: string) {
  revalidatePath("/admin/contenido", "layout");
  revalidatePath("/portales", "layout");
  if (slug) revalidatePath(`/portales/${slug}`);
}

export async function createCourseAction(_prev: EditorState, fd: FormData): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  const kind = fd.get("kind") === "clase" ? "clase" : "curso";
  const title = String(fd.get("title") ?? "").trim();
  if (title.length < 3 || title.length > 80) return { error: "El título debe tener entre 3 y 80 caracteres." };
  const rawHours = String(fd.get("hours") ?? "").trim();
  const hours = rawHours === "" ? null : Number(rawHours);
  const maxHours = kind === "curso" ? MAX_INFORMAL_HOURS : MAX_CLASS_HOURS;
  if (hours !== null && (!Number.isInteger(hours) || hours < 1 || hours > maxHours)) {
    return { error: kind === "curso" ? "Un curso corto debe durar entre 1 y 159 horas." : `Las horas de la clase deben estar entre 1 y ${MAX_CLASS_HOURS}.` };
  }
  const slug = slugify(title, randomBytes(3).toString("hex").slice(0, 4));
  const input: CourseInput = {
    kind, title, summary: "", element: kind === "clase" ? "luz" : "eter", guardian: "petrox",
    area: null, grade: null, schoolYear: kind === "clase" ? new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0) : null,
    accessUntil: null, hours, trainerName: null, trainerTitle: null,
  };
  try {
    await getRepo().createCourse(slug, input);
    // Un curso corto empieza con su primer módulo.
    if (kind === "curso") await getRepo().createModule(slug, { title: "Módulo 1", summary: "", guardian: input.guardian });
  } catch {
    return { error: "No pudimos crear el portal. Inténtalo de nuevo." };
  }
  refresh();
  redirect(`/admin/contenido/${slug}`);
}

export type ImportState = { error?: string; errors?: string[] } | undefined;

/** Crea un curso o una clase completos (como borrador) desde la plantilla de Excel. */
export async function importCourseAction(_prev: ImportState, fd: FormData): Promise<ImportState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Elige el archivo de Excel (.xlsx)." };
  if (!/\.xlsx$/i.test(file.name)) return { error: "El archivo debe ser de Excel (.xlsx). Si lo tienes en otro formato, guárdalo como «Libro de Excel»." };
  if (file.size > MAX_IMPORT_BYTES) return { error: "El archivo es muy grande (máximo 900 KB). Quita imágenes o formatos que no hagan falta." };
  let sheets: SheetIn[];
  try {
    sheets = (await readXlsxFile(Buffer.from(await file.arrayBuffer()))) as SheetIn[];
  } catch {
    return { error: "No pudimos leer el archivo. Revisa que sea un Excel (.xlsx) válido, basado en la plantilla." };
  }
  const r = parseWorkbook(sheets);
  if (!r.ok) return { errors: r.errors };
  const slug = slugify(r.plan.course.title, randomBytes(3).toString("hex").slice(0, 4));
  try {
    await getRepo().importCourse(slug, r.plan);
  } catch {
    return { error: "No pudimos guardar el curso. Inténtalo de nuevo." };
  }
  refresh();
  redirect(`/admin/contenido/${slug}?importado=1`);
}

export async function saveCourseAction(slug: string, _prev: EditorState, fd: FormData): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  const parsed = readCourse(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const v = parsed.data;
  // Cada tipo guarda solo sus propios datos.
  const input: CourseInput = {
    ...v,
    element: v.element,
    area: v.kind === "clase" ? v.area : null,
    grade: v.kind === "clase" ? v.grade : null,
    schoolYear: v.kind === "clase" ? v.schoolYear : null,
    accessUntil: v.kind === "clase" ? v.accessUntil : null,
    hours: v.hours,
    trainerName: v.kind === "curso" ? v.trainerName : null,
    trainerTitle: v.kind === "curso" ? v.trainerTitle : null,
  };
  try {
    await getRepo().updateCourse(slug, input);
  } catch {
    return { error: "No pudimos guardar. Inténtalo de nuevo." };
  }
  refresh(slug);
  return { message: "Guardado." };
}

export async function publishCourseAction(slug: string, published: boolean): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  const repo = getRepo();
  if (published) {
    const course = await repo.getCourseForEdit(slug);
    if (!course) return { error: "No encontramos el portal." };
    const problems = publishProblems(course);
    if (problems.length) return { error: "Todavía no se puede publicar.", problems };
  }
  await repo.setCoursePublished(slug, published);
  refresh(slug);
  return { message: published ? "¡Publicado! Ya lo ven tus estudiantes." : "Despublicado: ya no aparece para los estudiantes." };
}

const missionSchema = z.object({
  title: text(3, 120, "Título de la lección"),
  intro: optText(400, "Introducción"),
  xpReward: z.coerce.number().int().min(0).max(1000),
  isBoss: z.boolean(),
  period: z.coerce.number().int().min(1).max(4).nullable(),
  moduleId: z.string().regex(/^[\w-]{1,64}$/).nullable(),
  lessonKind: z.enum(["reto", "explicacion"]),
  body: z.string().trim().max(MAX_BODY, `La explicación puede tener máximo ${MAX_BODY} caracteres.`),
  videoUrl: z.string().trim().nullable().refine((v) => v === null || videoEmbedUrl(v) !== null, "El video debe ser un enlace de YouTube o Vimeo."),
}).superRefine((m, ctx) => {
  if (m.lessonKind === "explicacion" && m.body.length < 20) ctx.addIssue({ code: "custom", message: "Escribe la explicación (al menos 20 caracteres)." });
  if (m.lessonKind === "explicacion" && m.isBoss) ctx.addIssue({ code: "custom", message: "Una explicación no puede ser el reto del Guardián." });
});

function readMission(fd: FormData) {
  return missionSchema.safeParse({
    title: fd.get("title") ?? "", intro: fd.get("intro") ?? "", xpReward: fd.get("xpReward") ?? 50,
    isBoss: fd.get("isBoss") === "on", period: blankToNull(fd.get("period")), moduleId: blankToNull(fd.get("moduleId")),
    lessonKind: fd.get("lessonKind") === "explicacion" ? "explicacion" : "reto",
    body: fd.get("body") ?? "", videoUrl: blankToNull(fd.get("videoUrl")),
  });
}

// ===== Módulos (cursos cortos) =====
const moduleSchema = z.object({
  title: text(2, 80, "Título del módulo"),
  summary: optText(400, "Descripción del módulo"),
  guardian: z.enum(GUARDIANS.map((g) => g.slug) as [string, ...string[]], { message: "Elige el Guardián del módulo." }),
});

export async function saveModuleAction(slug: string, moduleId: string | null, _prev: EditorState, fd: FormData): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  const parsed = moduleSchema.safeParse({ title: fd.get("title") ?? "", summary: fd.get("summary") ?? "", guardian: fd.get("guardian") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el módulo." };
  const input: ModuleInput = parsed.data;
  try {
    if (moduleId) await getRepo().updateModule(moduleId, input);
    else await getRepo().createModule(slug, input);
  } catch {
    return { error: "No pudimos guardar el módulo." };
  }
  refresh(slug);
  return { message: moduleId ? "Módulo guardado." : "Módulo creado." };
}

export async function deleteModuleAction(slug: string, moduleId: string): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  try {
    await getRepo().deleteModule(moduleId);
  } catch (e) {
    if (e instanceof Error && e.message.includes("modulo_con_lecciones")) return { error: "Primero borra o mueve sus lecciones a otro módulo." };
    return { error: "No pudimos borrar el módulo." };
  }
  refresh(slug);
  return { message: "Módulo borrado." };
}

export async function moveModuleAction(slug: string, moduleId: string, direction: -1 | 1): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  await getRepo().moveModule(moduleId, direction === -1 ? -1 : 1);
  refresh(slug);
  return {};
}

/** «Ofrecer gratis»: el curso completo queda abierto para todos. */
export async function setFreeAction(slug: string, free: boolean): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  await getRepo().setCourseFree(slug, free);
  refresh(slug);
  revalidatePath("/", "layout");
  return { message: free ? "Ahora es gratis: cualquier estudiante puede hacerlo completo." : "Ya no es gratis: después del primer reto se pide acceso." };
}

export async function saveMissionAction(slug: string, missionId: string | null, _prev: EditorState, fd: FormData): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  const parsed = readMission(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const input: MissionInput = parsed.data;
  try {
    if (missionId) await getRepo().updateMission(missionId, input);
    else await getRepo().createMission(slug, input);
  } catch {
    return { error: "No pudimos guardar la lección." };
  }
  refresh(slug);
  return { message: missionId ? "Lección guardada." : "Lección creada." };
}

export async function deleteMissionAction(slug: string, missionId: string): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  try {
    await getRepo().deleteMission(missionId);
  } catch (e) {
    if (e instanceof Error && e.message.includes("tiene_avance")) return { error: "Esta lección ya tiene avance de estudiantes: no se puede borrar." };
    return { error: "No pudimos borrar la lección." };
  }
  refresh(slug);
  return { message: "Lección borrada." };
}

export async function moveMissionAction(slug: string, missionId: string, direction: -1 | 1): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  await getRepo().moveMission(missionId, direction === -1 ? -1 : 1);
  refresh(slug);
  return {};
}

const questionSchema = z.object({
  prompt: text(5, 400, "Pregunta"),
  hint: optText(200, "Pista"),
  explanation: optText(500, "Explicación"),
});
const field = (fd: FormData, k: string) => String(fd.get(k) ?? "").slice(0, 200);
const lines = (fd: FormData, k: string) => String(fd.get(k) ?? "").split(/\r?\n/).map((x) => x.slice(0, 200));

export async function saveQuestionAction(slug: string, missionId: string, questionId: string | null, _prev: EditorState, fd: FormData): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  const parsed = questionSchema.safeParse({ prompt: fd.get("prompt") ?? "", hint: fd.get("hint") ?? "", explanation: fd.get("explanation") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa la pregunta." };
  // Cada tipo de actividad llega en sus propios campos; normalizeActivity valida y deja todo listo para guardar.
  const kind = asKind(fd.get("kind"));
  const idx = [0, 1, 2, 3, 4, 5];
  const options = kind === "completar" ? lines(fd, "answers") : kind === "ordenar" ? lines(fd, "steps")
    : kind === "relacionar" ? idx.map((i) => field(fd, `left${i}`)) : idx.map((i) => field(fd, `option${i}`));
  const right = kind === "relacionar" ? idx.map((i) => field(fd, `right${i}`)) : [];
  const correct = fd.get("correct");
  const activity = normalizeActivity({ kind, options, right, correctIndex: correct === null || correct === "" ? -1 : Number(correct) });
  if ("error" in activity) return { error: activity.error };
  const input: QuestionInput = { ...parsed.data, kind, ...activity };
  try {
    if (questionId) await getRepo().updateQuestion(questionId, input);
    else await getRepo().createQuestion(missionId, input);
  } catch {
    return { error: "No pudimos guardar la pregunta." };
  }
  refresh(slug);
  return { message: questionId ? "Actividad guardada." : "Actividad agregada." };
}

export async function deleteQuestionAction(slug: string, questionId: string): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  await getRepo().deleteQuestion(questionId);
  refresh(slug);
  return { message: "Actividad borrada." };
}

export async function moveQuestionAction(slug: string, questionId: string, direction: -1 | 1): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  await getRepo().moveQuestion(questionId, direction === -1 ? -1 : 1);
  refresh(slug);
  return {};
}
