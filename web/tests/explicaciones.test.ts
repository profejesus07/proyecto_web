import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// Lecciones de explicación, muestra gratis hasta el primer reto y horas de las clases.
const S = "abababab-0000-0000-0000-000000000001";
const C = "curso-con-explicacion";

type H = Awaited<ReturnType<typeof makeDb>>;
let h: H;
const one = async <R>(sql: string, params: unknown[] = []) => (await h.db.query<{ r: R }>(sql, params)).rows[0].r;
let lessons: string[];

beforeEach(async () => {
  h = await makeDb();
  await h.addUser(S, { display_name: "Sol" });
  await h.db.query(`insert into public.courses (slug, title, summary, element, guardian, position, published, kind, price_cop)
                    values ($1, 'Curso con explicación', 'x', 'luz', 'petrox', 60, true, 'curso', 20000)`, [C]);
  const mod = await one<string>("insert into public.modules (course_slug, position, title, guardian) values ($1, 1, 'Uno', 'petrox') returning id as r", [C]);
  lessons = [];
  for (const [pos, kind, boss] of [[1, "explicacion", false], [2, "reto", false], [3, "reto", true]] as const) {
    lessons.push(await one("insert into public.missions (course_slug, position, title, kind, body, is_boss, module_id, xp_reward) values ($1, $2, $3, $4, $5, $6, $7, 20) returning id as r",
      [C, pos, `L${pos}`, kind, kind === "explicacion" ? "Un texto para leer con calma." : "", boss, mod]));
  }
  for (const m of lessons.slice(1)) {
    await h.db.query("insert into public.questions (mission_id, position, prompt, options, correct_index) values ($1, 1, '¿Sí?', '[\"sí\",\"no\"]'::jsonb, 0)", [m]);
  }
});

describe("lecciones de explicación", () => {
  it("se completan al leerlas, dan su XP y desbloquean el reto", async () => {
    const r = await one<{ passed: boolean; first: boolean; xp_gain: number }>("select public.complete_reading($1, $2) as r", [S, lessons[0]]);
    expect(r).toMatchObject({ passed: true, first: true, xp_gain: 20 });
    expect(await one("select public.mission_is_locked($1, $2) as r", [S, lessons[1]])).toBe(false);
    // Leerla otra vez no vuelve a dar premio.
    expect(await one<{ first: boolean; xp_gain: number }>("select public.complete_reading($1, $2) as r", [S, lessons[0]])).toMatchObject({ first: false, xp_gain: 0 });
  });

  it("solo sirve para explicaciones; un reto no se salta así", async () => {
    await h.db.query("select public.complete_reading($1, $2)", [S, lessons[0]]);
    await expect(h.db.query("select public.complete_reading($1, $2)", [S, lessons[1]])).rejects.toThrow(/no_es_explicacion/);
  });

  it("una explicación no puede ser jefe y el video debe ser https", async () => {
    await expect(h.db.query("update public.missions set is_boss = true where id = $1", [lessons[0]])).rejects.toThrow(/missions_explicacion_no_jefe/);
    await expect(h.db.query("update public.missions set video_url = 'http://x.com/v' where id = $1", [lessons[0]])).rejects.toThrow(/missions_video_check/);
  });

  it("la muestra gratis llega hasta el primer reto; después se pide el curso", async () => {
    expect(await one("select public.free_until($1) as r", [C])).toBe(2);
    await h.db.query("select public.complete_reading($1, $2)", [S, lessons[0]]);
    await h.db.query("select public.complete_mission($1, $2, 100, 70)", [S, lessons[1]]);
    await expect(h.db.query("select public.mission_is_locked($1, $2)", [S, lessons[2]])).rejects.toThrow(/requiere_suscripcion/);
  });

  it("es solo del servidor", async () => {
    for (const role of ["anon", "authenticated"] as const) {
      await expect(h.as(role, S, "select public.complete_reading($1, gen_random_uuid())", [S])).rejects.toThrow(/permission denied/);
    }
  });
});

describe("horas", () => {
  it("un curso corto dura menos de 160 horas; una clase puede tener hasta 2000", async () => {
    await expect(h.db.query("update public.courses set hours = 160 where slug = $1", [C])).rejects.toThrow(/courses_hours_check/);
    await h.db.query("update public.courses set hours = 159 where slug = $1", [C]);
    await h.db.query(`insert into public.courses (slug, title, summary, element, guardian, position, published, kind, hours)
                      values ('clase-x', 'Clase', 'x', 'luz', 'petrox', 61, false, 'clase', 1200)`);
    await expect(h.db.query("update public.courses set hours = 2001 where slug = 'clase-x'")).rejects.toThrow(/courses_hours_check/);
  });
});
