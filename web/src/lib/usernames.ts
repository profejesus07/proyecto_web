import { z } from "zod";

/**
 * Cuentas con nombre de usuario (las crea el administrador en la carga de estudiantes).
 *
 * Las cuentas necesitan un correo para iniciar sesión. Cuando el administrador da un nombre de
 * usuario en lugar de un correo, la cuenta se crea con un correo interno en el dominio reservado
 * «.invalid» (RFC 2606): nunca existe ni recibe mensajes. El estudiante entra escribiendo solo su
 * usuario; para recuperar la contraseña la pide al administrador.
 */
export const USERNAME_DOMAIN = "usuarios.umbral.invalid";
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/;

/** «luna.perez» → «luna.perez@usuarios.umbral.invalid»; un correo se deja igual. null si no es válido. */
export function loginEmail(input: string): string | null {
  const v = input.trim().toLowerCase();
  if (v.includes("@")) return z.email().safeParse(v).success ? v : null;
  return USERNAME_PATTERN.test(v) ? `${v}@${USERNAME_DOMAIN}` : null;
}

/** Lo que la persona escribe para entrar: el usuario si la cuenta es de usuario, si no el correo. */
export function loginLabel(email: string): string {
  return email.endsWith(`@${USERNAME_DOMAIN}`) ? email.slice(0, -USERNAME_DOMAIN.length - 1) : email;
}

export const isUsernameAccount = (email: string) => email.endsWith(`@${USERNAME_DOMAIN}`);
