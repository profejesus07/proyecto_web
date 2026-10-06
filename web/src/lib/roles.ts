import type { Role } from "@/lib/data/types";

/** Docente o administrador: supervisan, no juegan (no hacen cursos ni clases). */
export const isStaff = (role: Role) => role === "docente" || role === "admin";
export const isAdmin = (role: Role) => role === "admin";

/** Página de inicio de cada cuenta: la familia entra a «Mi familia», el docente a su panel y el administrador a su consola. */
export const homePath = (role: Role) => (role === "familia" ? "/familia" : role === "admin" ? "/admin" : role === "docente" ? "/maestro" : "/gremio");

export const ROLE_LABEL: Record<Role, string> = { estudiante: "Estudiante", familia: "Familia", docente: "Docente", admin: "Administrador" };

/** Un acceso a curso sigue vigente si no tiene vencimiento o vence en el futuro. */
export function isAccessActive(expiresAt: string | null): boolean {
  return expiresAt === null || new Date(expiresAt).getTime() > Date.now();
}
