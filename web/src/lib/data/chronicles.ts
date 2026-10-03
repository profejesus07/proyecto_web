import "server-only";
import { CHAPTERS, isUnlocked, missionKey, type Chapter } from "@/content/cronicas";
import type { Profile } from "./types";
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
  const completed = new Set(courses.flatMap((c) => c.missions.filter((m) => m.state === "completada").map((m) => missionKey(c.slug, m.position))));
  const view = (ch: Chapter): ChapterView => ({ chapter: ch, unlocked: isUnlocked(ch, completed), read: viewer.chroniclesRead.includes(ch.id) });
  const shelves: ChronicleShelf[] = [{ course: null, chapters: CHAPTERS.filter((c) => c.course === null).map(view) }];
  for (const c of courses) {
    const chapters = CHAPTERS.filter((ch) => ch.course === c.slug).map(view);
    if (chapters.length) shelves.push({ course: { slug: c.slug, title: c.title, guardian: c.guardian, element: c.element }, chapters });
  }
  return shelves;
}

export function unreadCount(shelves: ChronicleShelf[]): number {
  return shelves.reduce((n, s) => n + s.chapters.filter((c) => c.unlocked && !c.read).length, 0);
}
