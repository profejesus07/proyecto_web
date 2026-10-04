"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { FAMILY_MESSAGES } from "@/content/elenco";
import { getRepo } from "@/lib/data";

export type FamilyFormState = { error?: string; message?: string } | undefined;

const MESSAGES: Record<string, string> = {
  solo_familias: "Solo las cuentas de familia pueden vincularse a un estudiante.",
  solo_estudiantes: "Solo las cuentas de estudiante tienen código de familia.",
  codigo_invalido: "Ese código no existe o ya cambió. Pídele a tu hijo o hija que lo revise en su perfil.",
  demasiados_hijos: "Llegaste al máximo de 8 estudiantes vinculados.",
  demasiadas_familias: "Ese estudiante ya tiene 4 familias vinculadas. Puede quitar alguna desde su perfil.",
  no_autorizado: "No puedes hacer ese cambio.",
  no_vinculado: "Ya no estás vinculado con ese estudiante.",
  demasiados_mensajes: "Ya enviaste los 5 mensajes de hoy. ¡Mañana puedes enviar más!",
};

function friendly(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : "";
  for (const [k, v] of Object.entries(MESSAGES)) if (msg.includes(k)) return v;
  return fallback;
}

const normalize = (v: unknown) => String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/** La familia escribe el código que le dio el estudiante. */
export async function linkFamilyAction(_prev: FamilyFormState, formData: FormData): Promise<FamilyFormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Tu sesión terminó. Vuelve a ingresar." };
  if (viewer.role !== "familia") return { error: MESSAGES.solo_familias };
  const code = normalize(formData.get("code"));
  if (code.length !== 8) return { error: "El código tiene 8 caracteres (letras y números)." };
  try {
    const s = await getRepo().linkFamily(viewer.id, code);
    revalidatePath("/familia");
    return { message: `¡Listo! Ya acompañas a ${s.name}.` };
  } catch (e) {
    return { error: friendly(e, "No pudimos vincularte. Inténtalo de nuevo.") };
  }
}

/** Muestra (o renueva) el código de familia del estudiante. */
export async function familyCodeAction(renew: boolean): Promise<{ ok: boolean; code?: string; error?: string }> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "estudiante") return { ok: false, error: MESSAGES.solo_estudiantes };
  try {
    return { ok: true, code: await getRepo().familyCode(viewer.id, renew === true) };
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos crear el código. Inténtalo de nuevo.") };
  }
}

/** Desvincular: la familia quita a un estudiante, o el estudiante quita a una familia. */
export async function unlinkFamilyAction(otherId: string): Promise<{ ok: boolean; error?: string }> {
  const viewer = await getViewer();
  if (!viewer || typeof otherId !== "string") return { ok: false, error: MESSAGES.no_autorizado };
  const [familyId, studentId] = viewer.role === "familia" ? [viewer.id, otherId] : viewer.role === "estudiante" ? [otherId, viewer.id] : [null, null];
  if (!familyId || !studentId) return { ok: false, error: MESSAGES.no_autorizado };
  try {
    await getRepo().unlinkFamily(viewer.id, familyId, studentId);
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos guardar el cambio. Inténtalo de nuevo.") };
  }
  revalidatePath(viewer.role === "familia" ? "/familia" : "/perfil");
  return { ok: true };
}

/** La familia envía un mensaje de apoyo (una de las frases fijas). */
export async function sendFamilyMessageAction(studentId: string, message: string): Promise<{ ok: boolean; remaining?: number; error?: string }> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "familia") return { ok: false, error: MESSAGES.solo_familias };
  if (typeof studentId !== "string" || typeof message !== "string" || !FAMILY_MESSAGES[message]) return { ok: false, error: "Elige uno de los mensajes." };
  try {
    const r = await getRepo().sendFamilyMessage(viewer.id, studentId, message);
    revalidatePath("/familia");
    return { ok: true, remaining: r.remaining };
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos enviar el mensaje. Inténtalo de nuevo.") };
  }
}

/** El estudiante agradece y marca como leídos los mensajes de su familia. */
export async function readFamilyMessagesAction(): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "estudiante") return { ok: false };
  await getRepo().readFamilyMessages(viewer.id);
  revalidatePath("/gremio");
  return { ok: true };
}
