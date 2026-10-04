import "server-only";
import { CHAPTERS, isUnlocked, stagesReached, type Chapter } from "@/content/cronicas";
import type { Profile } from "./types";
import { groupByModule } from "@/lib/modules";
import { loadCourseViews, type CourseView } from "./queries";

export interface ChapterView {
  chapter: Chapter;
  unlocked: boolean;
  read: boolean;
}

export interface ChronicleShelf {
  /** null = historia general del Gremio */
  course: Pick<CourseView, "slug" | "title" | "guardian" | "element"> | null;
  chapters: ChapterView[];
}

/** Arma el Archivo para un estudiante: qué capítulos tiene abiertos y cuáles ya leyó. */
export async function loadChronicles(viewer: Profile): Promise<ChronicleShelf[]> {
  const courses = await loadCourseViews(viewer.id);
  // Hitos alcanzados en cualquier portal (varios cursos pueden compartir Guardián).
  // Con módulos, cada módulo es un tramo de la historia con su propio Guardián.
  const reached = new Set(courses.flatMap((c) => groupByModule(c.modules, c.missions).flatMap(({ module, missions }) =>
    stagesReached(module?.guardian ?? c.guardian, missions.map((m, i) => (m.state === "completada" ? i + 1 : 0)).filter(Boolean), missions.length))));
  const view = (ch: Chapter): ChapterView => ({ chapter: ch, unlocked: isUnlocked(ch, reached), read: viewer.chroniclesRead.includes(ch.id) });
  const shelves: ChronicleShelf[] = [{ course: null, chapters: CHAPTERS.filter((c) => c.guardian === null).map(view) }];
  // Un estante por Guardián que tenga portal (el primero de sus cursos le da el título).
  const seen = new Set<string>();
  for (const c of courses) {
    const guardians = c.modules.length ? c.modules.map((m) => ({ guardian: m.guardian, title: c.modules.length > 1 ? `${c.title} · ${m.title}` : c.title })) : [{ guardian: c.guardian, title: c.title }];
    for (const { guardian, title } of guardians) {
      if (seen.has(guardian)) continue;
      seen.add(guardian);
      const chapters = CHAPTERS.filter((ch) => ch.guardian === guardian).map(view);
      if (chapters.length) shelves.push({ course: { slug: c.slug, title, guardian, element: c.element }, chapters });
    }
  }
  return shelves;
}

export function unreadCount(shelves: ChronicleShelf[]): number {
  return shelves.reduce((n, s) => n + s.chapters.filter((c) => c.unlocked && !c.read).length, 0);
}
