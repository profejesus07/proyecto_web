import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { getRepo } from "@/lib/data";
import { cookies } from "next/headers";
import { PREVIEW_TEACHER_ID, PREVIEW_USER_ID } from "@/lib/data/memory-repo";
import type { Profile } from "@/lib/data/types";
import { hasSupabase, isPreview, isPreviewAnon } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Persona con sesión iniciada (o null). Valida el token con Supabase en cada petición. */
export const getViewer = cache(async (): Promise<Profile | null> => {
  // Todo lo que depende de quién mira se renderiza en cada petición, nunca se guarda en caché.
  await connection();
  if (isPreviewAnon()) return null;
  if (isPreview()) {
    // Solo en la vista previa local: la cookie «umbral-vista=docente» entra como el docente de prueba.
    const asTeacher = (await cookies()).get("umbral-vista")?.value === "docente";
    return getRepo().getProfile(asTeacher ? PREVIEW_TEACHER_ID : PREVIEW_USER_ID);
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

/** Páginas del Maestro del Gremio: solo para cuentas de docente. */
export async function requireTeacher(next: string): Promise<Profile> {
  const viewer = await requireViewer(next);
  if (viewer.role !== "docente") redirect("/gremio");
  return viewer;
}
