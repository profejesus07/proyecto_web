import { describe, expect, it } from "vitest";
import { gradeActivity, normAnswer, normalizeActivity, publicActivity, seededShuffle } from "./activities";

describe("actividades", () => {
  it("la mezcla es estable y nunca deja el orden correcto", () => {
    for (const seed of ["a", "b", "c", "q-123", "zz"]) {
      const out = seededShuffle(["1", "2"], seed);
      expect(out).toEqual(["2", "1"]);
      expect(seededShuffle(["a", "b", "c", "d"], seed)).toEqual(seededShuffle(["a", "b", "c", "d"], seed));
      expect(seededShuffle(["a", "b", "c", "d"], seed)).not.toEqual(["a", "b", "c", "d"]);
    }
  });

  it("lo público nunca revela respuestas", () => {
    expect(publicActivity("q", "completar", ["sol", "sol"], {})).toEqual({ options: [] });
    expect(publicActivity("q", "relacionar", ["A", "B"], { right: ["1", "2"] })).toEqual({ options: ["A", "B"], right: ["2", "1"] });
  });

  it("normaliza como la base de datos", () => {
    expect(normAnswer("  ¡La FOTOSÍNTESIS!  ")).toBe("la fotosintesis");
  });

  it("revisa cada tipo", () => {
    expect(gradeActivity("opcion", ["a", "b"], {}, 1, 1)).toBe(true);
    expect(gradeActivity("opcion", ["a", "b"], {}, 1, 5)).toBeNull();
    expect(gradeActivity("completar", ["Bogotá", "Bogotá"], {}, 0, "bogota")).toBe(true);
    expect(gradeActivity("completar", ["Bogotá", "Bogotá"], {}, 0, "")).toBe(false);
    expect(gradeActivity("ordenar", ["1", "2"], {}, 0, ["2", "1"])).toBe(false);
    expect(gradeActivity("relacionar", ["A", "B"], { right: ["1", "2"] }, 0, ["1", "2"])).toBe(true);
    expect(gradeActivity("relacionar", ["A", "B"], { right: ["1", "2"] }, 0, "1")).toBeNull();
  });

  it("valida lo que escribe el editor", () => {
    expect(normalizeActivity({ kind: "opcion", options: ["a", "", "c"], right: [], correctIndex: 2 })).toEqual({ options: ["a", "c"], correctIndex: 1, data: {} });
    expect(normalizeActivity({ kind: "vf", options: [], right: [], correctIndex: 1 })).toEqual({ options: ["Verdadero", "Falso"], correctIndex: 1, data: {} });
    expect(normalizeActivity({ kind: "completar", options: ["sol", ""], right: [], correctIndex: -1 })).toEqual({ options: ["sol", "sol"], correctIndex: 0, data: {} });
    expect(normalizeActivity({ kind: "ordenar", options: ["a", "a"], right: [], correctIndex: -1 })).toEqual({ error: "Los pasos no se pueden repetir." });
    expect(normalizeActivity({ kind: "relacionar", options: ["A", "B", ""], right: ["1", "2", ""], correctIndex: -1 })).toEqual({ options: ["A", "B"], correctIndex: 0, data: { right: ["1", "2"] } });
    expect(normalizeActivity({ kind: "relacionar", options: ["A", "B"], right: ["1", ""], correctIndex: -1 })).toEqual({ error: "Cada pareja necesita sus dos lados." });
  });
});
