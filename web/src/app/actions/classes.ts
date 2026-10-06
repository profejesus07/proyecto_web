"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import type { ClassAction } from "@/lib/data/types";
import { isAdmin } from "@/lib/roles";

export type ClassFormState = { error?: string; message?: string } | undefined;

const MESSAGES: Record<string, string> = {
  solo_docentes: "Elige una cuenta de docente.",
  solo_admin: "Solo el administrador gestiona los grupos.",
  solo_estudiantes: "Solo las cuentas de estudiante pueden unirse a una clase.",
  nombre_invalido: "El nombre de la clase debe tener entre 2 y 60 caracteres.",
  demasiadas_clases: "Se llegó al máximo de grupos (30 por docente, 10 por estudiante).",
  codigo_invalido: "Ese código no existe o la clase ya no está activa. Revísalo con tu docente.",
  clase_llena: "Esa clase ya está llena. Habla con tu docente.",
  clase_no_encontrada: "No encontramos esa clase.",
};

function friendly(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : "";
  for (const [k, v] of Object.entries(MESSAGES)) if (msg.includes(k)) return v;
  return fallback;
}

/**
 * Gestión de un grupo (renombrar, nuevo código, archivar, retirar a un estudiante). Solo el
 * administrador: los docentes supervisan, no administran los grupos.
 */
export async function manageClassAction(classId: string, action: ClassAction, arg?: string): Promise<{ ok: boolean; error?: string }> {
  const viewer = await getViewer();
  if (!viewer || !isAdmin(viewer.role)) return { ok: false, error: MESSAGES.solo_admin };
  if (typeof classId !== "string" || !["nuevo_codigo", "renombrar", "archivar", "quitar"].includes(action)) return { ok: false, error: "Acción no válida." };
  const repo = getRepo();
  try {
    const group = (await repo.adminClasses(viewer.id)).find((c) => c.id === classId);
    if (!group) return { ok: false, error: MESSAGES.clase_no_encontrada };
    await repo.manageClass(group.teacherId, classId, action, typeof arg === "string" ? arg : undefined);
    // Al retirar a un estudiante, pierde el acceso a la clase que le dio el grupo.
    if (action === "quitar" && typeof arg === "string") await repo.revokeClassAccess(arg, classId);
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos guardar el cambio. Inténtalo de nuevo.") };
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/maestro", "layout");
  return { ok: true };
}

const ID = /^[A-Za-z0-9-]{1,64}$/;

/**
 * El administrador asigna estudiantes a un grupo (y así a su docente). Entran igual que con el
 * código del grupo: si el grupo está ligado a una clase, reciben su acceso anual.
 */
export async function assignStudentsAction(classId: string, studentIds: string[]): Promise<{ ok: boolean; added: number; error?: string }> {
  const viewer = await getViewer();
  if (!viewer || !isAdmin(viewer.role)) return { ok: false, added: 0, error: MESSAGES.solo_admin };
  if (typeof classId !== "string" || !Array.isArray(studentIds) || studentIds.length === 0 || studentIds.length > 100 || !studentIds.every((x) => typeof x === "string" && ID.test(x))) {
    return { ok: false, added: 0, error: "Elige al menos un estudiante." };
  }
  const repo = getRepo();
  const group = (await repo.adminClasses(viewer.id)).find((c) => c.id === classId);
  if (!group) return { ok: false, added: 0, error: MESSAGES.clase_no_encontrada };
  if (group.archived) return { ok: false, added: 0, error: "El grupo está archivado: no se pueden asignar estudiantes." };
  let added = 0;
  let error: string | undefined;
  for (const id of new Set(studentIds)) {
    try {
      await repo.joinClass(id, group.code);
      added++;
    } catch (e) {
      error = friendly(e, "No pudimos asignar a algunos estudiantes.");
    }
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/maestro", "layout");
  return { ok: added > 0, added, error };
}

export async function joinClassAction(_prev: ClassFormState, formData: FormData): Promise<ClassFormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Tu sesión terminó. Vuelve a ingresar." };
  const code = String(formData.get("code") ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 6) return { error: "El código tiene 6 caracteres (letras y números)." };
  try {
    const c = await getRepo().joinClass(viewer.id, code);
    revalidatePath("/perfil");
    revalidatePath("/portales", "layout");
    if (c.courseTitle) {
      const until = c.expiresAt ? ` hasta el ${new Date(new Date(c.expiresAt).getTime() - 1000).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" })}` : "";
      return { message: `¡Listo! Ya estás en «${c.name}» y tienes acceso a «${c.courseTitle}»${until}.` };
    }
    return { message: `¡Listo! Ya estás en la clase «${c.name}».` };
  } catch (e) {
    return { error: friendly(e, "No pudimos unirte a la clase. Inténtalo de nuevo.") };
  }
}

export async function leaveClassAction(classId: string): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer || typeof classId !== "string") return { ok: false };
  await getRepo().leaveClass(viewer.id, classId);
  await getRepo().revokeClassAccess(viewer.id, classId);
  revalidatePath("/perfil");
  revalidatePath("/portales", "layout");
  return { ok: true };
}
