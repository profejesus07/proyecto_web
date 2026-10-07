import { describe, expect, it } from "vitest";
import { CODE_PATTERN, MARCAS, MARCA_UNEX_DESDE, marcaDeConstancia } from "@/lib/certificates";

// Cada constancia se dibuja con la marca con la que se emitió (fecha de corte MARCA_UNEX_DESDE).
const CORTE = "2026-10-20T08:00:00-05:00";

describe("marcaDeConstancia", () => {
  it("antes del corte: Academia Virtual Umbral, con su logo, sello y marca de agua de siempre", () => {
    const m = marcaDeConstancia({ issuedAt: "2026-10-20T07:59:59-05:00" }, CORTE);
    expect(m.id).toBe("umbral");
    expect(m.emisor).toBe("la Academia Virtual Umbral");
    expect(m.logo.src).toBe("/brand/academia-umbral-horizontal-claro.svg");
    expect(m.marcaDeAgua).toEqual({ src: "/brand/academia-umbral-isotipo-estatico-claro.svg", opacidad: 0.045 });
    expect(m.sello).toBe("ACADEMIA VIRTUAL UMBRAL · CONSTANCIA VERIFICABLE ·");
  });

  it("desde el corte (incluido): UNEX Academy, con marca de agua monocroma entre 4 % y 6 %", () => {
    for (const issuedAt of [CORTE, "2026-10-20T13:00:00.000Z", "2027-01-15T10:00:00-05:00"]) {
      const m = marcaDeConstancia({ issuedAt }, CORTE);
      expect(m.id).toBe("unex");
      expect(m.emisor).toBe("UNEX Academy");
      expect(m.logo).toEqual({ src: "/brand/unex-academy.svg", alt: "UNEX Academy" });
      expect(m.marcaDeAgua.src).toBe("/brand/unex-isotipo-monocromo.svg");
      expect(m.marcaDeAgua.opacidad).toBeGreaterThanOrEqual(0.04);
      expect(m.marcaDeAgua.opacidad).toBeLessThanOrEqual(0.06);
    }
  });

  it("compara instantes, no textos: la misma hora en otra zona horaria cuenta igual", () => {
    expect(marcaDeConstancia({ issuedAt: "2026-10-20T12:59:59Z" }, CORTE).id).toBe("umbral");
    expect(marcaDeConstancia({ issuedAt: "2026-10-20T13:00:00Z" }, CORTE).id).toBe("unex");
  });

  it("MARCA_UNEX_DESDE es un instante válido con zona horaria explícita (se usa por defecto)", () => {
    expect(MARCA_UNEX_DESDE).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
    expect(Number.isNaN(new Date(MARCA_UNEX_DESDE).getTime())).toBe(false);
    const t = new Date(MARCA_UNEX_DESDE).getTime();
    expect(marcaDeConstancia({ issuedAt: new Date(t - 1000).toISOString() }).id).toBe("umbral");
    expect(marcaDeConstancia({ issuedAt: new Date(t).toISOString() }).id).toBe("unex");
  });

  it("si la fecha de expedición no se puede leer, conserva la marca anterior", () => {
    expect(marcaDeConstancia({ issuedAt: "no-es-fecha" }, CORTE)).toBe(MARCAS.umbral);
  });
});

describe("código de verificación", () => {
  it("CODE_PATTERN no cambia: UMB- y dos bloques de 4 (igual que la restricción de la base de datos)", () => {
    expect(CODE_PATTERN.source).toBe("^UMB-[A-Z2-9]{4}-[A-Z2-9]{4}$");
    expect(CODE_PATTERN.test("UMB-T5AZ-VU8T")).toBe(true);
    expect(CODE_PATTERN.test("UNX-T5AZ-VU8T")).toBe(false);
  });
});
