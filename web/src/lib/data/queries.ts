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
  /** primera misión pendiente (o null si el portal está completo) */
  next: MissionView | null;
}

/** Calcula, para cada misión, si está bloqueada, disponible o completada (se desbloquean en orden). */
export function buildCourseView(course: CourseDetail, progress: ProgressRow[], bosses: string[]): CourseView {
  const byMission = new Map(progress.map((p) => [p.missionId, p]));
  let prevDone = true;
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
  };
}

export async function loadCourseViews(userId: string): Promise<CourseView[]> {
  const repo = getRepo();
  const [courses, progress, bosses] = await Promise.all([repo.listCourses(), repo.getProgress(userId), repo.getBossDefeats(userId)]);
  const details = await Promise.all(courses.map((c: Course) => repo.getCourse(c.slug)));
  return details.filter((d): d is CourseDetail => d !== null).map((d) => buildCourseView(d, progress, bosses));
}

export async function loadCourseView(userId: string, slug: string): Promise<CourseView | null> {
  const repo = getRepo();
  const [course, progress, bosses] = await Promise.all([repo.getCourse(slug), repo.getProgress(userId), repo.getBossDefeats(userId)]);
  return course ? buildCourseView(course, progress, bosses) : null;
}
