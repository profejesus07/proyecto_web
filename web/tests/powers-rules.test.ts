import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { consumableRule, getItem, shopItems } from "@/lib/catalog";
import { POWERS, POWER_KINDS, RANK_S_POWERS, powerByItem, stemOf } from "@/lib/game/powers";
import { itemsOnFirstCompletion } from "@/lib/game/rewards";

describe("reglas de los poderes", () => {
  it("cada poder existe en el catálogo y tiene su dibujo de efecto", () => {
    for (const k of POWER_KINDS) {
      const p = POWERS[k];
      expect(getItem(p.itemId), p.itemId).toBeTruthy();
      expect(existsSync(path.join(import.meta.dirname, "../public", p.fx)), p.fx).toBe(true);
      expect(powerByItem(p.itemId)?.kind).toBe(k);
    }
  });

  it("los seis de tienda se venden y se acumulan; los de rango S no", () => {
    const sale = new Set(shopItems().map((i) => i.id));
    for (const k of ["rayo", "escudo", "aura", "lluvia", "kuro", "pulso"] as const) {
      expect(sale.has(POWERS[k].itemId)).toBe(true);
      expect(consumableRule(POWERS[k].itemId)?.maxStock).toBeGreaterThan(0);
    }
    expect(RANK_S_POWERS.sort()).toEqual(["obj_poder_aliento", "obj_poder_sombra"]);
    for (const id of RANK_S_POWERS) expect(consumableRule(id)).toBeUndefined();
  });

  it("llegar a rango S regala la Sombra Dorada y el Segundo Aliento", () => {
    const items = itemsOnFirstCompletion({ isBoss: false, guardian: "petrox", element: "luz", xpBefore: 3400, xpGain: 200, firstEver: false });
    expect(items).toEqual(expect.arrayContaining(["obj_rango_s", "obj_poder_sombra", "obj_poder_aliento"]));
    expect(itemsOnFirstCompletion({ isBoss: false, guardian: "petrox", element: "luz", xpBefore: 100, xpGain: 60, firstEver: false })).not.toContain("obj_poder_sombra");
  });

  it("la raíz de las palabras ignora tildes, mayúsculas y signos (igual que la base de datos)", () => {
    expect(stemOf("Página,")).toBe("pagin");
    expect(stemOf("¿Cuál")).toBe("cual");
    expect(stemOf("niño")).toBe("nino");
  });
});
