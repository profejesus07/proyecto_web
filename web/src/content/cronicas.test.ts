import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GUARDIANS } from "./guardians";
import { CHAPTERS, chaptersUnlockedBy, isUnlocked, stageKey, stagesReached } from "./cronicas";

const pub = (src: string) => path.resolve(import.meta.dirname, "../../public", src.replace(/^\//, ""));

describe("Crónicas", () => {
  it("los ids son únicos y cada capítulo tiene páginas", () => {
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(CHAPTERS.length);
    for (const c of CHAPTERS) expect(c.pages.length).toBeGreaterThan(2);
  });

  it("cada uno de los 8 Guardianes tiene su arco de tres capítulos: inicio, medio y purificado", () => {
    for (const g of GUARDIANS) {
      const arc = CHAPTERS.filter((c) => c.guardian === g.slug);
      expect(arc.map((c) => (c.unlock.kind === "inicio" ? "inicio" : c.unlock.stage)), g.slug).toEqual(["inicio", "medio", "purificado"]);
    }
    for (const c of CHAPTERS) if (c.guardian) expect(GUARDIANS.some((g) => g.slug === c.guardian), c.id).toBe(true);
  });

  it("todas las ilustraciones existen", () => {
    for (const c of CHAPTERS) {
      expect(existsSync(pub(`/assets/escenarios/cronicas/cronicas-${c.scene}.svg`))).toBe(true);
      if (c.guest) expect(existsSync(pub(c.guest.src)), c.guest.src).toBe(true);
    }
  });

  it("los hitos salen de la penúltima y la última misión, para portales de cualquier tamaño", () => {
    expect(stagesReached("petrox", [], 4)).toEqual([]);
    expect(stagesReached("petrox", [1, 2], 4)).toEqual([]);
    expect(stagesReached("petrox", [1, 2, 3], 4)).toEqual([stageKey("petrox", "medio")]);
    expect(stagesReached("petrox", [1, 2, 3, 4], 4)).toEqual([stageKey("petrox", "medio"), stageKey("petrox", "purificado")]);
    expect(stagesReached("brumalis", [1, 2, 3, 4, 5, 6, 7], 8)).toEqual([stageKey("brumalis", "medio")]);
    expect(stagesReached("zhaal", [1], 1)).toEqual([stageKey("zhaal", "medio"), stageKey("zhaal", "purificado")]);
  });

  it("se abren al avanzar en cualquier portal con ese Guardián", () => {
    const none = new Set<string>();
    expect(CHAPTERS.filter((c) => isUnlocked(c, none) && c.guardian === "petrox").map((c) => c.id)).toEqual(["petrox-1"]);
    const after = new Set(stagesReached("petrox", [1, 2, 3, 4], 4));
    expect(CHAPTERS.filter((c) => isUnlocked(c, after) && c.guardian === "petrox").map((c) => c.id)).toEqual(["petrox-1", "petrox-2", "petrox-3"]);
    expect(chaptersUnlockedBy("petrox", 3, 4).map((c) => c.id)).toEqual(["petrox-2"]);
    expect(chaptersUnlockedBy("petrox", 4, 4).map((c) => c.id)).toEqual(["petrox-3"]);
    expect(chaptersUnlockedBy("petrox", 2, 4)).toEqual([]);
    // Un portal nuevo de 6 misiones con Brumalis (creado en el editor) también abre su historia.
    expect(chaptersUnlockedBy("brumalis", 5, 6).map((c) => c.id)).toEqual(["brumalis-2"]);
    expect(chaptersUnlockedBy("brumalis", 6, 6).map((c) => c.id)).toEqual(["brumalis-3"]);
  });
});
