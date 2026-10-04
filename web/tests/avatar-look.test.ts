import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BASE_PALETTE, EYES, HAIR, SKIN, avatarSrc, canWearGear, decodeColors, encodeColors, gearRank, recolorSvg, sanitizeLook, shadeGroup } from "@/lib/avatar-look";
import { AVATAR_BASES } from "@/lib/data/types";
import { HAIRSTYLES } from "@/lib/avatar-hair";

const svg = (base: string, rank = "e") => readFileSync(path.join(import.meta.dirname, `../public/assets/avatares/${base}/${base}-rango-${rank}-reposo.svg`), "utf8");

describe("aspecto del avatar", () => {
  it("limpia valores fuera de rango o de otro tipo", () => {
    expect(sanitizeLook({ skin: 2, hair: 99, eyes: -1, top: "3", pants: 1.5, gear: "c", x: 1 })).toEqual({ skin: 2, gear: "C" });
    expect(sanitizeLook(null)).toEqual({});
    expect(sanitizeLook("hola")).toEqual({});
  });

  it("codifica y decodifica los colores para la URL", () => {
    const look = { skin: 1, hair: 9, eyes: 0, top: 7, pants: 5 };
    expect(encodeColors(look)).toBe("s1h9e0t7p5");
    expect(decodeColors("s1h9e0t7p5")).toEqual(look);
    expect(decodeColors("s99<script>")).toEqual({});
    expect(encodeColors({})).toBe("");
  });

  it("el atuendo nunca supera el rango alcanzado", () => {
    expect(gearRank("C", { gear: "D" })).toBe("D");
    expect(gearRank("C", { gear: "S" })).toBe("C");
    expect(gearRank("C", {})).toBe("C");
    expect(canWearGear("B", "A")).toBe(true);
    expect(canWearGear("S", "A")).toBe(false);
  });

  it("sin cambios usa el archivo estático; con colores, la ruta que los aplica", () => {
    expect(avatarSrc("aria", "C")).toBe("/assets/avatares/aria/aria-rango-c-reposo.svg");
    expect(avatarSrc("aria", "C", { gear: "D" })).toBe("/assets/avatares/aria/aria-rango-d-reposo.svg");
    expect(avatarSrc("leo", "E", { hair: 4 })).toMatch(/^\/avatar\/leo\/leo-rango-e-reposo\.svg\?c=h4&v=\d+$/);
  });

  it("conserva sombras: el tono oscuro sigue siendo más oscuro que el principal", () => {
    const m = shadeGroup(["#C68E5E", "#A8703F"], "#F3D2B6");
    expect(m["#C68E5E"]).toBe("#F3D2B6");
    expect(parseInt(m["#A8703F"].slice(1, 3), 16)).toBeLessThan(0xf3);
  });

  it("los colores de cada avatar existen en todos sus archivos de rango", () => {
    for (const b of AVATAR_BASES) {
      for (const r of ["e", "d", "c", "b", "a", "s"]) {
        const s = svg(b, r).toUpperCase();
        const p = BASE_PALETTE[b];
        expect(s, `${b} ${r}`).toContain(`"${p.skin[0]}"`);
        expect(s, `${b} ${r}`).toContain(`"${p.hair[0]}"`);
        expect(s, `${b} ${r}`).toContain('ID="AV-IRIS"');
      }
    }
  });

  it("cambia piel, cabello y ojos sin tocar los degradados de los efectos", () => {
    const original = svg("aria");
    const out = recolorSvg(original, "aria", { skin: 0, hair: 3, eyes: 2 });
    expect(out).not.toContain('fill="#C68E5E"');
    expect(out).toContain(`fill="${SKIN[0].color}"`);
    expect(out).toContain(`fill="${HAIR[3].color}"`);
    expect(out).toContain(`stop-color="${EYES[2].stops[0]}"`);
    // El brillo dorado del rango (stop-color) sigue igual.
    expect(out).toContain('stop-color="#FFC83D"');
    expect(out.length).toBeGreaterThan(original.length - 200);
    expect(recolorSvg(original, "aria", {})).toBe(original);
  });

  it("hay peinados masculinos y femeninos, y cada uno cambia el cabello sin perder cejas ni audífonos", () => {
    expect(HAIRSTYLES.filter((h) => h.group === "masculino").length).toBeGreaterThanOrEqual(5);
    expect(HAIRSTYLES.filter((h) => h.group === "femenino").length).toBeGreaterThanOrEqual(5);
    expect(new Set(HAIRSTYLES.map((h) => h.id)).size).toBe(HAIRSTYLES.length);
    for (const b of AVATAR_BASES) {
      const original = svg(b, "s");
      HAIRSTYLES.forEach((_h, i) => {
        const out = recolorSvg(original, b, { style: i, hair: 4 });
        expect(out, `${b} ${i}`).not.toBe(original);
        expect(out).toContain('class="av-bl"');
        expect(out).toContain('class="av-br"');
        expect(out).toContain(`fill="${HAIR[4].color}"`);
        expect(out).toContain('class="av-crown"');
        // El SVG sigue bien formado: mismos <g> abiertos que cerrados.
        expect((out.match(/<g[\s>]/g) ?? []).length).toBe((out.match(/<\/g>/g) ?? []).length);
        if (b === "nuri") expect(out).toContain('cx="101" cy="164"');
      });
    }
    expect(encodeColors({ style: 3 })).toBe("y3");
    expect(decodeColors("y3")).toEqual({ style: 3 });
  });
});
