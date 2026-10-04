import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// Eliminar desde el panel: la función prepara (permisos, copia contable, registro) y el servidor borra.
// Aquí el borrado del servidor se simula con el mismo SQL que haría la llave de servicio.
const ADMIN = "abababab-0000-0000-0000-000000000001";
const T = "abababab-0000-0000-0000-000000000002";
const S = "abababab-0000-0000-0000-000000000003";
const F = "abababab-0000-0000-0000-000000000004";
const COURSE = "portal-del-primer-intento";

type H = Awaited<ReturnType<typeof makeDb>>;
let h: H;
const one = async <R>(sql: string, params: unknown[] = []) => (await h.db.query<{ r: R }>(sql, params)).rows[0].r;
const count = (sql: string, params: unknown[] = []) => one<number>(`select count(*)::int as r from ${sql}`, params);

async function paidCourse() {
  await h.db.query("update public.courses set price_cop = 25000 where slug = $1", [COURSE]);
  const { reference } = await one<{ reference: string }>("select public.start_payment($1, null, $2, 'wompi') as r", [S, COURSE]);
  await h.db.query("select public.settle_payment($1, 'wompi', 'tx', 'aprobado', 25000, 'COP')", [reference]);
  return reference;
}

beforeEach(async () => {
  h = await makeDb();
  await h.addUser(ADMIN, { display_name: "Profe" }, { role: "docente" });
  await h.db.query("update public.profiles set is_admin = true where id = $1", [ADMIN]);
  await h.addUser(T, { display_name: "Profe Ana" }, { role: "docente" });
  await h.addUser(S, { display_name: "Luna" });
  await h.addUser(F, { display_name: "Mamá de Luna", role: "familia" });
});

describe("eliminar un curso", () => {
  it("guarda la copia contable de sus pagos, archiva sus grupos y deja registro; luego se borra todo lo suyo", async () => {
    const ref = await paidCourse();
    const m1 = await one<string>("select id as r from public.missions where course_slug = $1 and position = 1", [COURSE]);
    await h.db.query("insert into public.mission_progress (user_id, mission_id, best_score, attempts) values ($1, $2, 100, 1)", [S, m1]);
    await h.db.query("insert into public.classes (teacher_id, name, code, course_slug) values ($1, 'Grupo 6A', 'ABC234', $2)", [T, COURSE]);

    await expect(one("select public.admin_preparar_eliminar_curso($1, $2) as r", [T, COURSE])).rejects.toThrow(/solo_admin/);
    const r = await one<{ students: number; payments: number; groups: number }>("select public.admin_preparar_eliminar_curso($1, $2) as r", [ADMIN, COURSE]);
    expect(r).toMatchObject({ students: 1, payments: 1, groups: 1 });
    expect(await one("select status as r from public.payments_archive where reference = $1", [ref])).toBe("aprobado");
    expect(await one("select student_name as r from public.payments_archive where reference = $1", [ref])).toBe("Luna");
    expect(await one("select archived_at is not null as r from public.classes where code = 'ABC234'")).toBe(true);
    expect(await one("select action as r from public.admin_log order by id desc limit 1")).toBe("eliminar_curso");

    // Lo que hace el servidor después.
    await h.db.query("delete from public.payments where course_slug = $1", [COURSE]);
    await h.db.query("delete from public.courses where slug = $1", [COURSE]);
    expect(await count("public.missions where course_slug = $1", [COURSE])).toBe(0);
    expect(await count("public.mission_progress where mission_id = $1", [m1])).toBe(0);
    expect(await count("public.course_access where course_slug = $1", [COURSE])).toBe(0);
    expect(await one("select course_slug is null as r from public.classes where code = 'ABC234'")).toBe(true);
    // La copia contable sobrevive.
    expect(await count("public.payments_archive where reference = $1", [ref])).toBe(1);
  });

  it("un curso con pagos no se puede borrar sin pasar por la copia contable", async () => {
    await paidCourse();
    await expect(h.db.query("delete from public.courses where slug = $1", [COURSE])).rejects.toThrow(/foreign key/);
  });

  it("las constancias ya expedidas siguen verificables", async () => {
    await h.db.query(`insert into public.certificates (code, user_id, course_slug, participant_name, doc_type, doc_number, course_title, hours,
      trainer_name, trainer_title, issuer_name, started_on, finished_on) values ('UMB-ABCD-EFGH', $1, $2, 'Luna Pérez Gómez', 'TI', '1234567', 'Curso', 20,
      'Formador', 'Lic.', 'Emisor', '2026-01-01', '2026-02-01')`, [S, COURSE]);
    await h.db.query("select public.admin_preparar_eliminar_curso($1, $2)", [ADMIN, COURSE]);
    await h.db.query("delete from public.courses where slug = $1", [COURSE]);
    expect(await count("public.certificates where code = 'UMB-ABCD-EFGH'")).toBe(1);
  });
});

describe("eliminar un grupo", () => {
  it("quita el acceso que dio su código y deja registro", async () => {
    const cls = await one<string>("insert into public.classes (teacher_id, name, code, course_slug) values ($1, 'Grupo 7B', 'XYZ234', $2) returning id as r", [T, COURSE]);
    await h.db.query("insert into public.class_members (class_id, student_id) values ($1, $2)", [cls, S]);
    await h.db.query("insert into public.course_access (user_id, course_slug, via_class) values ($1, $2, $3)", [S, COURSE, cls]);
    expect(await one("select public.has_course_access($1, $2) as r", [S, COURSE])).toBe(true);
    await expect(one("select public.admin_preparar_eliminar_grupo($1, $2) as r", [S, cls])).rejects.toThrow(/solo_admin/);
    expect(await one("select public.admin_preparar_eliminar_grupo($1, $2) as r", [ADMIN, cls])).toMatchObject({ name: "Grupo 7B", members: 1 });
    expect(await one("select public.has_course_access($1, $2) as r", [S, COURSE])).toBe(false);
    await h.db.query("delete from public.classes where id = $1", [cls]);
    expect(await count("public.class_members where class_id = $1", [cls])).toBe(0);
  });
});

describe("eliminar una cuenta", () => {
  it("nunca la del administrador ni la propia", async () => {
    await expect(one("select public.admin_preparar_eliminar_cuenta($1, $2) as r", [ADMIN, ADMIN])).rejects.toThrow(/no_a_ti_mismo/);
    await h.addUser("abababab-0000-0000-0000-000000000009", { display_name: "Otro admin" }, { role: "docente" });
    await h.db.query("update public.profiles set is_admin = true where id = 'abababab-0000-0000-0000-000000000009'");
    await expect(one("select public.admin_preparar_eliminar_cuenta($1, 'abababab-0000-0000-0000-000000000009') as r", [ADMIN])).rejects.toThrow(/no_admin/);
    await expect(one("select public.admin_preparar_eliminar_cuenta($1, $2) as r", [T, S])).rejects.toThrow(/solo_admin/);
  });

  it("estudiante: guarda sus pagos en la copia contable y al borrar la cuenta se va todo lo suyo", async () => {
    const ref = await paidCourse();
    await h.db.query("insert into public.family_links (family_id, student_id) values ($1, $2)", [F, S]);
    expect(await one("select public.admin_preparar_eliminar_cuenta($1, $2) as r", [ADMIN, S])).toMatchObject({ name: "Luna", role: "estudiante", payments: 1 });
    await h.db.query("delete from auth.users where id = $1", [S]);
    expect(await count("public.profiles where id = $1", [S])).toBe(0);
    expect(await count("public.payments where reference = $1", [ref])).toBe(0);
    expect(await count("public.payments_archive where reference = $1", [ref])).toBe(1);
    expect(await count("public.family_links where student_id = $1", [S])).toBe(0);
  });

  it("docente: sus grupos se van con la cuenta y el acceso que dieron también", async () => {
    const cls = await one<string>("insert into public.classes (teacher_id, name, code, course_slug) values ($1, 'Grupo 8C', 'QWE234', $2) returning id as r", [T, COURSE]);
    await h.db.query("insert into public.class_members (class_id, student_id) values ($1, $2)", [cls, S]);
    await h.db.query("insert into public.course_access (user_id, course_slug, via_class) values ($1, $2, $3)", [S, COURSE, cls]);
    expect(await one("select public.admin_preparar_eliminar_cuenta($1, $2) as r", [ADMIN, T])).toMatchObject({ role: "docente", groups: 1 });
    await h.db.query("delete from auth.users where id = $1", [T]);
    expect(await count("public.classes where id = $1", [cls])).toBe(0);
    expect(await one("select public.has_course_access($1, $2) as r", [S, COURSE])).toBe(false);
    // El estudiante sigue existiendo.
    expect(await count("public.profiles where id = $1", [S])).toBe(1);
  });

  it("solo el servidor usa estas funciones y lee el registro", async () => {
    for (const role of ["anon", "authenticated"] as const) {
      await expect(h.as(role, ADMIN, "select public.admin_preparar_eliminar_cuenta($1, $2)", [ADMIN, S])).rejects.toThrow(/permission denied/);
      await expect(h.as(role, ADMIN, "select * from public.admin_log")).rejects.toThrow(/permission denied/);
      await expect(h.as(role, ADMIN, "select * from public.payments_archive")).rejects.toThrow(/permission denied/);
    }
  });
});
