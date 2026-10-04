import type { Module, MissionSummary } from "@/lib/data/types";

/** El tramo de historia al que pertenece una lección: su módulo (o el curso entero si no tiene módulos). */
export interface Segment {
  module: Module | null;
  /** Guardián del módulo (o del curso). */
  guardian: string;
  /** Posición de la lección dentro del tramo (desde 1). */
  position: number;
  /** Lecciones del tramo. */
  total: number;
  /** Es la última lección del curso. */
  courseEnd: boolean;
}

interface CourseLike { guardian: string; modules: Module[]; missions: Pick<MissionSummary, "id" | "position" | "moduleId">[] }

export function segmentOf(course: CourseLike, missionId: string): Segment | null {
  const m = course.missions.find((x) => x.id === missionId);
  if (!m) return null;
  const mod = m.moduleId ? course.modules.find((x) => x.id === m.moduleId) ?? null : null;
  const peers = course.missions.filter((x) => (mod ? x.moduleId === mod.id : true)).sort((a, b) => a.position - b.position);
  const last = Math.max(...course.missions.map((x) => x.position));
  return { module: mod, guardian: mod?.guardian ?? course.guardian, position: peers.findIndex((x) => x.id === m.id) + 1, total: peers.length, courseEnd: m.position === last };
}

/** Lecciones agrupadas por módulo, en orden. Un curso sin módulos da un solo grupo con module = null. */
export function groupByModule<M extends Pick<MissionSummary, "moduleId" | "position">>(modules: Module[], missions: M[]): { module: Module | null; missions: M[] }[] {
  const sorted = [...missions].sort((a, b) => a.position - b.position);
  if (!modules.length) return [{ module: null, missions: sorted }];
  const groups = [...modules].sort((a, b) => a.position - b.position).map((module) => ({ module: module as Module | null, missions: sorted.filter((m) => m.moduleId === module.id) }));
  const loose = sorted.filter((m) => !m.moduleId || !modules.some((x) => x.id === m.moduleId));
  return loose.length ? [...groups, { module: null, missions: loose }] : groups;
}
