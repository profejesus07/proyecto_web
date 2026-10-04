"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import type { ClassAction } from "@/lib/data/types";
import { isStaff } from "@/lib/roles";

export type ClassFormState = { error?: string; message?: string } | undefined;

const MESSAGES: Record<string, string> = {
  solo_docentes: "Solo las cuentas de docente pueden crear clases.",
  solo_estudiantes: "Solo las cuentas de estudiante pueden unirse a una clase.",
  nombre_invalido: "El nombre de la clase debe tener entre 2 y 60 caracteres.",
  demasiadas_clases: "Llegaste al máximo de clases.",
  codigo_invalido: "Ese código no existe o la clase ya no está activa. Revísalo con tu docente.",
  clase_llena: "Esa clase ya está llena. Habla con tu docente.",
  clase_no_encontrada: "No encontramos esa clase.",
};

function friendly(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : "";
  for (const [k, v] of Object.entries(MESSAGES)) if (msg.includes(k)) return v;
  return fallback;
}

export async function createClassAction(_prev: ClassFormState, formData: FormData): Promise<ClassFormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Tu sesión terminó. Vuelve a ingresar." };
  if (!isStaff(viewer.role)) return { error: MESSAGES.solo_docentes };
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 60) return { error: MESSAGES.nombre_invalido };
  let id: string;
  try {
    id = (await getRepo().createClass(viewer.id, name)).id;
  } catch (e) {
    return { error: friendly(e, "No pudimos crear la clase. Inténtalo de nuevo.") };
  }
  revalidatePath("/maestro");
  redirect(`/maestro/${id}`);
}

export async function manageClassAction(classId: string, action: ClassAction, arg?: string): Promise<{ ok: boolean; error?: string }> {
  const viewer = await getViewer();
  if (!viewer || !isStaff(viewer.role)) return { ok: false, error: MESSAGES.solo_docentes };
  if (typeof classId !== "string" || !["nuevo_codigo", "renombrar", "archivar", "quitar"].includes(action)) return { ok: false, error: "Acción no válida." };
  try {
    await getRepo().manageClass(viewer.id, classId, action, typeof arg === "string" ? arg : undefined);
    // Al retirar a un estudiante, pierde el acceso a la clase que le dio el código del grupo.
    if (action === "quitar" && typeof arg === "string") await getRepo().revokeClassAccess(arg, classId);
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos guardar el cambio. Inténtalo de nuevo.") };
  }
  revalidatePath("/maestro", "layout");
  return { ok: true };
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
