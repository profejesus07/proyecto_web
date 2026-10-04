import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// Clases anuales: el código de un grupo ligado a una clase da acceso hasta el fin del año lectivo.
const ADMIN = "eeeeeeee-0000-0000-0000-000000000001";
const T = "eeeeeeee-0000-0000-0000-000000000002";
const S = "eeeeeeee-0000-0000-0000-000000000003";
const S2 = "eeeeeeee-0000-0000-0000-000000000004";

type H = Awaited<ReturnType<typeof makeDb>>;
let h: H;
const access = async (user: string, course = "mate-6-2027") =>
  (await h.db.query<{ ok: boolean }>("select public.has_course_access($1, $2) as ok", [user, course])).rows[0].ok;
const createGroup = async (name = "6.° A", teacher = T) =>
  (await h.db.query<{ r: { id: string; code: string } }>("select public.admin_create_class($1, 'mate-6-2027', $2, $3) as r", [ADMIN, name, teacher])).rows[0].r;
const join = async (student: string, code: string) =>
  (await h.db.query<{ r: { course_slug: string; course_title: string; expires_at: string } }>("select public.join_class($1, $2) as r", [student, code])).rows[0].r;

beforeEach(async () => {
  h = await makeDb();
  await h.addUser(ADMIN, { display_name: "Profe Jesús" }, { role: "docente" });
  await h.db.query("update public.profiles set is_admin = true where id = $1", [ADMIN]);
  await h.addUser(T, { display_name: "Profe Ana" }, { role: "docente" });
  await h.addUser(S, { display_name: "Luna" });
  await h.addUser(S2, { display_name: "Sol" });
  await h.db.query(`insert into public.courses (slug, title, summary, element, guardian, position, published, kind, area, grade, school_year, access_until)
                    values ('mate-6-2027', 'Matemáticas 6.° · 2027', '', 'luz', 'petrox', 10, true, 'clase', 'Matemáticas', '6.°', 2027, '2027-11-30')`);
});

describe("grupos ligados a una clase", () => {
  it("solo el admin los crea, para una clase y con un docente", async () => {
    await expect(h.db.query("select public.admin_create_class($1, 'mate-6-2027', '6.° A', $2)", [T, T])).rejects.toThrow(/solo_admin/);
    await expect(h.db.query("select public.admin_create_class($1, 'primer-portal', '6.° A', $2)", [ADMIN, T])).rejects.toThrow(/curso_no_encontrado/);
    await expect(h.db.query("select public.admin_create_class($1, 'mate-6-2027', '6.° A', $2)", [ADMIN, S])).rejects.toThrow(/solo_docentes/);
    const g = await createGroup();
    const list = (await h.db.query<{ r: { name: string; teacher: string; course_title: string }[] }>("select public.admin_classes($1) as r", [ADMIN])).rows[0].r;
    expect(list[0]).toMatchObject({ name: "6.° A", teacher: "Profe Ana", course_title: "Matemáticas 6.° · 2027" });
    expect(g.code).toMatch(/^[A-Z2-9]{6}$/);
  });

  it("el código da acceso a la clase hasta el fin del año lectivo", async () => {
    const g = await createGroup();
    expect(await access(S)).toBe(false);
    const r = await join(S, g.code);
    expect(r).toMatchObject({ course_slug: "mate-6-2027", course_title: "Matemáticas 6.° · 2027" });
    expect(new Date(r.expires_at).toISOString()).toBe("2027-12-01T05:00:00.000Z"); // 30 de nov. a medianoche en Colombia
    expect(await access(S)).toBe(true);
    expect(await access(S2)).toBe(false);
  });

  it("al salir del grupo se revoca el acceso que dio el código", async () => {
    const g = await createGroup();
    await join(S, g.code);
    await h.db.query("select public.leave_class($1, $2)", [S, g.id]);
    await h.db.query("select public.revoke_class_access($1, $2)", [S, g.id]);
    expect(await access(S)).toBe(false);
  });

  it("no reemplaza ni revoca un acceso pagado aparte", async () => {
    await h.db.query("select public.admin_grant_access($1, $2, 'mate-6-2027', null)", [ADMIN, S]);
    const g = await createGroup();
    await join(S, g.code);
    await h.db.query("select public.revoke_class_access($1, $2)", [S, g.id]);
    expect(await access(S)).toBe(true);
    const a = await h.db.query<{ expires_at: string | null; via_class: string | null }>("select expires_at, via_class from public.course_access where user_id = $1", [S]);
    expect(a.rows[0]).toEqual({ expires_at: null, via_class: null });
  });

  it("el admin puede cambiar el docente del grupo", async () => {
    const g = await createGroup("6.° B", ADMIN);
    await h.db.query("select public.admin_assign_teacher($1, $2, $3)", [ADMIN, g.id, T]);
    await expect(h.db.query("select public.class_report($1, $2)", [T, g.id])).resolves.toBeTruthy();
  });

  it("un grupo creado por un docente (sin clase ligada) no da acceso", async () => {
    const own = (await h.db.query<{ r: { code: string } }>("select public.create_class($1, 'Refuerzo') as r", [T])).rows[0].r;
    await join(S, own.code);
    expect(await access(S)).toBe(false);
  });
});
