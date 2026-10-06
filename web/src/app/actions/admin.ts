"use server";

import { revalidatePath } from "next/cache";
import { formatPrice } from "@/lib/data/queries";
import { getViewer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import type { Profile } from "@/lib/data/types";
import { tempPassword } from "@/lib/passwords";
import { isAdmin } from "@/lib/roles";
import { emailSchema } from "@/lib/validation";

// Cada acción comprueba aquí que quien llama es el administrador, y la base de datos lo vuelve a comprobar.

export type AdminFormState = { error?: string; message?: string; password?: string; email?: string; id?: string } | undefined;

const MESSAGES: Record<string, string> = {
  solo_admin: "Solo el administrador puede hacer esto.",
  rol_invalido: "Ese rol no existe.",
  no_permitido: "No se puede hacer este cambio en esa cuenta.",
  persona_no_encontrada: "No encontramos a esa persona.",
  curso_no_encontrado: "No encontramos ese curso.",
  precio_invalido: "El precio no es válido.",
  clase_no_encontrada: "No encontramos ese grupo.",
  no_a_ti_mismo: "No puedes eliminar tu propia cuenta.",
  no_admin: "Las cuentas de administrador no se eliminan desde el panel.",
  solo_docentes_de_prueba: "En la vista previa solo se pueden eliminar los docentes creados de prueba.",
};
function friendly(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : "";
  for (const [k, v] of Object.entries(MESSAGES)) if (msg.includes(k)) return v;
  return fallback;
}

async function admin(): Promise<Profile | null> {
  const viewer = await getViewer();
  return viewer && isAdmin(viewer.role) ? viewer : null;
}

export async function createTeacherAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const viewer = await admin();
  if (!viewer) return { error: MESSAGES.solo_admin };
  const name = String(formData.get("name") ?? "").trim();
  const email = emailSchema.safeParse(formData.get("email"));
  if (name.length < 2 || name.length > 24) return { error: "El nombre debe tener entre 2 y 24 caracteres." };
  if (!email.success) return { error: "Escribe un correo válido." };
  const password = tempPassword();
  try {
    await getRepo().createTeacherAccount(email.data, name, password);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/already|registered|exists/i.test(msg)) return { error: "Ese correo ya tiene cuenta. Búscalo en «Personas» y cámbiale el rol a Docente." };
    return { error: "No pudimos crear la cuenta. Inténtalo de nuevo." };
  }
  revalidatePath("/admin", "layout");
  return { message: `Cuenta de docente creada para ${name}.`, email: email.data, password };
}

export async function setRoleAction(userId: string, role: string): Promise<{ ok: boolean; error?: string }> {
  const viewer = await admin();
  if (!viewer) return { ok: false, error: MESSAGES.solo_admin };
  if (role !== "estudiante" && role !== "familia" && role !== "docente") return { ok: false, error: MESSAGES.rol_invalido };
  try {
    await getRepo().adminSetRole(viewer.id, userId, role);
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos cambiar el rol.") };
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Contraseña temporal nueva para un estudiante o una familia: se muestra una sola vez al administrador. */
export async function resetPasswordAction(userId: string): Promise<{ ok: boolean; password?: string; error?: string }> {
  const viewer = await admin();
  if (!viewer) return { ok: false, error: MESSAGES.solo_admin };
  if (typeof userId !== "string" || !userId) return { ok: false, error: MESSAGES.persona_no_encontrada };
  const password = tempPassword();
  try {
    await getRepo().adminSetPassword(viewer.id, userId, password);
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos cambiar la contraseña.") };
  }
  return { ok: true, password };
}

/** months: null = sin vencimiento; -1 = hasta el fin del año lectivo de la clase; 1..36 = meses. */
export async function grantAccessAction(userId: string, course: string, months: number | null): Promise<{ ok: boolean; error?: string }> {
  const viewer = await admin();
  if (!viewer) return { ok: false, error: MESSAGES.solo_admin };
  if (months !== null && months !== -1 && (!Number.isInteger(months) || months < 1 || months > 36)) return { ok: false, error: "Duración no válida." };
  let expires: string | null = null;
  if (months === -1) {
    const c = (await getRepo().listAllCourses()).find((x) => x.slug === course);
    if (!c?.accessUntil) return { ok: false, error: "Esa clase no tiene fecha de fin del año lectivo. Ponla en el editor de contenido." };
    expires = new Date(`${c.accessUntil}T23:59:59-05:00`).toISOString();
  } else if (months !== null) {
    expires = new Date(Date.now() + months * 30.44 * 86_400_000).toISOString();
  }
  try {
    await getRepo().adminGrantAccess(viewer.id, userId, course, expires);
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos activar el curso.") };
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function revokeAccessAction(userId: string, course: string): Promise<{ ok: boolean; error?: string }> {
  const viewer = await admin();
  if (!viewer) return { ok: false, error: MESSAGES.solo_admin };
  try {
    await getRepo().adminRevokeAccess(viewer.id, userId, course);
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos quitar el acceso.") };
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setPriceAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const viewer = await admin();
  if (!viewer) return { error: MESSAGES.solo_admin };
  const course = String(formData.get("course") ?? "");
  const raw = String(formData.get("price") ?? "").replace(/[^\d]/g, "");
  const price = raw === "" ? null : Number(raw);
  if (price !== null && (!Number.isSafeInteger(price) || price > 100_000_000)) return { error: MESSAGES.precio_invalido };
  // Precio y «gratis» se guardan juntos: un curso gratis no cobra aunque tenga precio guardado.
  const free = formData.get("free") === "on";
  try {
    await getRepo().adminSetPrice(viewer.id, course, price);
    await getRepo().setCourseFree(course, free);
  } catch (e) {
    return { error: friendly(e, "No pudimos guardar el precio.") };
  }
  revalidatePath("/", "layout");
  if (free) return { message: "Guardado: el curso es gratis para todos." };
  if (price === null) return { message: "Guardado sin precio: nadie podrá comprarlo hasta que le pongas uno." };
  return { message: `Guardado: se vende a ${formatPrice(price)}.` };
}

export async function createLinkedClassAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const viewer = await admin();
  if (!viewer) return { error: MESSAGES.solo_admin };
  const course = String(formData.get("course") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const teacher = String(formData.get("teacher") ?? "");
  if (name.length < 2 || name.length > 60) return { error: "El nombre del grupo debe tener entre 2 y 60 caracteres." };
  try {
    // Sin clase: grupo de seguimiento (el docente supervisa a los estudiantes que le asignes).
    const r = course ? await getRepo().adminCreateClass(viewer.id, course, name, teacher) : await getRepo().createClass(teacher, name);
    revalidatePath("/admin", "layout");
    revalidatePath("/maestro", "layout");
    return { message: `Grupo «${name}» creado. Código: ${r.code}`, id: r.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("curso_no_encontrado")) return { error: "Elige una clase (no un curso corto)." };
    if (msg.includes("solo_docentes")) return { error: "Elige un docente." };
    return { error: "No pudimos crear el grupo." };
  }
}

export async function assignTeacherAction(classId: string, teacherId: string): Promise<{ ok: boolean; error?: string }> {
  const viewer = await admin();
  if (!viewer) return { ok: false, error: MESSAGES.solo_admin };
  try {
    await getRepo().adminAssignTeacher(viewer.id, classId, teacherId);
  } catch {
    return { ok: false, error: "No pudimos cambiar el docente." };
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ===== Eliminar =====
// Siempre se pide escribir ELIMINAR. No se puede deshacer, pero los pagos quedan en una copia contable,
// las constancias expedidas siguen verificables y cada eliminación queda registrada.
export type DeleteResult = { ok: boolean; error?: string; message?: string };
const CONFIRM_WORD = "ELIMINAR";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const confirmed = (word: string) => word.trim().toUpperCase() === CONFIRM_WORD;

export async function deleteCourseAction(slug: string, word: string): Promise<DeleteResult> {
  const viewer = await admin();
  if (!viewer) return { ok: false, error: MESSAGES.solo_admin };
  if (!confirmed(word)) return { ok: false, error: `Escribe ${CONFIRM_WORD} para confirmar.` };
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return { ok: false, error: MESSAGES.curso_no_encontrado };
  try {
    const r = await getRepo().adminDeleteCourse(viewer.id, slug);
    revalidatePath("/", "layout");
    return { ok: true, message: `Se eliminó «${r.title}».` };
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos eliminar el curso.") };
  }
}

export async function deleteClassAction(classId: string, word: string): Promise<DeleteResult> {
  const viewer = await admin();
  if (!viewer) return { ok: false, error: MESSAGES.solo_admin };
  if (!confirmed(word)) return { ok: false, error: `Escribe ${CONFIRM_WORD} para confirmar.` };
  if (!UUID.test(classId) && !/^[\w-]{1,40}$/.test(classId)) return { ok: false, error: MESSAGES.clase_no_encontrada };
  try {
    const r = await getRepo().adminDeleteClass(viewer.id, classId);
    revalidatePath("/admin", "layout");
    return { ok: true, message: `Se eliminó el grupo «${r.name}».` };
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos eliminar el grupo.") };
  }
}

export async function deleteUserAction(userId: string, word: string): Promise<DeleteResult> {
  const viewer = await admin();
  if (!viewer) return { ok: false, error: MESSAGES.solo_admin };
  if (!confirmed(word)) return { ok: false, error: `Escribe ${CONFIRM_WORD} para confirmar.` };
  if (!UUID.test(userId)) return { ok: false, error: MESSAGES.persona_no_encontrada };
  if (userId === viewer.id) return { ok: false, error: MESSAGES.no_a_ti_mismo };
  try {
    const r = await getRepo().adminDeleteUser(viewer.id, userId);
    revalidatePath("/admin", "layout");
    return { ok: true, message: `Se eliminó la cuenta de ${r.name}.` };
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos eliminar la cuenta.") };
  }
}
