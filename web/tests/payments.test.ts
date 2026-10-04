import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// Pagos en línea: el precio sale de la base de datos y el curso solo se activa con un aviso aprobado y del valor correcto.
const ADMIN = "eeeeeeee-0000-0000-0000-000000000001";
const S = "eeeeeeee-0000-0000-0000-000000000002";
const F = "eeeeeeee-0000-0000-0000-000000000003";
const OTHER = "eeeeeeee-0000-0000-0000-000000000004";
const COURSE = "portal-del-primer-intento";

type H = Awaited<ReturnType<typeof makeDb>>;
let h: H;
const one = async <R>(sql: string, params: unknown[]) => (await h.db.query<{ r: R }>(sql, params)).rows[0].r;
const start = (payer = S, student: string | null = null, course = COURSE, provider = "wompi") =>
  one<{ reference: string; amount: number; title: string; student: string }>("select public.start_payment($1, $2, $3, $4) as r", [payer, student, course, provider]);
const settle = (ref: string, status: string, amount: number | null = 25000, currency = "COP", provider = "wompi") =>
  one<{ status: string; user_id: string; course: string }>("select public.settle_payment($1, $2, 'tx-1', $3, $4, $5, 'APPROVED') as r", [ref, provider, status, amount, currency]);
const hasAccess = (user = S) => one<boolean>("select public.has_course_access($1, $2) as r", [user, COURSE]);
const payment = (ref: string) => h.db.query<{ status: string; detail: string | null; amount_cop: number; payer_id: string; user_id: string }>("select * from public.payments where reference = $1", [ref]).then((r) => r.rows[0]);

beforeEach(async () => {
  h = await makeDb();
  await h.addUser(ADMIN, { display_name: "Profe" }, { role: "docente" });
  await h.db.query("update public.profiles set is_admin = true where id = $1", [ADMIN]);
  await h.addUser(S, { display_name: "Luna" });
  await h.addUser(F, { display_name: "Mamá de Luna", role: "familia" });
  await h.addUser(OTHER, { display_name: "Otro" });
  await h.db.query("update public.courses set price_cop = 25000 where slug = $1", [COURSE]);
});

describe("start_payment", () => {
  it("cobra el precio de la base de datos y da una referencia única", async () => {
    const a = await start();
    const b = await start();
    expect(a).toMatchObject({ amount: 25000, student: S });
    expect(a.reference).toMatch(/^UMB-[0-9A-F]{12}$/);
    expect(a.reference).not.toBe(b.reference);
    expect(await payment(a.reference)).toMatchObject({ status: "pendiente", amount_cop: 25000, payer_id: S, user_id: S });
  });

  it("no cobra cursos sin precio, ni a quien ya tiene acceso, ni pasarelas desconocidas", async () => {
    await h.db.query("update public.courses set price_cop = null where slug = $1", [COURSE]);
    await expect(start()).rejects.toThrow(/sin_precio/);
    await h.db.query("update public.courses set price_cop = 25000 where slug = $1", [COURSE]);
    await expect(start(S, null, COURSE, "paypal")).rejects.toThrow(/pasarela_invalida/);
    await expect(start(S, null, "no-existe")).rejects.toThrow(/curso_no_encontrado/);
    await h.grant(S, COURSE);
    await expect(start()).rejects.toThrow(/ya_tiene_acceso/);
  });

  it("una familia paga solo por un estudiante vinculado; un estudiante no paga por otro", async () => {
    await expect(start(F)).rejects.toThrow(/solo_estudiantes/);
    await expect(start(F, S)).rejects.toThrow(/no_vinculado/);
    await h.db.query("insert into public.family_links (family_id, student_id) values ($1, $2)", [F, S]);
    const r = await start(F, S);
    expect(await payment(r.reference)).toMatchObject({ payer_id: F, user_id: S });
    await expect(start(OTHER, S)).rejects.toThrow(/no_vinculado/);
    await h.db.query("update public.family_links set revoked_at = now() where family_id = $1", [F]);
    await expect(start(F, S)).rejects.toThrow(/no_vinculado/);
  });

  it("limita los intentos por día", async () => {
    for (let i = 0; i < 20; i++) await start();
    await expect(start()).rejects.toThrow(/demasiados_intentos/);
  });
});

describe("settle_payment", () => {
  it("un pago aprobado activa el curso (sin vencimiento en un curso corto); los avisos repetidos no cambian nada", async () => {
    const { reference } = await start();
    expect(await hasAccess()).toBe(false);
    expect(await settle(reference, "aprobado")).toMatchObject({ status: "aprobado", user_id: S, course: COURSE });
    expect(await hasAccess()).toBe(true);
    const acc = (await h.db.query<{ source: string; expires_at: string | null }>("select source, expires_at from public.course_access where user_id = $1", [S])).rows[0];
    expect(acc).toEqual({ source: "pago", expires_at: null });
    // Un aviso viejo («pendiente» o «rechazado») que llega tarde no deshace la aprobación.
    expect(await settle(reference, "pendiente")).toMatchObject({ status: "aprobado" });
    expect(await settle(reference, "rechazado")).toMatchObject({ status: "aprobado" });
    expect(await hasAccess()).toBe(true);
  });

  it("si el valor o la moneda no coinciden, queda en error y no activa nada", async () => {
    const a = await start();
    expect(await settle(a.reference, "aprobado", 100)).toMatchObject({ status: "error" });
    expect((await payment(a.reference)).detail).toMatch(/valor_distinto/);
    const b = await start();
    expect(await settle(b.reference, "aprobado", 25000, "USD")).toMatchObject({ status: "error" });
    expect(await hasAccess()).toBe(false);
  });

  it("rechazado no activa; un reintento aprobado con la misma referencia sí (Mercado Pago)", async () => {
    const { reference } = await start(S, null, COURSE, "mercadopago");
    expect(await settle(reference, "rechazado", 25000, "COP", "mercadopago")).toMatchObject({ status: "rechazado" });
    expect(await hasAccess()).toBe(false);
    expect(await settle(reference, "aprobado", 25000, "COP", "mercadopago")).toMatchObject({ status: "aprobado" });
    expect(await hasAccess()).toBe(true);
  });

  it("la referencia debe ser de esa pasarela", async () => {
    const { reference } = await start();
    await expect(settle(reference, "aprobado", 25000, "COP", "mercadopago")).rejects.toThrow(/pago_no_encontrado/);
  });

  it("una anulación (reembolso) quita el acceso que dio el pago, pero no uno dado por el administrador", async () => {
    const { reference } = await start();
    await settle(reference, "aprobado");
    expect(await settle(reference, "anulado")).toMatchObject({ status: "anulado" });
    expect(await hasAccess()).toBe(false);
    // Si después el admin lo activa a mano, una anulación repetida no lo toca.
    await h.db.query("select public.admin_grant_access($1, $2, $3)", [ADMIN, S, COURSE]);
    await settle(reference, "anulado");
    expect(await hasAccess()).toBe(true);
  });

  it("en una clase, el acceso pagado dura hasta el fin del año lectivo", async () => {
    await h.db.query("update public.courses set kind = 'clase', access_until = '2099-11-30' where slug = $1", [COURSE]);
    const { reference } = await start();
    await settle(reference, "aprobado");
    const exp = await one<string>("select expires_at::text as r from public.course_access where user_id = $1", [S]);
    expect(exp).toMatch(/^2099-12-01/);
  });

  it("la familia paga y el curso queda para su hijo o hija", async () => {
    await h.db.query("insert into public.family_links (family_id, student_id) values ($1, $2)", [F, S]);
    const { reference } = await start(F, S);
    await settle(reference, "aprobado");
    expect(await hasAccess(S)).toBe(true);
    expect(await hasAccess(F)).toBe(false);
  });
});

describe("seguridad", () => {
  it("solo el servidor usa las funciones de pago y nadie lee la tabla desde el navegador", async () => {
    const { reference } = await start();
    for (const role of ["anon", "authenticated"] as const) {
      await expect(h.as(role, S, "select public.start_payment($1, null, $2, 'wompi')", [S, COURSE])).rejects.toThrow(/permission denied/);
      await expect(h.as(role, S, "select public.settle_payment($1, 'wompi', 'x', 'aprobado', 25000, 'COP')", [reference])).rejects.toThrow(/permission denied/);
      await expect(h.as(role, S, "select * from public.payments")).rejects.toThrow(/permission denied/);
    }
  });

  it("admin_payments es solo para el administrador y muestra quién pagó", async () => {
    await h.db.query("insert into public.family_links (family_id, student_id) values ($1, $2)", [F, S]);
    await start(F, S);
    await expect(one("select public.admin_payments($1) as r", [S])).rejects.toThrow(/solo_admin/);
    const list = await one<{ student: string; payer: string | null; status: string; amount: number }[]>("select public.admin_payments($1) as r", [ADMIN]);
    expect(list[0]).toMatchObject({ student: "Luna", payer: "Mamá de Luna", status: "pendiente", amount: 25000 });
  });
});
