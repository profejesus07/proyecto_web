import { describe, expect, it } from "vitest";
import { PREGUNTAS } from "./preguntas-frecuentes";

describe("preguntas frecuentes", () => {
  it("«¿Cuánto cuesta?» dice el texto aprobado", () => {
    expect(PREGUNTAS.costo.a).toBe("Crear la cuenta es gratis, y también la primera lección de cada curso. En cada curso verás si es gratis o cuánto cuesta.");
  });

  it("no mencionan pasarelas ni medios de pago (los pagos aún no están abiertos al público)", () => {
    for (const { q, a } of Object.values(PREGUNTAS)) expect(`${q} ${a}`).not.toMatch(/wompi|mercado ?pago|\bpse\b|nequi|tarjeta/i);
  });
});
