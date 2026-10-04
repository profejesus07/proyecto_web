import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// Administración: roles, cuentas de docente, acceso a cursos y precios.
const ADMIN = "cccccccc-0000-0000-0000-000000000001";
const T = "cccccccc-0000-0000-0000-000000000002";
const S = "cccccccc-0000-0000-0000-000000000003";

type H = Awaited<ReturnType<typeof makeDb>>;
let h: H;
const role = async (id: string) => (await h.db.query<{ role: string }>("select role from public.profiles where id = $1", [id])).rows[0].role;

beforeEach(async () => {
  h = await makeDb();
  await h.addUser(ADMIN, { display_name: "Profe Jesús" }, { role: "docente" }, "admin@umbral.co");
  await h.db.query("update public.profiles set is_admin = true where id = $1", [ADMIN]); // se marca a mano en Supabase
  await h.addUser(T, { display_name: "Profe Ana" }, { role: "docente" }, "ana@colegio.co");
  await h.addUser(S, { display_name: "Luna" }, {}, "luna@familia.co");
});

describe("roles al registrarse", () => {
  it("quien se registra en la web nunca puede volverse docente ni admin por su cuenta", async () => {
    await h.addUser("dddddddd-0000-0000-0000-000000000001", { role: "docente" });
    await h.addUser("dddddddd-0000-0000-0000-000000000002", { role: "admin" });
    await h.addUser("dddddddd-0000-0000-0000-000000000003", { role: "familia" });
    expect(await role("dddddddd-0000-0000-0000-000000000001")).toBe("estudiante");
    expect(await role("dddddddd-0000-0000-0000-000000000002")).toBe("estudiante");
    expect(await role("dddddddd-0000-0000-0000-000000000003")).toBe("familia");
  });

  it("el servidor (app_metadata) sí crea cuentas de docente, pero nunca de admin", async () => {
    expect(await role(T)).toBe("docente");
    await h.addUser("dddddddd-0000-0000-0000-000000000004", {}, { role: "admin" });
    expect(await role("dddddddd-0000-0000-0000-000000000004")).toBe("estudiante");
    const flag = await h.db.query<{ is_admin: boolean }>("select is_admin from public.profiles where id = $1", ["dddddddd-0000-0000-0000-000000000004"]);
    expect(flag.rows[0].is_admin).toBe(false);
  });

  it("nadie puede marcarse como admin desde el navegador", async () => {
    await expect(h.as("authenticated", S, "update public.profiles set is_admin = true where id = $1", [S])).rejects.toThrow(/permission denied/);
  });
});

describe("panel de administración", () => {
  it("lista personas con su correo y busca por correo o nombre", async () => {
    const all = (await h.db.query<{ r: { email: string; role: string }[] }>("select public.admin_users($1, '') as r", [ADMIN])).rows[0].r;
    expect(all.map((u) => u.email).sort()).toEqual(["admin@umbral.co", "ana@colegio.co", "luna@familia.co"]);
    expect(all.find((u) => u.email === "admin@umbral.co")?.role).toBe("admin");
    const found = (await h.db.query<{ r: { name: string }[] }>("select public.admin_users($1, 'lun') as r", [ADMIN])).rows[0].r;
    expect(found.map((u) => u.name)).toEqual(["Luna"]);
  });

  it("solo el admin puede usarlo", async () => {
    await expect(h.db.query("select public.admin_users($1, '')", [T])).rejects.toThrow(/solo_admin/);
    await expect(h.db.query("select public.admin_grant_access($1, $2, 'primer-portal')", [T, S])).rejects.toThrow(/solo_admin/);
    await expect(h.as("authenticated", ADMIN, "select public.admin_users($1, '')", [ADMIN])).rejects.toThrow(/permission denied/);
  });

  it("cambia roles, pero no el propio ni a otro admin", async () => {
    await h.db.query("select public.admin_set_role($1, $2, 'docente')", [ADMIN, S]);
    expect(await role(S)).toBe("docente");
    await expect(h.db.query("select public.admin_set_role($1, $2, 'admin')", [ADMIN, S])).rejects.toThrow(/rol_invalido/);
    await expect(h.db.query("select public.admin_set_role($1, $1, 'estudiante')", [ADMIN])).rejects.toThrow(/no_permitido/);
  });

  it("da y quita acceso a un curso, que abre las lecciones de pago", async () => {
    const m = (await h.db.query<{ id: string }>("select id from public.missions where course_slug = 'primer-portal' order by position")).rows;
    await h.db.query("select public.complete_mission($1, $2, 100, 70, '{}')", [S, m[0].id]);
    await expect(h.db.query("select public.complete_mission($1, $2, 100, 70, '{}')", [S, m[1].id])).rejects.toThrow(/requiere_suscripcion/);
    await h.db.query("select public.admin_grant_access($1, $2, 'primer-portal')", [ADMIN, S]);
    await expect(h.db.query("select public.complete_mission($1, $2, 100, 70, '{}')", [S, m[1].id])).resolves.toBeTruthy();
    const users = (await h.db.query<{ r: { name: string; access: { course: string }[] }[] }>("select public.admin_users($1, 'Luna') as r", [ADMIN])).rows[0].r;
    expect(users[0].access.map((a) => a.course)).toEqual(["primer-portal"]);
    await h.db.query("select public.admin_revoke_access($1, $2, 'primer-portal')", [ADMIN, S]);
    await expect(h.db.query("select public.complete_mission($1, $2, 100, 70, '{}')", [S, m[2].id])).rejects.toThrow(/requiere_suscripcion/);
  });

  it("docentes y admin ven los cursos completos sin suscripción", async () => {
    const m = (await h.db.query<{ id: string }>("select id from public.missions where course_slug = 'primer-portal' order by position")).rows;
    for (const who of [T, ADMIN]) {
      await h.db.query("select public.complete_mission($1, $2, 100, 70, '{}')", [who, m[0].id]);
      await expect(h.db.query("select public.complete_mission($1, $2, 100, 70, '{}')", [who, m[1].id])).resolves.toBeTruthy();
    }
  });

  it("pone precio a un curso", async () => {
    await h.db.query("select public.admin_set_price($1, 'primer-portal', 25000)", [ADMIN]);
    const c = await h.db.query<{ price_cop: number }>("select price_cop from public.courses where slug = 'primer-portal'");
    expect(c.rows[0].price_cop).toBe(25000);
    await expect(h.db.query("select public.admin_set_price($1, 'primer-portal', -1)", [ADMIN])).rejects.toThrow(/precio_invalido/);
  });

  it("ve todas las clases y puede abrir el informe de cualquiera", async () => {
    const c = (await h.db.query<{ r: { id: string } }>("select public.create_class($1, '6.º B') as r", [T])).rows[0].r;
    const list = (await h.db.query<{ r: { name: string; teacher: string }[] }>("select public.admin_classes($1) as r", [ADMIN])).rows[0].r;
    expect(list).toEqual([expect.objectContaining({ name: "6.º B", teacher: "Profe Ana" })]);
    await expect(h.db.query("select public.class_report($1, $2)", [ADMIN, c.id])).resolves.toBeTruthy();
  });
});
