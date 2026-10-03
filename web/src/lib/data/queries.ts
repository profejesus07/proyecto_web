import "server-only";
import { getRepo } from "@/lib/data";
import type { Course, CourseDetail, MissionSummary, ProgressRow } from "@/lib/data/types";

export type MissionState = "bloqueada" | "disponible" | "completada";

export interface MissionView extends MissionSummary {
  state: MissionState;
  bestScore: number | null;
  attempts: number;
}

export interface CourseView extends CourseDetail {
  missions: MissionView[];
  done: number;
  total: number;
  status: "nuevo" | "en-curso" | "completado";
  bossDefeated: boolean;
  /** primera misión pendiente (o null si el portal está completo o cerrado) */
  next: MissionView | null;
  /** El portal sigue cerrado hasta terminar el portal anterior. */
  locked: boolean;
  /** Portal que hay que terminar primero (si está cerrado). */
  lockedBy: { slug: string; title: string; guardian: string } | null;
}

/**
 * Calcula, para cada misión, si está bloqueada, disponible o completada (se desbloquean en orden).
 * Si el portal está cerrado (lockedBy), todas sus misiones quedan bloqueadas.
 */
export function buildCourseView(
  course: CourseDetail, progress: ProgressRow[], bosses: string[], lockedBy: CourseView["lockedBy"] = null,
): CourseView {
  const byMission = new Map(progress.map((p) => [p.missionId, p]));
  let prevDone = !lockedBy;
  const missions: MissionView[] = [...course.missions]
    .sort((a, b) => a.position - b.position)
    .map((m) => {
      const p = byMission.get(m.id);
      const completed = !!p?.completed;
      const state: MissionState = completed ? "completada" : prevDone ? "disponible" : "bloqueada";
      prevDone = prevDone && completed;
      return { ...m, state, bestScore: p ? p.bestScore : null, attempts: p?.attempts ?? 0 };
    });
  const done = missions.filter((m) => m.state === "completada").length;
  return {
    ...course,
    missions,
    done,
    total: missions.length,
    status: done === 0 ? "nuevo" : done === missions.length ? "completado" : "en-curso",
    bossDefeated: bosses.includes(course.slug),
    next: missions.find((m) => m.state === "disponible") ?? null,
    locked: !!lockedBy,
    lockedBy,
  };
}

/**
 * Arma todos los portales en orden. Un portal se abre cuando están terminados todos los anteriores
 * (misma regla que public.mission_is_locked en la base de datos).
 */
export function buildCourseViews(courses: CourseDetail[], progress: ProgressRow[], bosses: string[]): CourseView[] {
  const sorted = [...courses].sort((a, b) => a.position - b.position);
  const views: CourseView[] = [];
  for (const c of sorted) {
    const blocker = views.find((v) => v.position < c.position && v.status !== "completado");
    views.push(buildCourseView(c, progress, bosses, blocker ? { slug: blocker.slug, title: blocker.title, guardian: blocker.guardian } : null));
  }
  return views;
}

export async function loadCourseViews(userId: string): Promise<CourseView[]> {
  const repo = getRepo();
  const [courses, progress, bosses] = await Promise.all([repo.listCourses(), repo.getProgress(userId), repo.getBossDefeats(userId)]);
  const details = await Promise.all(courses.map((c: Course) => repo.getCourse(c.slug)));
  return buildCourseViews(details.filter((d): d is CourseDetail => d !== null), progress, bosses);
}

export async function loadCourseView(userId: string, slug: string): Promise<CourseView | null> {
  return (await loadCourseViews(userId)).find((c) => c.slug === slug) ?? null;
}
