import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GUARDIANS } from "@/content/guardians";
import { allItems } from "@/lib/catalog";
import { GUARDIAN_REWARDS } from "@/lib/game/rewards";

const pub = path.resolve(import.meta.dirname, "../public");
const has = (p: string) => existsSync(path.join(pub, p));

describe("recursos visuales", () => {
  it("cada objeto del catálogo tiene su imagen", () => {
    const missing = allItems().filter((i) => !has(`assets/objetos/${i.archivo}`)).map((i) => `${i.id} → ${i.archivo}`);
    expect(missing).toEqual([]);
  });

  it("cada Guardián tiene sus imágenes de reposo y purificado", () => {
    const missing = GUARDIANS.flatMap((g) => ["reposo", "purificado"].map((a) => `assets/jefes/${g.slug}/${g.slug}-${a}.svg`)).filter((p) => !has(p));
    expect(missing).toEqual([]);
  });

  it("los premios de los Guardianes existen en el catálogo", () => {
    const ids = new Set(allItems().map((i) => i.id));
    const missing = Object.values(GUARDIAN_REWARDS).flatMap((r) => [r.item, r.title]).filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
  });

  it("los objetos que entregan las misiones existen en el catálogo", () => {
    const ids = new Set(allItems().map((i) => i.id));
    const used = ["obj_insignia_primera_mision", "obj_rango_e", "obj_rango_d", "obj_rango_c", "obj_rango_b", "obj_rango_a", "obj_rango_s",
      "obj_insignia_primer_guardian", "obj_insignia_primer_portal", "obj_sello_luz", "obj_sello_sombra", "obj_sello_fuego", "obj_sello_agua",
      "obj_sello_naturaleza", "obj_sello_eter", "obj_sello_completado", "obj_certificado_portal", "obj_insignia_racha3", "obj_insignia_racha7", "obj_insignia_racha30"];
    expect(used.filter((id) => !ids.has(id))).toEqual([]);
  });

  it("existen las escenas y los personajes que usa la interfaz", () => {
    const need = [
      "assets/escenarios/gremio/gremio-dia.svg", "assets/escenarios/gremio/gremio-noche.svg",
      ...["disponible", "mixto", "completado"].map((s) => `assets/escenarios/portales/portales-${s}.svg`),
      ...["calma", "victoria"].map((s) => `assets/escenarios/arena/arena-${s}.svg`), "assets/escenarios/terraza/terraza-atardecer.svg",
      "assets/guias/sora/sora-saludar.svg", "assets/guias/sora/sora-reposo.svg",
      ...["reposo", "saludar", "celebrar", "animar", "pensar"].map((a) => `assets/guias/kuro-cachorro/kuro-cachorro-${a}.svg`),
      ...["aria", "leo", "tomas", "nuri"].flatMap((b) => ["e", "d", "c", "b", "a", "s"].map((r) => `assets/avatares/${b}/${b}-rango-${r}-reposo.svg`)),
    ];
    expect(need.filter((p) => !has(p))).toEqual([]);
  });
});
