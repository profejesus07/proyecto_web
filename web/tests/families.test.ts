import { beforeEach, describe, expect, it } from "vitest";
import { homePath } from "@/lib/roles";
import { makeDb } from "./helpers/pg";

// Panel de familias: el estudiante comparte un código; la familia ve su avance, solo para leer.
const F = "cccccccc-0000-0000-0000-000000000001"; // familia
const F2 = "cccccccc-0000-0000-0000-000000000002";
const S = "bbbbbbbb-0000-0000-0000-000000000001"; // estudiante
const S2 = "bbbbbbbb-0000-0000-0000-000000000002";
const T = "aaaaaaaa-0000-0000-0000-000000000001"; // docente

type H = Awaited<ReturnType<typeof makeDb>>;
let h: H;
const one = async <R>(sql: string, params: unknown[]) => (await h.db.query<{ r: R }>(sql, params)).rows[0].r;
const code = (s: string, renew = false) => one<string>("select public.family_code($1, $2) as r", [s, renew]);
const link = (f: string, c: string) => one<{ id: string; name: string }>("select public.link_family($1, $2) as r", [f, c]);
type Child = {
  name: string; xp: number; avatar: string; week_attempts: number;
  courses: { slug: string; total: number; lessons: { position: number; completed: boolean; best_score: number }[] }[];
  classes: { name: string; teacher: string }[]; certificates: unknown[];
};
const overview = (f: string) => one<Child[]>("select public.family_overview($1) as r", [f]);

beforeEach(async () => {
  h = await makeDb();
  await h.addUser(F, { role: "familia", display_name: "Mamá de Luna" });
  await h.addUser(F2, { role: "familia", display_name: "Abuelo" });
  await h.addUser(S, { role: "estudiante", display_name: "Luna" });
  await h.addUser(S2, { role: "estudiante", display_name: "Sol" });
  await h.addUser(T, { display_name: "Profe Ana" }, { role: "docente" });
});

describe("family_code", () => {
  it("solo los estudiantes tienen código; es estable hasta que se renueva", async () => {
    const c = await code(S);
    expect(c).toMatch(/^[A-Z2-9]{8}$/);
    expect(await code(S)).toBe(c);
    const c2 = await code(S, true);
    expect(c2).not.toBe(c);
    await expect(code(F)).rejects.toThrow(/solo_estudiantes/);
    await expect(code(T)).rejects.toThrow(/solo_estudiantes/);
  });
});

describe("link_family", () => {
  it("la familia se vincula con el código, sin importar espacios o minúsculas", async () => {
    const c = await code(S);
    expect(await link(F, ` ${c.slice(0, 4).toLowerCase()}-${c.slice(4)} `)).toMatchObject({ id: S, name: "Luna" });
    const fams = await one<{ name: string }[]>("select public.student_families($1) as r", [S]);
    expect(fams.map((x) => x.name)).toEqual(["Mamá de Luna"]);
  });

  it("un código renovado deja de servir y solo las familias pueden vincularse", async () => {
    const old = await code(S);
    await code(S, true);
    await expect(link(F, old)).rejects.toThrow(/codigo_invalido/);
    await expect(link(S2, await code(S))).rejects.toThrow(/solo_familias/);
    await expect(link(T, await code(S))).rejects.toThrow(/solo_familias/);
  });

  it("limita cuántas familias puede tener un estudiante", async () => {
    const c = await code(S);
    for (let i = 0; i < 4; i++) {
      const id = `dddddddd-0000-0000-0000-00000000000${i}`;
      await h.addUser(id, { role: "familia", display_name: `Familia ${i}` });
      await link(id, c);
    }
    await expect(link(F, c)).rejects.toThrow(/demasiadas_familias/);
  });
});

describe("unlink_family", () => {
  it("cualquiera de los dos puede desvincularse; un tercero no", async () => {
    await link(F, await code(S));
    await link(F2, await code(S));
    await expect(h.db.query("select public.unlink_family($1, $2, $3)", [S2, F, S])).rejects.toThrow(/no_autorizado/);
    await h.db.query("select public.unlink_family($1, $2, $3)", [S, F, S]); // lo hace el estudiante
    await h.db.query("select public.unlink_family($1, $2, $3)", [F2, F2, S]); // lo hace la familia
    expect(await overview(F)).toEqual([]);
    expect(await one("select public.student_families($1) as r", [S])).toEqual([]);
    // Con el código se puede volver a vincular.
    await link(F, await code(S));
    expect((await overview(F)).map((c) => c.name)).toEqual(["Luna"]);
  });
});

describe("family_overview", () => {
  it("muestra avance, clases y constancias, sin correo ni respuestas", async () => {
    await link(F, await code(S));
    const m1 = (await h.db.query<{ id: string }>("select id from public.missions where course_slug = 'primer-portal' and position = 1")).rows[0].id;
    const keys = (await h.db.query<{ correct_index: number }>("select correct_index from public.questions where mission_id = $1 order by position", [m1])).rows.map((r) => r.correct_index);
    for (let i = 0; i < keys.length; i++) await h.db.query("select public.answer_question($1, $2, $3, $4)", [S, m1, i, keys[i]]);
    await h.db.query("select public.finish_attempt($1, $2, 70, '{}')", [S, m1]);
    const cls = await one<{ code: string }>("select public.create_class($1, 'Ciencias 6.º') as r", [T]);
    await h.db.query("select public.join_class($1, $2)", [S, cls.code]);

    const [child] = await overview(F);
    expect(child).toMatchObject({ name: "Luna", avatar: "aria", week_attempts: 1 });
    expect(child.xp).toBeGreaterThan(0);
    expect(child.courses).toHaveLength(1);
    expect(child.courses[0]).toMatchObject({ slug: "primer-portal", total: 4 });
    expect(child.courses[0].lessons).toEqual([expect.objectContaining({ position: 1, completed: true, best_score: 100 })]);
    expect(child.classes).toEqual([{ name: "Ciencias 6.º", teacher: "Profe Ana" }]);
    const text = JSON.stringify(child);
    expect(text).not.toMatch(/@prueba\.co|answers|correct_index/);
  });

  it("incluye la decoración que el estudiante le regaló a la terraza (solo decoración)", async () => {
    await link(F, await code(S));
    await h.db.query("insert into public.inventory (user_id, item_id) values ($1, 'obj_decoracion_farol'), ($1, 'obj_cosmetico_capa_hojas'), ($1, 'objXdecoracionXx')", [S]);
    const [child] = await overview(F);
    expect((child as unknown as { decor: string[] }).decor).toEqual(["obj_decoracion_farol"]);
  });

  it("una familia no ve a estudiantes que no le dieron su código", async () => {
    await link(F, await code(S));
    expect((await overview(F)).map((c) => c.name)).toEqual(["Luna"]);
    expect(await overview(F2)).toEqual([]);
    await expect(overview(S)).rejects.toThrow(/solo_familias/);
  });

  it("los clientes no pueden llamar las funciones ni leer las tablas", async () => {
    await link(F, await code(S));
    await expect(h.as("authenticated", F, "select public.family_overview($1)", [F])).rejects.toThrow(/permission denied/);
    await expect(h.as("authenticated", S, "select public.family_code($1, false)", [S])).rejects.toThrow(/permission denied/);
    await expect(h.as("authenticated", F, "select * from public.family_links")).rejects.toThrow(/permission denied/);
    await expect(h.as("anon", null, "select * from public.family_codes")).rejects.toThrow(/permission denied/);
  });
});

describe("mensajes de la familia", () => {
  const send = (f: string, st: string, m: string) => one<{ remaining: number }>("select public.send_family_message($1, $2, $3) as r", [f, st, m]);
  const inbox = (st: string) => one<{ message: string; from: string; guide: string | null }[]>("select public.student_messages($1) as r", [st]);

  it("una familia vinculada envía frases fijas y el estudiante las ve con su Guardián", async () => {
    await link(F, await code(S));
    await h.db.query(`update public.profiles set avatar = '{"base":"aria","look":{"guide":"abuela-amara"}}'::jsonb where id = $1`, [F]);
    expect(await send(F, S, "orgullo")).toEqual({ remaining: 4 });
    const msgs = await inbox(S);
    expect(msgs).toEqual([expect.objectContaining({ message: "orgullo", from: "Mamá de Luna", guide: "abuela-amara" })]);
    await h.db.query("select public.read_family_messages($1)", [S]);
    expect(await inbox(S)).toEqual([]);
  });

  it("sin vínculo no se puede, ni con texto libre, y hay un máximo diario", async () => {
    await expect(send(F, S, "orgullo")).rejects.toThrow(/no_vinculado/);
    await link(F, await code(S));
    await expect(send(F, S, "Hola <b>")).rejects.toThrow(/mensaje_invalido/);
    for (let i = 0; i < 5; i++) await send(F, S, "animo");
    await expect(send(F, S, "animo")).rejects.toThrow(/demasiados_mensajes/);
    expect(await one<Record<string, number>>("select public.family_messages_left($1) as r", [F])).toEqual({ [S]: 0 });
  });

  it("al desvincularse, sus mensajes dejan de verse y no puede enviar más", async () => {
    await link(F, await code(S));
    await send(F, S, "carino");
    await h.db.query("select public.unlink_family($1, $2, $3)", [S, F, S]);
    expect(await inbox(S)).toEqual([]);
    await expect(send(F, S, "carino")).rejects.toThrow(/no_vinculado/);
    await expect(h.as("authenticated", F, "select public.send_family_message($1, $2, 'animo')", [F, S])).rejects.toThrow(/permission denied/);
  });
});

describe("inicio según el rol", () => {
  it("la familia entra directo a «Mi familia»; los demás, al Gremio", () => {
    expect(homePath("familia")).toBe("/familia");
    expect(homePath("estudiante")).toBe("/gremio");
    expect(homePath("docente")).toBe("/gremio");
    expect(homePath("admin")).toBe("/gremio");
  });
});
