import "server-only";
import { randomInt } from "node:crypto";

/** Contraseña temporal legible: cumple las reglas (letras y números) y evita caracteres que se confunden. */
export function tempPassword(): string {
  const letters = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const pick = (set: string, n: number) => Array.from({ length: n }, () => set[randomInt(set.length)]).join("");
  return `${pick(letters, 4)}-${pick(digits, 4)}-${pick(letters, 4)}`;
}
