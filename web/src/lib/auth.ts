import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { getRepo } from "@/lib/data";
import { cookies } from "next/headers";
import { PREVIEW_ADMIN_ID, PREVIEW_FAMILY_ID, PREVIEW_TEACHER_ID, PREVIEW_USER_ID } from "@/lib/data/memory-repo";
import { homePath, isAdmin, isStaff } from "@/lib/roles";
import type { Profile } from "@/lib/data/types";
import { hasSupabase, isPreview, isPreviewAnon } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Persona con sesión iniciada (o null). Valida el token con Supabase en cada petición. */
export const getViewer = cache(async (): Promise<Profile | null> => {
  // Todo lo que depende de quién mira se renderiza en cada petición, nunca se guarda en caché.
  await connection();
  if (isPreviewAnon()) return null;
  if (isPreview()) {
    // Solo en la vista previa local: la cookie «umbral-vista» entra como el docente, el admin o la familia de prueba.
    const as = (await cookies()).get("umbral-vista")?.value;
    const id = as === "docente" ? PREVIEW_TEACHER_ID : as === "admin" ? PREVIEW_ADMIN_ID : as === "familia" ? PREVIEW_FAMILY_ID : PREVIEW_USER_ID;
    return getRepo().getProfile(id);
  }
  if (!hasSupabase()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return getRepo().getProfile(data.user.id);
});

export async function requireViewer(next?: string): Promise<Profile> {
  const viewer = await getViewer();
  if (!viewer) redirect(next ? `/ingresar?siguiente=${encodeURIComponent(next)}` : "/ingresar");
  return viewer;
}

/**
 * Páginas del juego (Gremio, portales, misiones, tienda, perfil…). Docentes y administración
 * no juegan: supervisan desde su panel o su consola, así que van allí.
 */
export async function requirePlayer(next: string): Promise<Profile> {
  const viewer = await requireViewer(next);
  if (isStaff(viewer.role)) redirect(homePath(viewer.role));
  return viewer;
}

/** Para las acciones del juego: la persona con sesión, salvo docentes y administración (null). */
export async function getPlayer(): Promise<Profile | null> {
  const viewer = await getViewer();
  return viewer && !isStaff(viewer.role) ? viewer : null;
}

/** Panel docente (supervisión de estudiantes): docentes y administrador. */
export async function requireTeacher(next: string): Promise<Profile> {
  const viewer = await requireViewer(next);
  if (!isStaff(viewer.role)) redirect(homePath(viewer.role));
  return viewer;
}

/** Panel de administración: solo el administrador. */
export async function requireAdmin(next: string): Promise<Profile> {
  const viewer = await requireViewer(next);
  if (!isAdmin(viewer.role)) redirect(homePath(viewer.role));
  return viewer;
}

/** Panel de familias: solo cuentas de familia. */
export async function requireFamily(next: string): Promise<Profile> {
  const viewer = await requireViewer(next);
  if (viewer.role !== "familia") redirect(homePath(viewer.role));
  return viewer;
}

/** Inicio de una persona según su rol (para después de ingresar o confirmar el correo). */
export async function homeForUser(userId: string): Promise<string> {
  const p = await getRepo().getProfile(userId);
  return p ? homePath(p.role) : "/gremio";
}
