import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// Intentos: cada respuesta se revisa en el servidor al momento, queda fija y la nota sale de lo guardado.
const U = "77777777-7777-7777-7777-777777777777";

type H = Awaited<ReturnType<typeof makeDb>>;
let h: H;
let m1: { id: string; keys: number[] };
let boss: { id: string; keys: number[] };

type Ans = { index: number; choice: number; correct: boolean; correct_index: number; explanation: string; answered: number; right: number; total: number };
const answer = async (mission: string, index: number, choice: number) =>
  (await h.db.query<{ r: Ans }>("select public.answer_question($1, $2, $3, $4) as r", [U, mission, index, choice])).rows[0].r;
const finish = async (mission: string, items: string[] = []) =>
  (await h.db.query<{ r: { passed: boolean; first: boolean; score: number; xp_gain: number; answers: number[] } }>(
    "select public.finish_attempt($1, $2, 70, $3::text[]) as r", [U, mission, `{${items.join(",")}}`])).rows[0].r;

async function mission(pos: number) {
  const r = await h.db.query<{ id: string; keys: number[] }>(`
    select m.id, array_agg(q.correct_index order by q.position) keys
      from public.missions m join public.questions q on q.mission_id = m.id
     where m.course_slug = 'primer-portal' and m.position = $1 group by m.id`, [pos]);
  return r.rows[0];
}

beforeEach(async () => {
  h = await makeDb();
  await h.addUser(U);
  m1 = await mission(1);
  boss = await mission(4);
});

describe("answer_question", () => {
  it("dice al momento si acertó, cuál era la correcta y por qué", async () => {
    const ok = await answer(m1.id, 0, m1.keys[0]);
    expect(ok).toMatchObject({ index: 0, correct: true, correct_index: m1.keys[0], answered: 1, right: 1, total: 4 });
    expect(ok.explanation.length).toBeGreaterThan(10);
    const wrong = (m1.keys[1] + 1) % 4;
    expect(await answer(m1.id, 1, wrong)).toMatchObject({ correct: false, choice: wrong, correct_index: m1.keys[1], answered: 2, right: 1 });
  });

  it("la primera respuesta queda fija: no se puede cambiar tras ver la correcta", async () => {
    const wrong = (m1.keys[0] + 1) % 4;
    await answer(m1.id, 0, wrong);
    expect(await answer(m1.id, 0, m1.keys[0])).toMatchObject({ choice: wrong, correct: false, right: 0 });
  });

  it("rechaza preguntas u opciones que no existen", async () => {
    await expect(answer(m1.id, 4, 0)).rejects.toThrow(/pregunta_invalida/);
    await expect(answer(m1.id, -1, 0)).rejects.toThrow(/pregunta_invalida/);
    await expect(answer(m1.id, 0, 4)).rejects.toThrow(/respuesta_invalida/);
  });

  it("no deja responder misiones bloqueadas", async () => {
    await expect(answer(boss.id, 0, 0)).rejects.toThrow(/mision_bloqueada/);
  });

  it("solo el servidor puede usarla", async () => {
    await expect(h.as("authenticated", U, "select public.answer_question($1, $2, 0, 0)", [U, m1.id])).rejects.toThrow(/permission denied/);
    await expect(h.as("authenticated", U, "select public.finish_attempt($1, $2, 70, '{}')", [U, m1.id])).rejects.toThrow(/permission denied/);
  });
});

describe("finish_attempt", () => {
  it("la nota sale de las respuestas guardadas y registra el resultado", async () => {
    for (let i = 0; i < 4; i++) await answer(m1.id, i, i === 3 ? (m1.keys[3] + 1) % 4 : m1.keys[i]);
    const r = await finish(m1.id, ["obj_insignia_primera_mision"]);
    expect(r).toMatchObject({ passed: true, first: true, score: 75, xp_gain: 60 });
    expect(r.answers).toHaveLength(4);
  });

  it("no se puede terminar sin responder todo, ni sin haber empezado", async () => {
    await expect(finish(m1.id)).rejects.toThrow(/sin_intento/);
    await answer(m1.id, 0, 0);
    await expect(finish(m1.id)).rejects.toThrow(/respuestas_incompletas/);
  });

  it("después de terminar, el siguiente intento empieza de cero", async () => {
    for (let i = 0; i < 4; i++) await answer(m1.id, i, (m1.keys[i] + 1) % 4);
    expect(await finish(m1.id)).toMatchObject({ passed: false, score: 0 });
    expect(await answer(m1.id, 0, m1.keys[0])).toMatchObject({ correct: true, answered: 1, right: 1 });
    await expect(finish(m1.id)).rejects.toThrow(/respuestas_incompletas/);
  });

  it("cada estudiante ve solo sus intentos", async () => {
    await answer(m1.id, 0, 0);
    expect((await h.as("authenticated", U, "select * from public.attempts")).rows).toHaveLength(1);
    expect((await h.as("authenticated", "88888888-8888-8888-8888-888888888888", "select * from public.attempts")).rows).toHaveLength(0);
  });
});
