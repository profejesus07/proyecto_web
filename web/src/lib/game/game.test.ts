import { describe, expect, it } from "vitest";
import { gradeAnswers, PASS_MARK } from "./grading";
import { rankForXp, rankProgress, ranksReached } from "./ranks";
import { GUARDIAN_REWARDS, itemsOnFirstCompletion } from "./rewards";

describe("rangos", () => {
  it("asigna el rango según la XP", () => {
    expect(rankForXp(0).key).toBe("E");
    expect(rankForXp(149).key).toBe("E");
    expect(rankForXp(150).key).toBe("D");
    expect(rankForXp(3500).key).toBe("S");
    expect(rankForXp(999999).key).toBe("S");
  });

  it("calcula el avance hacia el siguiente rango", () => {
    const p = rankProgress(75);
    expect(p.rank.key).toBe("E");
    expect(p.next?.key).toBe("D");
    expect(p.pct).toBe(50);
    expect(p.remaining).toBe(75);
  });

  it("el último rango no tiene siguiente", () => {
    const p = rankProgress(5000);
    expect(p.next).toBeNull();
    expect(p.pct).toBe(100);
    expect(p.remaining).toBe(0);
  });

  it("detecta varios rangos alcanzados de una vez", () => {
    expect(ranksReached(100, 160).map((r) => r.key)).toEqual(["D"]);
    expect(ranksReached(100, 1000).map((r) => r.key)).toEqual(["D", "C", "B"]);
    expect(ranksReached(160, 170)).toEqual([]);
  });
});

describe("calificación", () => {
  it("cuenta aciertos y aprueba con el mínimo", () => {
    const g = gradeAnswers([1, 1, 0, 1], [1, 1, 0, 0]);
    expect(g).toMatchObject({ total: 4, correct: 3, score: 75, passed: true });
    expect(g.perQuestion).toEqual([true, true, true, false]);
  });

  it("no aprueba por debajo del mínimo", () => {
    expect(gradeAnswers([0, 0, 0, 0], [0, 0, 1, 1]).passed).toBe(false);
    expect(PASS_MARK).toBe(70);
  });

  it("una pregunta sin responder es incorrecta", () => {
    expect(gradeAnswers([2, 2], [-1, 2]).score).toBe(50);
  });

  it("exige todas las respuestas y al menos una pregunta", () => {
    expect(() => gradeAnswers([1, 2, 3], [1, 2])).toThrow("respuestas_incompletas");
    expect(() => gradeAnswers([], [])).toThrow("sin_preguntas");
  });
});

describe("premios de la primera vez", () => {
  const base = { isBoss: false, guardian: "petrox", element: "naturaleza", xpBefore: 0, xpGain: 60, firstEver: false };

  it("una misión normal no da nada extra", () => {
    expect(itemsOnFirstCompletion(base)).toEqual([]);
  });

  it("la primera misión del estudiante da su insignia", () => {
    expect(itemsOnFirstCompletion({ ...base, firstEver: true })).toEqual(["obj_insignia_primera_mision", "obj_rango_e"]);
  });

  it("subir de rango da la insignia del nuevo rango", () => {
    expect(itemsOnFirstCompletion({ ...base, xpBefore: 100, xpGain: 60 })).toEqual(["obj_rango_d"]);
  });

  it("vencer al Guardián da recompensa, título, sello y certificado", () => {
    const items = itemsOnFirstCompletion({ ...base, isBoss: true, xpGain: 150 });
    expect(items).toEqual(expect.arrayContaining([
      GUARDIAN_REWARDS.petrox.item, GUARDIAN_REWARDS.petrox.title, "obj_sello_naturaleza",
      "obj_sello_completado", "obj_certificado_portal", "obj_insignia_primer_guardian", "obj_insignia_primer_portal",
    ]));
    expect(new Set(items).size).toBe(items.length);
  });

  it("los 8 Guardianes tienen recompensa y título", () => {
    expect(Object.keys(GUARDIAN_REWARDS)).toHaveLength(8);
  });
});
