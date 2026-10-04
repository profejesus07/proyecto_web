import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// Reglas del juego dentro de la base de datos: premios, orden de misiones, jefe y compras.
const U = "33333333-3333-3333-3333-333333333333";
const V = "44444444-4444-4444-4444-444444444444";

type H = Awaited<ReturnType<typeof makeDb>>;
let h: H;
let missions: { id: string; position: number; is_boss: boolean }[];

async function complete(user: string, mission: string, score: number, items: string[] = []) {
  const r = await h.db.query<{ r: Record<string, unknown> }>(
    "select public.complete_mission($1, $2, $3, 70, $4::text[]) as r",
    [user, mission, score, `{${items.join(",")}}`],
  );
  return r.rows[0].r as {
    passed: boolean; first: boolean; xp_gain: number; coins_gain: number; gems_gain: number;
    xp: number; coins: number; gems: number; streak: number; boss_defeated: boolean; course_done: boolean; granted: string[];
  };
}

beforeEach(async () => {
  h = await makeDb();
  await h.addUser(U, { display_name: "Ursula" });
  await h.addUser(V, { display_name: "Víctor" });
  await h.grant(U);
  await h.grant(V);
  const m = await h.db.query<{ id: string; position: number; is_boss: boolean }>("select id, position, is_boss from public.missions where course_slug = 'primer-portal' order by position");
  missions = m.rows;
});

describe("complete_mission", () => {
  it("la primera aprobación da XP y monedas", async () => {
    const r = await complete(U, missions[0].id, 100, ["obj_insignia_primera_mision"]);
    expect(r).toMatchObject({ passed: true, first: true, xp_gain: 60, coins_gain: 20, xp: 60, coins: 20, streak: 1, boss_defeated: false, course_done: false });
    expect(r.granted).toContain("obj_insignia_primera_mision");
  });

  it("sin la nota mínima no hay premio, pero cuenta el intento", async () => {
    const r = await complete(U, missions[0].id, 50);
    expect(r).toMatchObject({ passed: false, first: false, xp_gain: 0, coins_gain: 0, xp: 0 });
    const p = await h.db.query<{ attempts: number; completed_at: string | null }>("select attempts, completed_at from public.mission_progress where user_id = $1", [U]);
    expect(p.rows[0].attempts).toBe(1);
    expect(p.rows[0].completed_at).toBeNull();
  });

  it("repetir una misión ya superada no da más XP (no se puede farmear)", async () => {
    await complete(U, missions[0].id, 80);
    const r = await complete(U, missions[0].id, 100, ["obj_insignia_primera_mision"]);
    expect(r).toMatchObject({ first: false, xp_gain: 0, coins_gain: 0, xp: 60 });
    expect(r.granted).not.toContain("obj_insignia_primera_mision");
    const p = await h.db.query<{ best_score: number; attempts: number }>("select best_score, attempts from public.mission_progress where user_id = $1", [U]);
    expect(p.rows[0]).toEqual({ best_score: 100, attempts: 2 });
  });

  it("la nota nunca baja: se guarda la mejor", async () => {
    await complete(U, missions[0].id, 100);
    await complete(U, missions[0].id, 40);
    const p = await h.db.query<{ best_score: number }>("select best_score from public.mission_progress where user_id = $1", [U]);
    expect(p.rows[0].best_score).toBe(100);
  });

  it("las misiones se desbloquean en orden", async () => {
    await expect(complete(U, missions[1].id, 100)).rejects.toThrow(/mision_bloqueada/);
    await complete(U, missions[0].id, 100);
    await expect(complete(U, missions[1].id, 100)).resolves.toMatchObject({ first: true });
  });

  it("el Guardián no se puede enfrentar sin terminar las misiones", async () => {
    const boss = missions.find((m) => m.is_boss)!;
    await expect(complete(U, boss.id, 100)).rejects.toThrow(/mision_bloqueada/);
  });

  it("vencer al Guardián da premios, gemas y completa el portal", async () => {
    for (const m of missions.filter((x) => !x.is_boss)) await complete(U, m.id, 80);
    const boss = missions.find((m) => m.is_boss)!;
    const r = await complete(U, boss.id, 100, ["obj_recompensa_capa", "obj_titulo_constructor"]);
    expect(r).toMatchObject({ first: true, boss_defeated: true, course_done: true, gems_gain: 5, xp_gain: 150 });
    expect(r.coins_gain).toBe(120);
    expect(r.granted).toEqual(expect.arrayContaining(["obj_recompensa_capa", "obj_titulo_constructor"]));
    const d = await h.db.query("select 1 from public.boss_defeats where user_id = $1", [U]);
    expect(d.rows).toHaveLength(1);
  });

  it("registra todo en el libro de movimientos", async () => {
    await complete(U, missions[0].id, 100);
    const l = await h.db.query<{ kind: string; delta: number }>("select kind, delta from public.ledger where user_id = $1 order by id", [U]);
    expect(l.rows).toEqual([{ kind: "xp", delta: 60 }, { kind: "coins", delta: 20 }]);
  });

  it("rechaza puntajes imposibles y misiones inexistentes", async () => {
    await expect(complete(U, missions[0].id, 101)).rejects.toThrow(/puntaje_invalido/);
    await expect(complete(U, "99999999-9999-9999-9999-999999999999", 100)).rejects.toThrow(/mision_no_encontrada/);
  });

  it("no mezcla el progreso de dos estudiantes", async () => {
    await complete(U, missions[0].id, 100);
    const r = await complete(V, missions[0].id, 100);
    expect(r).toMatchObject({ first: true, xp: 60 });
  });

  it("la racha sube con días consecutivos y se reinicia si se salta uno", async () => {
    await complete(U, missions[0].id, 100);
    await h.db.exec(`update public.profiles set last_active = (now() at time zone 'America/Bogota')::date - 1, streak = 2 where id = '${U}'`);
    const r = await complete(U, missions[1].id, 100);
    expect(r.streak).toBe(3);
    expect(r.granted).toContain("obj_insignia_racha3");
    await h.db.exec(`update public.profiles set last_active = (now() at time zone 'America/Bogota')::date - 5 where id = '${U}'`);
    const r2 = await complete(U, missions[2].id, 100);
    expect(r2.streak).toBe(1);
  });

  it("solo el servidor puede ejecutarla", async () => {
    await expect(h.as("authenticated", U, "select public.complete_mission($1, $2, 100, 70, '{}')", [U, missions[0].id])).rejects.toThrow();
    await expect(h.as("anon", null, "select public.complete_mission($1, $2, 100, 70, '{}')", [U, missions[0].id])).rejects.toThrow();
  });
});

describe("cursos independientes: primera lección gratis, el resto con suscripción", () => {
  const second = async () => (await h.db.query<{ id: string; position: number; is_boss: boolean }>(
    "select id, position, is_boss from public.missions where course_slug = 'portal-del-primer-intento' order by position")).rows;

  it("la primera lección de cualquier curso es gratis, aunque no se haya terminado otro curso", async () => {
    const [i1] = await second();
    await expect(complete(U, i1.id, 100)).resolves.toMatchObject({ first: true, xp_gain: 60 });
  });

  it("sin suscripción, la segunda lección pide suscribirse (también para las ayudas)", async () => {
    const [i1, i2] = await second();
    await complete(U, i1.id, 100);
    await expect(complete(U, i2.id, 100)).rejects.toThrow(/requiere_suscripcion/);
    const q = await h.db.query<{ id: string }>("select id from public.questions where mission_id = $1 limit 1", [i2.id]);
    await expect(h.db.query("select public.use_aid($1, $2, 'obj_ayuda_pista', 10, 0)", [U, q.rows[0].id])).rejects.toThrow(/requiere_suscripcion/);
  });

  it("dentro de un curso las lecciones siguen en orden, aun con suscripción", async () => {
    await h.grant(U, "portal-del-primer-intento");
    const [, i2] = await second();
    await expect(complete(U, i2.id, 100)).rejects.toThrow(/mision_bloqueada/);
  });

  it("un acceso vencido ya no sirve", async () => {
    const [i1, i2] = await second();
    await h.db.query("insert into public.course_access (user_id, course_slug, expires_at) values ($1, 'portal-del-primer-intento', now() - interval '1 day')", [U]);
    await complete(U, i1.id, 100);
    await expect(complete(U, i2.id, 100)).rejects.toThrow(/requiere_suscripcion/);
  });

  it("con suscripción se puede vencer a Ignaris", async () => {
    await h.grant(U, "portal-del-primer-intento");
    const ms = await second();
    for (const m of ms.filter((x) => !x.is_boss)) await complete(U, m.id, 100);
    const r = await complete(U, ms.find((m) => m.is_boss)!.id, 100, ["obj_recompensa_brasas", "obj_titulo_valiente", "obj_sello_fuego"]);
    expect(r).toMatchObject({ boss_defeated: true, course_done: true });
    expect(r.granted).toEqual(expect.arrayContaining(["obj_recompensa_brasas", "obj_titulo_valiente", "obj_sello_fuego"]));
  });

  it("la regla no se puede consultar desde el navegador", async () => {
    await expect(h.as("authenticated", U, "select public.mission_is_locked($1, $2)", [U, missions[0].id])).rejects.toThrow(/permission denied/);
  });
});

describe("purchase_item", () => {
  beforeEach(async () => {
    await h.db.exec(`update public.profiles set coins = 100 where id = '${U}'`);
  });

  it("descuenta las monedas y entrega el objeto", async () => {
    const r = await h.db.query<{ r: { coins: number } }>("select public.purchase_item($1, 'obj_ayuda_pista', 20) as r", [U]);
    expect(r.rows[0].r.coins).toBe(80);
    const inv = await h.db.query("select item_id from public.inventory where user_id = $1", [U]);
    expect(inv.rows).toEqual([{ item_id: "obj_ayuda_pista" }]);
  });

  it("no se puede comprar dos veces ni sin monedas", async () => {
    await h.db.query("select public.purchase_item($1, 'obj_ayuda_pista', 20)", [U]);
    await expect(h.db.query("select public.purchase_item($1, 'obj_ayuda_pista', 20)", [U])).rejects.toThrow(/ya_lo_tienes/);
    await expect(h.db.query("select public.purchase_item($1, 'obj_poder_aura', 200)", [U])).rejects.toThrow(/monedas_insuficientes/);
  });

  it("rechaza precios inválidos", async () => {
    await expect(h.db.query("select public.purchase_item($1, 'x', 0)", [U])).rejects.toThrow(/precio_invalido/);
    await expect(h.db.query("select public.purchase_item($1, 'x', -5)", [U])).rejects.toThrow(/precio_invalido/);
  });

  it("solo el servidor puede ejecutarla", async () => {
    await expect(h.as("authenticated", U, "select public.purchase_item($1, 'obj_ayuda_pista', 1)", [U])).rejects.toThrow();
  });
});
