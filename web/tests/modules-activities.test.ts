import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// Módulos (un Guardián por módulo), actividades de varios tipos y cursos gratis.
const S = "cdcdcdcd-0000-0000-0000-000000000001";
const C = "curso-modular";

type H = Awaited<ReturnType<typeof makeDb>>;
let h: H;
const one = async <R>(sql: string, params: unknown[] = []) => (await h.db.query<{ r: R }>(sql, params)).rows[0].r;
const answer = <R = Record<string, unknown>>(mission: string, index: number, response: unknown) =>
  one<R>("select public.answer_activity($1, $2, $3, $4::jsonb) as r", [S, mission, index, JSON.stringify(response)]);

let mod1: string, mod2: string;
let lessons: string[];

/** Curso de prueba: módulo 1 (2 lecciones, la 2 es jefe) y módulo 2 (1 lección jefe). */
async function setup() {
  await h.db.query(`insert into public.courses (slug, title, summary, element, guardian, position, published, kind, is_free)
                    values ($1, 'Curso modular', 'x', 'luz', 'petrox', 50, true, 'curso', true)`, [C]);
  mod1 = await one("insert into public.modules (course_slug, position, title, guardian) values ($1, 1, 'Primeros pasos', 'petrox') returning id as r", [C]);
  mod2 = await one("insert into public.modules (course_slug, position, title, guardian) values ($1, 2, 'Sin miedo', 'ignaris') returning id as r", [C]);
  lessons = [];
  for (const [pos, mod, boss] of [[1, mod1, false], [2, mod1, true], [3, mod2, true]] as const) {
    lessons.push(await one("insert into public.missions (course_slug, position, title, is_boss, module_id) values ($1, $2, $3, $4, $5) returning id as r", [C, pos, `L${pos}`, boss, mod]));
  }
  const q = (m: string, pos: number, kind: string, options: unknown, correct = 0, data: unknown = {}) =>
    h.db.query("insert into public.questions (mission_id, position, prompt, options, correct_index, kind, data, hint) values ($1, $2, 'Pregunta', $3::jsonb, $4, $5, $6::jsonb, 'Una pista')",
      [m, pos, JSON.stringify(options), correct, kind, JSON.stringify(data)]);
  await q(lessons[0], 1, "vf", ["Verdadero", "Falso"], 1);
  await q(lessons[0], 2, "completar", ["fotosíntesis", "la fotosintesis"]);
  await q(lessons[0], 3, "ordenar", ["Leer", "Pensar", "Responder"]);
  await q(lessons[0], 4, "relacionar", ["Sol", "Luna"], 0, { right: ["Día", "Noche"] });
  await q(lessons[1], 1, "opcion", ["A", "B", "C", "D"], 2);
  await q(lessons[2], 1, "opcion", ["A", "B"], 0);
}

beforeEach(async () => {
  h = await makeDb();
  await h.addUser(S, { display_name: "Luna" });
});

describe("cursos que ya existían", () => {
  it("quedan con un Módulo 1 con su Guardián y todas sus lecciones", async () => {
    const mods = (await h.db.query<{ title: string; guardian: string; n: number }>(
      `select mo.title, mo.guardian, (select count(*)::int from public.missions mi where mi.module_id = mo.id) as n
         from public.modules mo where mo.course_slug = 'primer-portal'`)).rows;
    expect(mods).toEqual([{ title: "Módulo 1", guardian: "petrox", n: 4 }]);
    expect(await one("select count(*)::int as r from public.missions where course_slug = 'primer-portal' and module_id is null")).toBe(0);
  });
});

describe("actividades", () => {
  beforeEach(setup);

  it("verdadero/falso se revisa como una opción", async () => {
    expect(await answer(lessons[0], 0, 1)).toMatchObject({ correct: true, correct_index: 1 });
  });

  it("completar acepta mayúsculas, tildes y espacios de más, y devuelve la solución", async () => {
    const r = await answer<{ correct: boolean; solution: string }>(lessons[0], 1, "  FOTOSINTESIS ");
    expect(r).toMatchObject({ correct: true, solution: "fotosíntesis" });
    await h.db.query("update public.attempts set answers[2] = -1 where user_id = $1", [S]);
    expect(await answer(lessons[0], 1, "respiración")).toMatchObject({ correct: false });
    await expect(answer(lessons[0], 1, 5)).rejects.toThrow(/respuesta_invalida/);
  });

  it("ordenar y relacionar se revisan completos", async () => {
    expect(await answer(lessons[0], 2, ["Pensar", "Leer", "Responder"])).toMatchObject({ correct: false, solution: ["Leer", "Pensar", "Responder"] });
    expect(await answer(lessons[0], 3, ["Día", "Noche"])).toMatchObject({ correct: true, solution: { left: ["Sol", "Luna"], right: ["Día", "Noche"] } });
    await expect(answer(lessons[0], 2, ["Leer"])).rejects.toThrow(/respuesta_invalida/);
  });

  it("la nota cuenta las actividades bien hechas", async () => {
    await answer(lessons[0], 0, 1);
    await answer(lessons[0], 1, "fotosintesis");
    await answer(lessons[0], 2, ["Leer", "Pensar", "Responder"]);
    await answer(lessons[0], 3, ["Noche", "Día"]);
    const r = await one<{ score: number }>("select public.finish_attempt($1, $2, 70, '{}') as r", [S, lessons[0]]);
    expect(r.score).toBe(75);
  });

  it("con el Escudo de Calma no se muestra la solución", async () => {
    await h.db.query("insert into public.consumables (user_id, item_id, quantity) values ($1, 'obj_poder_escudo', 2)", [S]);
    await h.db.query("select public.use_power($1, $2, 2, 'obj_poder_escudo', 5, 0)", [S, lessons[0]]);
    const r = await answer<{ shielded: boolean; solution?: unknown }>(lessons[0], 2, ["Responder", "Pensar", "Leer"]);
    expect(r.shielded).toBe(true);
    expect(r.solution).toBeUndefined();
  });

  it("el 50/50 solo sirve en selección múltiple; Kuro da la pista sin quitar opciones; la Sombra no aplica", async () => {
    await h.db.query("insert into public.consumables (user_id, item_id, quantity) values ($1, 'obj_ayuda_5050', 3), ($1, 'obj_poder_kuro', 3)", [S]);
    const vf = await one<string>("select id as r from public.questions where mission_id = $1 and position = 1", [lessons[0]]);
    await expect(h.db.query("select public.use_aid($1, $2, 'obj_ayuda_5050', 5, 0)", [S, vf])).rejects.toThrow(/no_aplica/);
    expect(await one("select public.use_power($1, $2, 2, 'obj_poder_kuro', 5, 0) as r", [S, lessons[0]])).toMatchObject({ hint: "Una pista", removed: [] });
    await h.db.query("insert into public.inventory (user_id, item_id) values ($1, 'obj_poder_sombra')", [S]);
    await expect(h.db.query("select public.use_power($1, $2, 1, 'obj_poder_sombra', 5, 0)", [S, lessons[0]])).rejects.toThrow(/no_aplica/);
  });
});

describe("un jefe por módulo", () => {
  beforeEach(setup);

  it("el jefe de un módulo da su premio, pero el curso solo queda vencido con el último", async () => {
    await h.db.query("select public.complete_mission($1, $2, 100, 70)", [S, lessons[0]]);
    const r = await one<{ boss_defeated: boolean; gems_gain: number }>("select public.complete_mission($1, $2, 100, 70) as r", [S, lessons[1]]);
    expect(r).toMatchObject({ boss_defeated: true, gems_gain: 5 });
    expect(await one("select count(*)::int as r from public.boss_defeats where user_id = $1", [S])).toBe(0);
    await h.db.query("select public.complete_mission($1, $2, 100, 70)", [S, lessons[2]]);
    expect(await one("select count(*)::int as r from public.boss_defeats where user_id = $1 and course_slug = $2", [S, C])).toBe(1);
  });

  it("renumber_course ordena las lecciones por módulo", async () => {
    // Una lección nueva del módulo 1 creada al final del curso pasa a ser la 3.
    const extra = await one<string>("insert into public.missions (course_slug, position, title, module_id) values ($1, 99, 'Extra', $2) returning id as r", [C, mod1]);
    await h.db.query("select public.renumber_course($1)", [C]);
    const order = (await h.db.query<{ title: string; position: number }>("select title, position from public.missions where course_slug = $1 order by position", [C])).rows;
    expect(order.map((o) => o.title)).toEqual(["L1", "L2", "Extra", "L3"]);
    expect(await one("select position as r from public.missions where id = $1", [extra])).toBe(3);
    // Mover el módulo 2 antes del 1.
    await h.db.query("update public.modules set position = 0 where id = $1", [mod2]);
    await h.db.query("select public.renumber_course($1)", [C]);
    expect((await h.db.query<{ title: string }>("select title from public.missions where course_slug = $1 order by position", [C])).rows.map((o) => o.title)).toEqual(["L3", "L1", "L2", "Extra"]);
    expect((await h.db.query<{ position: number }>("select position from public.modules where course_slug = $1 order by position", [C])).rows.map((o) => o.position)).toEqual([1, 2]);
  });
});

describe("cursos gratis", () => {
  it("dan acceso completo a cualquiera y no se pueden cobrar", async () => {
    await h.db.query("update public.courses set price_cop = 25000 where slug = 'portal-del-primer-intento'");
    expect(await one("select public.has_course_access($1, 'portal-del-primer-intento') as r", [S])).toBe(false);
    await h.db.query("update public.courses set is_free = true where slug = 'portal-del-primer-intento'");
    expect(await one("select public.has_course_access($1, 'portal-del-primer-intento') as r", [S])).toBe(true);
    await expect(h.db.query("select public.start_payment($1, null, 'portal-del-primer-intento', 'wompi')", [S])).rejects.toThrow(/ya_tiene_acceso/);
  });
});

describe("seguridad", () => {
  it("las funciones nuevas son solo del servidor", async () => {
    for (const role of ["anon", "authenticated"] as const) {
      await expect(h.as(role, S, "select public.answer_activity($1, gen_random_uuid(), 0, '1')", [S])).rejects.toThrow(/permission denied/);
      await expect(h.as(role, S, "select public.renumber_course('primer-portal')")).rejects.toThrow(/permission denied/);
    }
  });
});
