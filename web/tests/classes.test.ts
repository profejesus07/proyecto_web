import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// Clases del Maestro del Gremio: crear, unirse con código y ver el informe solo de las propias clases.
const T = "aaaaaaaa-0000-0000-0000-000000000001"; // docente
const T2 = "aaaaaaaa-0000-0000-0000-000000000002"; // otra docente
const S = "bbbbbbbb-0000-0000-0000-000000000001"; // estudiante
const S2 = "bbbbbbbb-0000-0000-0000-000000000002";

type H = Awaited<ReturnType<typeof makeDb>>;
let h: H;
const call = async <T = Record<string, unknown>>(sql: string, params: unknown[]) => (await h.db.query<{ r: T }>(sql, params)).rows[0]?.r;
const create = (teacher: string, name: string) => call<{ id: string; name: string; code: string }>("select public.create_class($1, $2) as r", [teacher, name]);
const join = (student: string, code: string) => call<{ id: string; name: string }>("select public.join_class($1, $2) as r", [student, code]);
const report = (teacher: string, cls: string) => call<{
  class: { name: string; code: string };
  students: { id: string; name: string; xp: number; progress: { mission_id: string; completed: boolean }[] }[];
  questions: { mission_id: string; position: number; answered: number; right: number }[];
}>("select public.class_report($1, $2) as r", [teacher, cls]);

beforeEach(async () => {
  h = await makeDb();
  await h.addUser(T, { role: "docente", display_name: "Profe Ana" });
  await h.addUser(T2, { role: "docente", display_name: "Profe Beto" });
  await h.addUser(S, { role: "estudiante", display_name: "Luna" });
  await h.addUser(S2, { role: "estudiante", display_name: "Sol" });
});

describe("create_class", () => {
  it("solo un docente crea clases y recibe un código legible", async () => {
    const c = await create(T, "  6.º B  ");
    expect(c.name).toBe("6.º B");
    expect(c.code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    await expect(create(S, "Mi clase")).rejects.toThrow(/solo_docentes/);
    await expect(create(T, "x")).rejects.toThrow(/nombre_invalido/);
  });
});

describe("join_class", () => {
  it("el estudiante se une con el código, sin importar mayúsculas ni espacios", async () => {
    const c = await create(T, "6.º B");
    expect(await join(S, ` ${c.code.toLowerCase().slice(0, 3)}-${c.code.toLowerCase().slice(3)} `)).toMatchObject({ id: c.id, name: "6.º B" });
    await join(S, c.code); // repetir no duplica
    const n = await h.db.query("select 1 from public.class_members where class_id = $1", [c.id]);
    expect(n.rows).toHaveLength(1);
  });

  it("rechaza códigos falsos, clases archivadas y a quien no es estudiante", async () => {
    const c = await create(T, "6.º B");
    await expect(join(S, "ZZZZZZ")).rejects.toThrow(/codigo_invalido/);
    await expect(join(T2, c.code)).rejects.toThrow(/solo_estudiantes/);
    await call("select public.manage_class($1, $2, 'archivar') as r", [T, c.id]);
    await expect(join(S, c.code)).rejects.toThrow(/codigo_invalido/);
  });

  it("un código nuevo invalida el anterior", async () => {
    const c = await create(T, "6.º B");
    const r = await call<{ code: string }>("select public.manage_class($1, $2, 'nuevo_codigo') as r", [T, c.id]);
    expect(r.code).not.toBe(c.code);
    await expect(join(S, c.code)).rejects.toThrow(/codigo_invalido/);
    await expect(join(S, r.code)).resolves.toMatchObject({ id: c.id });
  });

  it("el estudiante puede salir de la clase", async () => {
    const c = await create(T, "6.º B");
    await join(S, c.code);
    await h.db.query("select public.leave_class($1, $2)", [S, c.id]);
    expect((await report(T, c.id)).students).toHaveLength(0);
  });
});

describe("class_report", () => {
  it("muestra a los estudiantes con su avance y los aciertos por pregunta", async () => {
    const c = await create(T, "6.º B");
    await join(S, c.code);
    await join(S2, c.code);
    const m1 = (await h.db.query<{ id: string }>("select id from public.missions where course_slug = 'primer-portal' and position = 1")).rows[0].id;
    const keys = (await h.db.query<{ correct_index: number }>("select correct_index from public.questions where mission_id = $1 order by position", [m1])).rows.map((r) => r.correct_index);
    // Luna acierta todo; Sol falla la primera.
    for (let i = 0; i < 4; i++) await h.db.query("select public.answer_question($1, $2, $3, $4)", [S, m1, i, keys[i]]);
    await h.db.query("select public.finish_attempt($1, $2, 70, '{}')", [S, m1]);
    for (let i = 0; i < 4; i++) await h.db.query("select public.answer_question($1, $2, $3, $4)", [S2, m1, i, i === 0 ? (keys[0] + 1) % 4 : keys[i]]);
    await h.db.query("select public.finish_attempt($1, $2, 70, '{}')", [S2, m1]);

    const r = await report(T, c.id);
    expect(r.class).toMatchObject({ name: "6.º B", code: c.code });
    expect(r.students.map((s) => s.name)).toEqual(["Luna", "Sol"]);
    expect(r.students[0]).toMatchObject({ xp: 60 });
    expect(r.students[0].progress).toEqual([expect.objectContaining({ mission_id: m1, completed: true })]);
    const q1 = r.questions.find((q) => q.mission_id === m1 && q.position === 1);
    const q2 = r.questions.find((q) => q.mission_id === m1 && q.position === 2);
    expect(q1).toMatchObject({ answered: 2, right: 1 });
    expect(q2).toMatchObject({ answered: 2, right: 2 });
  });

  it("otra docente no puede ver ni tocar la clase", async () => {
    const c = await create(T, "6.º B");
    await expect(report(T2, c.id)).rejects.toThrow(/clase_no_encontrada/);
    await expect(call("select public.manage_class($1, $2, 'nuevo_codigo') as r", [T2, c.id])).rejects.toThrow(/clase_no_encontrada/);
  });

  it("el informe no incluye el correo ni datos de acceso", async () => {
    const c = await create(T, "6.º B");
    await join(S, c.code);
    const s = (await report(T, c.id)).students[0];
    expect(Object.keys(s).sort()).toEqual(["avatar", "id", "joined_at", "last_active", "name", "progress", "streak", "xp"]);
  });

  it("nada de esto se puede llamar desde el navegador, y cada uno ve solo lo suyo", async () => {
    const c = await create(T, "6.º B");
    await join(S, c.code);
    await expect(h.as("authenticated", T, "select public.class_report($1, $2)", [T, c.id])).rejects.toThrow(/permission denied/);
    await expect(h.as("authenticated", S, "select public.join_class($1, 'ABCDEF')", [S])).rejects.toThrow(/permission denied/);
    expect((await h.as("authenticated", T2, "select * from public.classes")).rows).toHaveLength(0);
    expect((await h.as("authenticated", S2, "select * from public.class_members")).rows).toHaveLength(0);
    expect((await h.as("authenticated", S, "select * from public.class_members")).rows).toHaveLength(1);
  });
});
