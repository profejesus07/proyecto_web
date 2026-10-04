import { z } from "zod";

export const displayName = z
  .string()
  .trim()
  .min(2, "Tu nombre de aventurero necesita al menos 2 letras.")
  .max(24, "Tu nombre de aventurero puede tener hasta 24 letras.")
  .regex(/^[\p{L}\p{N}][\p{L}\p{N} ._'-]*$/u, "Usa solo letras, números, espacios y . _ ' -");

/**
 * Reglas de la contraseña nueva. Coinciden con Supabase › Auth › «Letters and digits», mínimo 8.
 * Se comparten con el formulario para mostrarlas mientras se escribe.
 */
export const PASSWORD_RULES = [
  { id: "largo", label: "Al menos 8 caracteres", test: (v: string) => v.length >= 8 },
  { id: "letra", label: "Una letra (a-z)", test: (v: string) => /[A-Za-z]/.test(v) },
  { id: "numero", label: "Un número (0-9)", test: (v: string) => /[0-9]/.test(v) },
] as const;

export const newPassword = z
  .string()
  .min(8, "La contraseña necesita al menos 8 caracteres.")
  .max(72, "La contraseña es demasiado larga.")
  .regex(/[A-Za-z]/, "La contraseña necesita al menos una letra.")
  .regex(/[0-9]/, "La contraseña necesita al menos un número.");

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const newPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Las dos contraseñas no coinciden.", path: ["confirm"] });

export const registerSchema = z.object({
  displayName,
  email: z.string().trim().toLowerCase().pipe(z.email("Escribe un correo válido.")),
  password: newPassword,
  role: z.enum(["estudiante", "docente", "familia"], { error: "Elige quién eres." }),
  avatar: z.enum(["aria", "leo", "tomas", "nuri"]).default("aria"),
  consent: z.literal("on", { error: "Necesitamos tu confirmación para continuar." }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Escribe un correo válido.")),
  password: z.string().min(1, "Escribe tu contraseña."),
});

export const submitSchema = z.object({
  missionId: z.string().min(1).max(64),
});

export const answerSchema = z.object({
  missionId: z.string().min(1).max(64),
  index: z.number().int().min(0).max(49),
  choice: z.number().int().min(0).max(9),
});

/** Solo permite volver a rutas internas (evita redirecciones abiertas). */
export function safeNext(value: unknown): string {
  if (typeof value !== "string") return "/gremio";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/gremio";
  return value;
}
