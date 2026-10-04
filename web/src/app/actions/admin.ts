"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import type { Profile } from "@/lib/data/types";
import { isAdmin } from "@/lib/roles";
import { emailSchema } from "@/lib/validation";

// Cada acción comprueba aquí que quien llama es el administrador, y la base de datos lo vuelve a comprobar.

export type AdminFormState = { error?: string; message?: string; password?: string; email?: string } | undefined;

const MESSAGES: Record<string, string> = {
  solo_admin: "Solo el administrador puede hacer esto.",
  rol_invalido: "Ese rol no existe.",
  no_permitido: "No se puede cambiar el rol del administrador.",
  persona_no_encontrada: "No encontramos a esa persona.",
  curso_no_encontrado: "No encontramos ese curso.",
  precio_invalido: "El precio no es válido.",
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

/** Contraseña temporal legible: cumple las reglas (letras y números) y evita caracteres que se confunden. */
function tempPassword(): string {
  const letters = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const pick = (set: string, n: number) => Array.from({ length: n }, () => set[randomInt(set.length)]).join("");
  return `${pick(letters, 4)}-${pick(digits, 4)}-${pick(letters, 4)}`;
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
  revalidatePath("/admin");
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
  revalidatePath("/admin");
  return { ok: true };
}

export async function grantAccessAction(userId: string, course: string, months: number | null): Promise<{ ok: boolean; error?: string }> {
  const viewer = await admin();
  if (!viewer) return { ok: false, error: MESSAGES.solo_admin };
  if (months !== null && (!Number.isInteger(months) || months < 1 || months > 36)) return { ok: false, error: "Duración no válida." };
  const expires = months === null ? null : new Date(Date.now() + months * 30.44 * 86_400_000).toISOString();
  try {
    await getRepo().adminGrantAccess(viewer.id, userId, course, expires);
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos activar el curso.") };
  }
  revalidatePath("/admin");
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
  revalidatePath("/admin");
  return { ok: true };
}

export async function setPriceAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const viewer = await admin();
  if (!viewer) return { error: MESSAGES.solo_admin };
  const course = String(formData.get("course") ?? "");
  const raw = String(formData.get("price") ?? "").replace(/[^\d]/g, "");
  const price = raw === "" ? null : Number(raw);
  if (price !== null && (!Number.isSafeInteger(price) || price > 100_000_000)) return { error: MESSAGES.precio_invalido };
  try {
    await getRepo().adminSetPrice(viewer.id, course, price);
  } catch (e) {
    return { error: friendly(e, "No pudimos guardar el precio.") };
  }
  revalidatePath("/", "layout");
  return { message: "Precio guardado." };
}
