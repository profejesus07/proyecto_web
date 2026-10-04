import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { WEARABLE_ART } from "@/content/wearables";
import { WEARABLE_IDS } from "@/content/wearable-ids";
import { WEAR_SLOTS, avatarSrc, decodeColors, encodeColors, equippedItems, sanitizeLook } from "@/lib/avatar-look";
import { applyWearables } from "@/lib/avatar-wear";
import { getItem, petImage, shopItems, titleLabel } from "@/lib/catalog";

const svg = (base: string, rank = "e") => readFileSync(path.join(import.meta.dirname, `../public/assets/avatares/${base}/${base}-rango-${rank}-reposo.svg`), "utf8");

describe("objetos que se visten", () => {
  it("hay dibujo para cada cosmético y foco del catálogo, en su lugar", () => {
    for (const slot of WEAR_SLOTS) {
      expect(WEARABLE_IDS[slot].length).toBeGreaterThan(0);
      for (const id of WEARABLE_IDS[slot]) {
        expect(getItem(id), id).toBeTruthy();
        expect(WEARABLE_ART[id].slot).toBe(slot);
        expect(WEARABLE_ART[id].art).toMatch(/^<[a-z]+[\s>]/);
      }
    }
  });

  it("codifica lo puesto en la URL y lo valida al leerlo", () => {
    const look = { hair: 2, wear: { capa: "obj_cosmetico_capa_hojas", gafas: "obj_cosmetico_gafas_redondas", foco: "obj_foco_varita" } };
    const code = encodeColors(look);
    expect(code).toBe("h2K1G0F1");
    expect(decodeColors(code)).toEqual(look);
    expect(decodeColors("K99G-1")).toEqual({});
    expect(avatarSrc("aria", "E", { wear: { capa: "obj_cosmetico_capa_hojas" } })).toMatch(/c=K1&/);
  });

  it("descarta objetos que no existen o van en otro lugar", () => {
    const look = sanitizeLook({
      wear: { capa: "obj_cosmetico_gafas_redondas", gafas: "obj_cosmetico_gafas_redondas", sombrero: "<x>" },
      frame: "obj_marco_raro", title: "obj_titulo_constructor", pet: "obj_companero_zorro",
    });
    expect(look).toEqual({ wear: { gafas: "obj_cosmetico_gafas_redondas" }, frame: "obj_marco_raro", title: "obj_titulo_constructor", pet: "obj_companero_zorro" });
    expect(sanitizeLook({ frame: "../x", title: "obj_titulo_<b>", pet: 3 })).toEqual({});
    expect(equippedItems(look).sort()).toEqual(["obj_companero_zorro", "obj_cosmetico_gafas_redondas", "obj_marco_raro", "obj_titulo_constructor"]);
  });

  it("pone cada objeto en su capa: espalda detrás del cabello, gafas dentro de la cabeza", () => {
    const out = applyWearables(svg("aria"), "aria", { wear: { capa: "obj_cosmetico_capa_hojas", gafas: "obj_cosmetico_gafas_redondas", bufanda: "obj_cosmetico_bufanda_lana" } });
    const capa = out.indexOf('data-wear="capa"'), hairb = out.indexOf('class="av-hairb"');
    const bufanda = out.indexOf('data-wear="bufanda"'), head = out.indexOf('class="av-head"');
    const gafas = out.indexOf('data-wear="gafas"'), hd = out.indexOf('class="av-hd"');
    expect(capa).toBeGreaterThan(0);
    expect(capa).toBeLessThan(hairb);
    expect(bufanda).toBeLessThan(head);
    expect(gafas).toBeGreaterThan(hd);
    expect((out.match(/<g[\s>]/g) ?? []).length).toBe((out.match(/<\/g>/g) ?? []).length);
    expect(applyWearables(svg("aria"), "aria", {})).toBe(svg("aria"));
  });

  it("con Tomás, lo de la espalda no baja de la silla; las alas traen su animación", () => {
    const out = applyWearables(svg("tomas"), "tomas", { wear: { alas: "obj_cosmetico_alas_cian" } });
    expect(out).toContain('clip-path="url(#av-wclip)"');
    expect(out).toMatch(/@keyframes w_fl[\s\S]*<\/style>/);
  });
});

describe("tienda", () => {
  it("solo vende lo que ya funciona", () => {
    const sale = shopItems();
    const cats = new Set(sale.map((i) => i.categoria));
    expect([...cats].sort()).toEqual(["ayuda", "companero", "cosmetico", "foco", "marco"]);
    expect(sale.filter((i) => i.categoria === "ayuda").map((i) => i.id).sort()).toEqual(["obj_ayuda_5050", "obj_ayuda_pista"]);
    expect(sale.some((i) => i.categoria === "poder" || i.categoria === "decoracion" || i.categoria === "equipo")).toBe(false);
  });

  it("muestra el nombre corto del título y el compañero según el rango", () => {
    expect(titleLabel("obj_titulo_constructor")).toBe("Constructor");
    expect(titleLabel("obj_marco_raro")).toBeNull();
    expect(petImage("obj_companero_kuro_cian", "D")).toBe("/assets/objetos/companero/obj_companero_kuro_cian-cachorro.svg");
    expect(petImage("obj_companero_kuro_cian", "B")).toMatch(/-joven\.svg$/);
    expect(petImage("obj_companero_kuro_cian", "S")).toMatch(/-majestuoso\.svg$/);
    expect(petImage("obj_companero_zorro", "S")).toBe("/assets/objetos/companero/obj_companero_zorro.svg");
  });
});
