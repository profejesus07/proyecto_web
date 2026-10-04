import "server-only";
import { getRepo } from "@/lib/data";
import type { Course, CourseDetail, MissionSummary, ProgressRow } from "@/lib/data/types";

export type MissionState = "bloqueada" | "disponible" | "completada";

export interface MissionView extends MissionSummary {
  state: MissionState;
  /** Por qué está bloqueada: falta la misión anterior o falta suscribirse al curso. */
  lock: "orden" | "suscripcion" | null;
  bestScore: number | null;
  attempts: number;
}

export interface CourseView extends CourseDetail {
  missions: MissionView[];
  done: number;
  total: number;
  status: "nuevo" | "en-curso" | "completado";
  bossDefeated: boolean;
  /** primera misión pendiente que se puede jugar (o null) */
  next: MissionView | null;
  /** Tiene el curso completo (suscripción, docente o admin). Sin acceso, solo la primera lección. */
  hasAccess: boolean;
  /** Sin acceso y ya terminó la lección gratis: lo siguiente es suscribirse. */
  needsSubscription: boolean;
}

/**
 * Calcula, para cada misión, si está bloqueada, disponible o completada.
 * Misma regla que public.mission_is_locked: en orden dentro del curso; la primera lección es gratis
 * y las demás necesitan acceso al curso.
 */
export function buildCourseView(course: CourseDetail, progress: ProgressRow[], bosses: string[], hasAccess: boolean): CourseView {
  const byMission = new Map(progress.map((p) => [p.missionId, p]));
  let prevDone = true;
  const missions: MissionView[] = [...course.missions]
    .sort((a, b) => a.position - b.position)
    .map((m) => {
      const p = byMission.get(m.id);
      const completed = !!p?.completed;
      const paywalled = m.position > 1 && !hasAccess;
      const state: MissionState = completed ? "completada" : prevDone && !paywalled ? "disponible" : "bloqueada";
      const lock = state !== "bloqueada" ? null : paywalled ? "suscripcion" : "orden";
      prevDone = prevDone && completed;
      return { ...m, state, lock, bestScore: p ? p.bestScore : null, attempts: p?.attempts ?? 0 };
    });
  const done = missions.filter((m) => m.state === "completada").length;
  const next = missions.find((m) => m.state === "disponible") ?? null;
  return {
    ...course,
    missions,
    done,
    total: missions.length,
    status: done === 0 ? "nuevo" : done === missions.length ? "completado" : "en-curso",
    bossDefeated: bosses.includes(course.slug),
    next,
    hasAccess,
    needsSubscription: !hasAccess && !next && done < missions.length,
  };
}

export async function loadCourseViews(userId: string): Promise<CourseView[]> {
  const repo = getRepo();
  const [courses, progress, bosses, access] = await Promise.all([repo.listCourses(), repo.getProgress(userId), repo.getBossDefeats(userId), repo.getCourseAccess(userId)]);
  const details = await Promise.all(courses.map((c: Course) => repo.getCourse(c.slug)));
  return details
    .filter((d): d is CourseDetail => d !== null)
    .sort((a, b) => a.position - b.position)
    .map((d) => buildCourseView(d, progress, bosses, access.has(d.slug)));
}

export async function loadCourseView(userId: string, slug: string): Promise<CourseView | null> {
  return (await loadCourseViews(userId)).find((c) => c.slug === slug) ?? null;
}

export function formatPrice(price: number | null): string {
  return price === null ? "Precio por definir" : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(price);
}
