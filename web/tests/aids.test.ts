import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// Ayudas consumibles (Pista y 50/50) dentro de la base de datos: compra, cobro, gratis, topes y lo que revelan.
const U = "55555555-5555-5555-5555-555555555555";
const V = "66666666-6666-6666-6666-666666666666";
const PISTA = "obj_ayuda_pista";
const F = "obj_ayuda_5050";

type H = Awaited<ReturnType<typeof makeDb>>;
let h: H;
let qs: { id: string; mission_id: string; mpos: number; correct_index: number; hint: string; n: number }[];

const q = (mpos: number, i = 0) => qs.filter((x) => x.mpos === mpos)[i];

async function buy(user: string, item: string, price = 20, max = 20) {
  const r = await h.db.query<{ r: { coins: number; quantity: number } }>("select public.buy_consumable($1, $2, $3, $4) as r", [user, item, price, max]);
  return r.rows[0].r;
}
async function use(user: string, question: string, item: string, cap = 10, minXp = 0) {
  const r = await h.db.query<{ r: { hint?: string; removed?: number[]; free: boolean; charged: boolean; left: number } }>(
    "select public.use_aid($1, $2, $3, $4, $5) as r", [user, question, item, cap, minXp]);
  return r.rows[0].r;
}
const coins = async (user: string, n: number) => h.db.query("update public.profiles set coins = $2 where id = $1", [user, n]);

beforeEach(async () => {
  h = await makeDb();
  await h.addUser(U);
  await h.addUser(V);
  const r = await h.db.query<(typeof qs)[number]>(`
    select q.id, q.mission_id, m.position as mpos, q.correct_index, q.hint, jsonb_array_length(q.options) as n
      from public.questions q join public.missions m on m.id = q.mission_id order by m.position, q.position`);
  qs = r.rows;
});

describe("buy_consumable", () => {
  it("se pueden comprar varias unidades y se cobra cada una", async () => {
    await coins(U, 50);
    expect(await buy(U, PISTA)).toEqual({ coins: 30, quantity: 1 });
    expect(await buy(U, PISTA)).toEqual({ coins: 10, quantity: 2 });
    await expect(buy(U, PISTA)).rejects.toThrow(/monedas_insuficientes/);
    const l = await h.db.query("select 1 from public.ledger where user_id = $1 and reason = 'compra'", [U]);
    expect(l.rows).toHaveLength(2);
  });

  it("respeta el máximo de la mochila", async () => {
    await coins(U, 500);
    await buy(U, PISTA, 20, 2);
    await buy(U, PISTA, 20, 2);
    await expect(buy(U, PISTA, 20, 2)).rejects.toThrow(/reserva_llena/);
  });

  it("no se puede llamar desde el navegador", async () => {
    await expect(h.as("authenticated", U, "select public.buy_consumable($1, 'obj_ayuda_pista', 0, 20)", [U])).rejects.toThrow(/permission denied/);
    await expect(h.as("authenticated", U, "select public.use_aid($1, $2, 'obj_ayuda_pista', 10, 0)", [U, q(1).id])).rejects.toThrow(/permission denied/);
  });

  it("cada uno ve solo sus ayudas", async () => {
    await coins(U, 100);
    await buy(U, PISTA);
    expect((await h.as("authenticated", V, "select * from public.consumables")).rows).toHaveLength(0);
    expect((await h.as("authenticated", U, "select * from public.consumables")).rows).toHaveLength(1);
    await expect(h.as("authenticated", U, "update public.consumables set quantity = 99")).rejects.toThrow(/permission denied/);
  });
});

describe("use_aid · Pista", () => {
  it("la primera pista de cada misión es gratis y devuelve el texto", async () => {
    const r = await use(U, q(1, 0).id, PISTA);
    expect(r).toMatchObject({ hint: q(1, 0).hint, free: true, charged: false, left: 0 });
  });

  it("la segunda cuesta una unidad; sin unidades no se puede", async () => {
    await use(U, q(1, 0).id, PISTA);
    await expect(use(U, q(1, 1).id, PISTA)).rejects.toThrow(/sin_unidades/);
    await coins(U, 100);
    await buy(U, PISTA);
    expect(await use(U, q(1, 1).id, PISTA)).toMatchObject({ hint: q(1, 1).hint, free: false, charged: true, left: 0 });
  });

  it("repetirla en la misma pregunta no cobra otra vez", async () => {
    await coins(U, 100);
    await buy(U, PISTA);
    await use(U, q(1, 0).id, PISTA);
    await use(U, q(1, 1).id, PISTA);
    expect(await use(U, q(1, 1).id, PISTA)).toMatchObject({ charged: false, free: false, left: 0, hint: q(1, 1).hint });
    expect(await use(U, q(1, 0).id, PISTA)).toMatchObject({ charged: false, free: true });
  });

  it("respeta el tope diario de unidades pagadas", async () => {
    await coins(U, 500);
    for (let i = 0; i < 4; i++) await buy(U, PISTA);
    await use(U, q(1, 0).id, PISTA); // gratis
    await use(U, q(1, 1).id, PISTA, 2);
    await use(U, q(1, 2).id, PISTA, 2);
    await expect(use(U, q(1, 3).id, PISTA, 2)).rejects.toThrow(/tope_diario/);
    const c = await h.db.query<{ quantity: number }>("select quantity from public.consumables where user_id = $1", [U]);
    expect(c.rows[0].quantity).toBe(2);
  });

  it("no sirve en misiones bloqueadas", async () => {
    await expect(use(U, q(2, 0).id, PISTA)).rejects.toThrow(/mision_bloqueada/);
  });
});

describe("use_aid · 50/50", () => {
  it("quita la mitad de las incorrectas y nunca la correcta", async () => {
    await coins(U, 500);
    for (const x of qs.filter((x) => x.mpos === 1)) {
      await buy(U, F, 60);
      const r = await use(U, x.id, F);
      const wrong = x.n - 1;
      expect(r.removed).toHaveLength(Math.min(Math.ceil(wrong / 2), wrong - 1));
      expect(r.removed).not.toContain(x.correct_index);
      expect(new Set(r.removed).size).toBe(r.removed!.length);
      for (const i of r.removed!) expect(i >= 0 && i < x.n).toBe(true);
      expect(r).toMatchObject({ charged: true, free: false });
    }
  });

  it("nunca es gratis y exige el rango", async () => {
    await expect(use(U, q(1).id, F, 5, 150)).rejects.toThrow(/rango_insuficiente/);
    await expect(use(U, q(1).id, F, 5, 0)).rejects.toThrow(/sin_unidades/);
  });

  it("repetirlo devuelve las mismas opciones sin cobrar", async () => {
    await coins(U, 500);
    await buy(U, F, 60);
    await buy(U, F, 60);
    const a = await use(U, q(1).id, F);
    const b = await use(U, q(1).id, F);
    expect(b.removed).toEqual(a.removed);
    expect(b).toMatchObject({ charged: false, left: 1 });
  });

  it("rechaza objetos que no son ayudas", async () => {
    await expect(use(U, q(1).id, "obj_poder_rayo")).rejects.toThrow(/ayuda_invalida/);
  });
});
