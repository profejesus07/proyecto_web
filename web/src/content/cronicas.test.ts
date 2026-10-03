import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import intento from "./portal-del-primer-intento.json";
import primer from "./primer-portal.json";
import { CHAPTERS, chaptersUnlockedBy, isUnlocked, missionKey } from "./cronicas";

const seeds = [primer, intento];
const pub = (src: string) => path.resolve(import.meta.dirname, "../../public", src.replace(/^\//, ""));

describe("Crónicas", () => {
  it("los ids son únicos y cada capítulo tiene páginas", () => {
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(CHAPTERS.length);
    for (const c of CHAPTERS) expect(c.pages.length).toBeGreaterThan(2);
  });

  it("cada desbloqueo apunta a una misión que existe", () => {
    for (const c of CHAPTERS) {
      if (c.course) expect(seeds.some((s) => s.course.slug === c.course)).toBe(true);
      if (c.unlock.kind === "mision") {
        const { course, position } = c.unlock;
        const seed = seeds.find((s) => s.course.slug === course);
        expect(seed?.missions.some((m) => m.position === position), `${c.id} → ${course}:${position}`).toBe(true);
      }
    }
  });

  it("todas las ilustraciones existen", () => {
    for (const c of CHAPTERS) {
      expect(existsSync(pub(`/assets/escenarios/cronicas/cronicas-${c.scene}.svg`))).toBe(true);
      if (c.guest) expect(existsSync(pub(c.guest.src)), c.guest.src).toBe(true);
    }
  });

  it("se abren al avanzar", () => {
    const none = new Set<string>();
    expect(CHAPTERS.filter((c) => isUnlocked(c, none)).map((c) => c.id)).toEqual(["prologo", "petrox-1"]);
    const afterPetrox = new Set([1, 2, 3, 4].map((n) => missionKey("primer-portal", n)));
    expect(CHAPTERS.filter((c) => isUnlocked(c, afterPetrox)).map((c) => c.id)).toEqual(["prologo", "petrox-1", "petrox-2", "petrox-3", "ignaris-1"]);
    expect(chaptersUnlockedBy("primer-portal", 4).map((c) => c.id)).toEqual(["petrox-3", "ignaris-1"]);
  });
});
