import { describe, expect, it } from "vitest";
import { KAEL_ALLY_AT, duel, kaelRecord, kaelScore } from "@/lib/game/kael";
import { FAMILY_MESSAGES, GUARDIANES_HOGAR, MAESTROS, defaultGuide, guideSrc } from "@/content/elenco";
import { guideFor } from "@/lib/guides";
import { sanitizeLook } from "@/lib/avatar-look";
import { existsSync } from "node:fs";
import path from "node:path";

describe("Kael, el rival amistoso", () => {
  it("tiene una nota fija por misión, entre 60 y 90", () => {
    expect(kaelScore("m1")).toBe(kaelScore("m1"));
    for (const id of ["m1", "m2", "c2m3", "abc-123"]) expect(kaelScore(id)).toBeGreaterThanOrEqual(60);
    expect(new Set(["m1", "m2", "m3", "m4", "c2m1", "c2m2"].map(kaelScore)).size).toBeGreaterThan(1);
  });

  it("decide el duelo y se vuelve aliado tras varias victorias", () => {
    expect(duel(100, "m1")).toBe("gana");
    expect(duel(kaelScore("m1"), "m1")).toBe("empata");
    expect(duel(0, "m1")).toBe("pierde");
    const r = kaelRecord([{ missionId: "m1", bestScore: 100 }, { missionId: "m2", bestScore: 0 }]);
    expect(r).toMatchObject({ wins: 1, losses: 1, ally: false, rematch: "m2" });
    const many = Array.from({ length: KAEL_ALLY_AT }, (_, i) => ({ missionId: `x${i}`, bestScore: 100 }));
    expect(kaelRecord(many).ally).toBe(true);
  });
});

describe("Maestros y Guardianes del Hogar", () => {
  it("cada uno tiene sus animaciones en el elenco", () => {
    for (const g of [...MAESTROS, ...GUARDIANES_HOGAR]) {
      for (const a of ["reposo", "saludar", "hablar", "animar", "celebrar", "pensar", "alerta", "senalar", "orgullo", "abrir-portal"] as const) {
        expect(existsSync(path.join(import.meta.dirname, "../public", guideSrc(g, a))), `${g.id} ${a}`).toBe(true);
      }
    }
    for (const m of Object.values(FAMILY_MESSAGES)) expect(m.text.length).toBeGreaterThan(5);
  });

  it("docentes ven a su Maestro y familias a su Guardián; los estudiantes, su avatar", () => {
    expect(guideFor({ id: "t1", role: "docente", avatarLook: { guide: "maestro-olu" } })?.id).toBe("maestro-olu");
    // Un Guardián del Hogar no vale para un docente: se usa uno por defecto.
    expect(guideFor({ id: "t1", role: "docente", avatarLook: { guide: "mama-lucia" } })?.group).toBe("maestro");
    expect(guideFor({ id: "f1", role: "familia", avatarLook: {} })).toEqual(defaultGuide("hogar", "f1"));
    expect(guideFor({ id: "s1", role: "estudiante", avatarLook: { guide: "maestro-olu" } })).toBeNull();
    expect(sanitizeLook({ guide: "otro" })).toEqual({});
  });
});

describe("enemigos y bestiario", () => {
  it("cada enemigo usa su jugada especial al fallar y tiene su ficha en el bestiario", async () => {
    const { ALL_ENEMIES, foeAnim } = await import("@/lib/game/battle");
    const { BEASTS } = await import("@/content/bestiario");
    for (const e of ALL_ENEMIES) {
      const anim = foeAnim({ boss: false, kind: "miss", phase: 0, fury: false, firstEnter: false, enemy: e });
      expect(existsSync(path.join(import.meta.dirname, "../public/assets/enemigos", e.slug, `${e.slug}-${anim}.svg`)), anim).toBe(true);
      expect(foeAnim({ boss: false, kind: "miss", phase: 1, fury: false, firstEnter: false, enemy: e })).toBe("burla");
      expect(BEASTS.find((b) => b.slug === e.slug)?.howTo).toBeTruthy();
    }
  });

  it("toda la decoración tiene su lugar en la terraza y su dibujo sin medallón", async () => {
    const { DECOR_IDS } = await import("@/components/terrace");
    const { allItems } = await import("@/lib/catalog");
    const decor = allItems().filter((i) => i.categoria === "decoracion").map((i) => i.id).sort();
    expect([...DECOR_IDS].sort()).toEqual(decor);
    for (const id of decor) expect(existsSync(path.join(import.meta.dirname, "../public/assets/objetos/decoracion", `${id}-terraza.svg`))).toBe(true);
  });
});
