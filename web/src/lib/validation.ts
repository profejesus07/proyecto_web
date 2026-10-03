import { z } from "zod";

export const displayName = z
  .string()
  .trim()
  .min(2, "Tu nombre de aventurero necesita al menos 2 letras.")
  .max(24, "Tu nombre de aventurero puede tener hasta 24 letras.")
  .regex(/^[\p{L}\p{N}][\p{L}\p{N} ._'-]*$/u, "Usa solo letras, números, espacios y . _ ' -");

export const registerSchema = z.object({
  displayName,
  email: z.string().trim().toLowerCase().pipe(z.email("Escribe un correo válido.")),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres.").max(72, "La contraseña es demasiado larga."),
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
  answers: z.array(z.number().int().min(-1).max(9)).min(1).max(50),
});

/** Solo permite volver a rutas internas (evita redirecciones abiertas). */
export function safeNext(value: unknown): string {
  if (typeof value !== "string") return "/gremio";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/gremio";
  return value;
}
