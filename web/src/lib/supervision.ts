import { daysAgo } from "@/lib/activity";
import type { ClassStudent, ClassSummary, CourseDetail, MissionSummary, Repo } from "@/lib/data/types";

/**
 * Supervisión de estudiantes (panel docente y consola): estadísticas de avance calculadas a
 * partir del informe de cada grupo. Un estudiante «necesita apoyo» si lleva una semana o más
 * sin entrar, o si tiene misiones intentadas que aún no supera.
 */
export interface StudentStat {
  student: ClassStudent;
  inactiveDays: number | null;
  /** Misiones superadas / total de misiones del grupo. */
  done: number;
  total: number;
  pct: number;
  /** Promedio de la mejor nota en las misiones intentadas (null = ninguna). */
  avgScore: number | null;
  attempts: number;
  /** Intentadas sin superar. */
  pending: number;
  bosses: number;
  needsSupport: boolean;
  /** Por qué necesita apoyo, en una frase corta. */
  reason: string | null;
}

export function studentStat(s: ClassStudent, missions: MissionSummary[]): StudentStat {
  const ids = new Set(missions.map((m) => m.id));
  const bossIds = new Set(missions.filter((m) => m.isBoss).map((m) => m.id));
  const rows = s.progress.filter((p) => ids.has(p.missionId));
  const done = rows.filter((p) => p.completed).length;
  const pending = rows.filter((p) => !p.completed).length;
  const inactiveDays = daysAgo(s.lastActive);
  const away = inactiveDays === null || inactiveDays >= 7;
  const reason = away
    ? (inactiveDays === null ? (rows.length ? "Sin actividad reciente" : "Aún no empieza") : `Sin actividad hace ${inactiveDays} días`)
    : pending ? `${pending} ${pending === 1 ? "misión intentada sin superar" : "misiones intentadas sin superar"}` : null;
  return {
    student: s, inactiveDays, done, total: missions.length,
    pct: missions.length ? Math.round((done / missions.length) * 100) : 0,
    avgScore: rows.length ? Math.round(rows.reduce((n, p) => n + p.bestScore, 0) / rows.length) : null,
    attempts: rows.reduce((n, p) => n + p.attempts, 0),
    pending,
    bosses: rows.filter((p) => p.completed && bossIds.has(p.missionId)).length,
    needsSupport: reason !== null,
    reason,
  };
}

export interface GroupOverview {
  group: ClassSummary;
  courses: CourseDetail[];
  missions: MissionSummary[];
  stats: StudentStat[];
  activeWeek: number;
  avgPct: number;
  needSupport: number;
}

/** Todos los cursos publicados, con sus misiones (para los grupos de solo seguimiento). */
export async function publishedCourses(repo: Repo): Promise<CourseDetail[]> {
  return (await Promise.all((await repo.listCourses()).map((c) => repo.getCourse(c.slug)))).filter((c): c is CourseDetail => !!c);
}

/** Cursos que cuenta un grupo: su clase, si está ligado a una; si no, todos los publicados. */
export function groupCourses(group: Pick<ClassSummary, "courseSlug">, all: CourseDetail[]): CourseDetail[] {
  return group.courseSlug ? all.filter((c) => c.slug === group.courseSlug) : all;
}

export function overview(group: ClassSummary, students: ClassStudent[], all: CourseDetail[]): GroupOverview {
  const courses = groupCourses(group, all);
  const missions = courses.flatMap((c) => c.missions);
  const stats = students.map((s) => studentStat(s, missions));
  return {
    group, courses, missions, stats,
    activeWeek: stats.filter((s) => s.inactiveDays !== null && s.inactiveDays < 7).length,
    avgPct: stats.length ? Math.round(stats.reduce((n, s) => n + s.pct, 0) / stats.length) : 0,
    needSupport: stats.filter((s) => s.needsSupport).length,
  };
}
