import type { Role } from "@/lib/data/types";

/** Puede acompañar estudiantes (clases, informes) y ve todos los cursos completos. */
export const isStaff = (role: Role) => role === "docente" || role === "admin";
export const isAdmin = (role: Role) => role === "admin";

/** Página de inicio de cada cuenta: la familia entra directo a «Mi familia». */
export const homePath = (role: Role) => (role === "familia" ? "/familia" : "/gremio");

export const ROLE_LABEL: Record<Role, string> = { estudiante: "Estudiante", familia: "Familia", docente: "Docente", admin: "Administrador" };

/** Un acceso a curso sigue vigente si no tiene vencimiento o vence en el futuro. */
export function isAccessActive(expiresAt: string | null): boolean {
  return expiresAt === null || new Date(expiresAt).getTime() > Date.now();
}
