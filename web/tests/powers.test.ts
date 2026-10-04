import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// Poderes: cada uno con su efecto real, decidido en la base de datos.
const S = "bbbbbbbb-0000-0000-0000-000000000001";
type H = Awaited<ReturnType<typeof makeDb>>;
let h: H;
let m1: string;
let keys: number[];
let qids: string[];

const one = async <R>(sql: string, params: unknown[]) => (await h.db.query<{ r: R }>(sql, params)).rows[0].r;
const power = <R = Record<string, unknown>>(item: string, index: number, cap = 5, minXp = 0) =>
  one<R>("select public.use_power($1, $2, $3, $4, $5, $6) as r", [S, m1, index, `obj_poder_${item}`, cap, minXp]);
const answer = (index: number, choice: number) =>
  one<{ correct: boolean; shielded?: boolean; correct_index?: number; bonus_xp?: number }>("select public.answer_question($1, $2, $3, $4) as r", [S, m1, index, choice]);
const give = (item: string, qty = 3) => h.db.query("insert into public.consumables (user_id, item_id, quantity) values ($1, $2, $3) on conflict (user_id, item_id) do update set quantity = excluded.quantity", [S, `obj_poder_${item}`, qty]);
const wrongOf = (i: number) => (keys[i] + 1) % 4;

beforeEach(async () => {
  h = await makeDb();
  await h.addUser(S, { role: "estudiante", display_name: "Luna" });
  m1 = (await h.db.query<{ id: string }>("select id from public.missions where course_slug = 'primer-portal' and position = 1")).rows[0].id;
  const qs = (await h.db.query<{ id: string; correct_index: number }>("select id, correct_index from public.questions where mission_id = $1 order by position", [m1])).rows;
  keys = qs.map((q) => q.correct_index);
  qids = qs.map((q) => q.id);
});

describe("use_power", () => {
  it("Rayo de Claridad devuelve raíces de palabras compartidas con la pista, sin la respuesta", async () => {
    await give("rayo");
    const r = await power<{ stems: string[]; lead: string | null; charged: boolean; left: number }>("rayo", 0);
    expect(r.charged).toBe(true);
    expect(r.left).toBe(2);
    expect(Array.isArray(r.stems)).toBe(true);
    expect(r.stems.length > 0 || !!r.lead).toBe(true);
    expect(JSON.stringify(r)).not.toMatch(/correct/);
    // Repetirlo en la misma pregunta no cobra otra vez.
    expect(await power<{ charged: boolean }>("rayo", 0)).toMatchObject({ charged: false });
  });

  it("Escudo de Calma: un error no queda fijo ni revela la correcta; el siguiente intento sí cuenta", async () => {
    await give("escudo");
    await power("escudo", 0);
    const shielded = await answer(0, wrongOf(0));
    expect(shielded).toMatchObject({ shielded: true, correct: false });
    expect(shielded.correct_index).toBeUndefined();
    // El escudo se gastó: ahora el error sí queda fijo.
    const fixed = await answer(0, wrongOf(0));
    expect(fixed).toMatchObject({ correct: false, correct_index: keys[0] });
    expect(fixed.shielded).toBeUndefined();
  });

  it("Lluvia de Estrellas da 15 XP si acierta, y nada si falla", async () => {
    await give("lluvia");
    await power("lluvia", 0);
    expect((await answer(0, keys[0])).bonus_xp).toBe(15);
    expect(await one<number>("select xp as r from public.profiles where id = $1", [S])).toBe(15);
    await power("lluvia", 1);
    expect((await answer(1, wrongOf(1))).bonus_xp).toBe(0);
    expect(await one<number>("select xp as r from public.profiles where id = $1", [S])).toBe(15);
  });

  it("Aura de Concentración solo aplica si queda otra pregunta por responder", async () => {
    await give("aura");
    expect(await power<{ charged: boolean }>("aura", 0)).toMatchObject({ charged: true });
    for (let i = 0; i < keys.length - 1; i++) await answer(i, keys[i]);
    await expect(power("aura", keys.length - 1)).rejects.toThrow(/no_aplica/);
    await expect(power("aura", 0)).resolves.toBeTruthy(); // misma pregunta, mismo día: devuelve lo guardado
  });

  it("Invocación de Kuro da la pista y quita una opción incorrecta", async () => {
    await give("kuro");
    const r = await power<{ hint: string | null; removed: number[] }>("kuro", 0, 3);
    expect(r.hint).toBeTruthy();
    expect(r.removed).toHaveLength(1);
    expect(r.removed[0]).not.toBe(keys[0]);
  });

  it("Pulso de Memoria necesita pistas ya vistas en la misión", async () => {
    await give("pulso");
    await expect(power("pulso", 0, 3)).rejects.toThrow(/sin_recuerdos/);
    await h.db.query("insert into public.consumables (user_id, item_id, quantity) values ($1, 'obj_ayuda_pista', 2)", [S]);
    await h.db.query("select public.use_aid($1, $2, 'obj_ayuda_pista', 10, 0)", [S, qids[2]]);
    const r = await power<{ hints: Record<string, string> }>("pulso", 0, 3);
    expect(Object.keys(r.hints)).toEqual([qids[2]]);
    // Al fallar el primer intento no se cobró.
    expect(await one<number>("select quantity as r from public.consumables where user_id = $1 and item_id = 'obj_poder_pulso'", [S])).toBe(2);
  });

  it("Sombra Dorada y Segundo Aliento son de rango S: hay que tenerlos, y no se gastan", async () => {
    await expect(power("sombra", 0)).rejects.toThrow(/no_lo_tienes/);
    await h.db.query("insert into public.inventory (user_id, item_id) values ($1, 'obj_poder_sombra'), ($1, 'obj_poder_aliento')", [S]);
    await expect(power("sombra", 0)).rejects.toThrow(/sin_jugada/);
    // Primer intento completo: acierta la 1 y falla la 2.
    for (let i = 0; i < keys.length; i++) await answer(i, i === 1 ? wrongOf(1) : keys[i]);
    // Segundo Aliento devuelve la pregunta fallada (no una acertada).
    await expect(power("aliento", 0, 1)).rejects.toThrow(/no_aplica/);
    expect(await power("aliento", 1, 1)).toMatchObject({ reset: true });
    expect(await one<number[]>("select answers as r from public.attempts where user_id = $1 and finished_at is null", [S])).toEqual(keys.map((k, i) => (i === 1 ? -1 : k)));
    await expect(power("aliento", 2, 1)).rejects.toThrow(/no_aplica|tope_diario/);
    await answer(1, keys[1]);
    await h.db.query("select public.finish_attempt($1, $2, 70, '{}')", [S, m1]);
    // Nuevo intento: la sombra recuerda la respuesta acertada.
    expect(await power<{ choice: number }>("sombra", 0)).toMatchObject({ choice: keys[0] });
  });

  it("respeta rango mínimo, unidades y tope diario", async () => {
    await expect(power("escudo", 0, 5, 150)).rejects.toThrow(/rango_insuficiente/);
    await expect(power("escudo", 0)).rejects.toThrow(/sin_unidades/);
    await give("escudo", 5);
    await power("escudo", 0, 2);
    await power("escudo", 1, 2);
    await expect(power("escudo", 2, 2)).rejects.toThrow(/tope_diario/);
    await expect(h.db.query("select public.use_power($1, $2, 0, 'obj_ayuda_pista', 5, 0)", [S, m1])).rejects.toThrow(/poder_invalido/);
    await expect(h.as("authenticated", S, "select public.use_power($1, $2, 0, 'obj_poder_escudo', 5, 0)", [S, m1])).rejects.toThrow(/permission denied/);
  });
});
