"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GUARDIANS } from "@/content/guardians";
import { getViewer } from "@/lib/auth";
import { MAX_INFORMAL_HOURS, publishProblems, slugify } from "@/lib/content";
import { getRepo } from "@/lib/data";
import type { CourseInput, MissionInput, QuestionInput } from "@/lib/data/types";
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
  hours: z.coerce.number().int().min(1, "La intensidad debe ser de al menos 1 hora.").max(MAX_INFORMAL_HOURS, "Un curso de educación informal debe durar menos de 160 horas.").nullable(),
  trainerName: z.string().trim().min(3, "Nombre del formador: al menos 3 caracteres.").max(120).nullable(),
  trainerTitle: z.string().trim().min(3, "Título del formador: al menos 3 caracteres.").max(160).nullable(),
});

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
  const slug = slugify(title, randomBytes(3).toString("hex").slice(0, 4));
  const input: CourseInput = {
    kind, title, summary: "", element: kind === "clase" ? "luz" : "eter", guardian: "petrox",
    area: null, grade: null, schoolYear: kind === "clase" ? new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0) : null,
    accessUntil: null, hours: null, trainerName: null, trainerTitle: null,
  };
  try {
    await getRepo().createCourse(slug, input);
  } catch {
    return { error: "No pudimos crear el portal. Inténtalo de nuevo." };
  }
  refresh();
  redirect(`/admin/contenido/${slug}`);
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
    hours: v.kind === "curso" ? v.hours : null,
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
});

function readMission(fd: FormData) {
  return missionSchema.safeParse({
    title: fd.get("title") ?? "", intro: fd.get("intro") ?? "", xpReward: fd.get("xpReward") ?? 50,
    isBoss: fd.get("isBoss") === "on", period: blankToNull(fd.get("period")),
  });
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
  options: z.array(z.string().trim().min(1).max(200)).min(2, "Escribe al menos 2 opciones.").max(6, "Máximo 6 opciones."),
  correctIndex: z.coerce.number().int().min(0),
  hint: optText(200, "Pista"),
  explanation: optText(500, "Explicación"),
}).refine((q) => q.correctIndex < q.options.length, { message: "Marca cuál es la respuesta correcta." });

export async function saveQuestionAction(slug: string, missionId: string, questionId: string | null, _prev: EditorState, fd: FormData): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  // Las opciones vacías se ignoran; la correcta se recalcula sobre las que quedan.
  const raw = [0, 1, 2, 3, 4, 5].map((i) => String(fd.get(`option${i}`) ?? "").trim());
  const chosen = Number(fd.get("correct") ?? -1);
  const options = raw.filter((o) => o !== "");
  const correctIndex = raw[chosen] ? raw.slice(0, chosen).filter((o) => o !== "").length : -1;
  const parsed = questionSchema.safeParse({
    prompt: fd.get("prompt") ?? "", options, correctIndex: correctIndex < 0 ? 99 : correctIndex,
    hint: fd.get("hint") ?? "", explanation: fd.get("explanation") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa la pregunta." };
  const input: QuestionInput = parsed.data;
  try {
    if (questionId) await getRepo().updateQuestion(questionId, input);
    else await getRepo().createQuestion(missionId, input);
  } catch {
    return { error: "No pudimos guardar la pregunta." };
  }
  refresh(slug);
  return { message: questionId ? "Pregunta guardada." : "Pregunta agregada." };
}

export async function deleteQuestionAction(slug: string, questionId: string): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  await getRepo().deleteQuestion(questionId);
  refresh(slug);
  return { message: "Pregunta borrada." };
}

export async function moveQuestionAction(slug: string, questionId: string, direction: -1 | 1): Promise<EditorState> {
  if (!(await requireAdminId())) return { error: NOT_ADMIN };
  await getRepo().moveQuestion(questionId, direction === -1 ? -1 : 1);
  refresh(slug);
  return {};
}
