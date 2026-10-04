import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// Constancias de asistencia: solo al terminar un curso corto, con datos fijos y código verificable.
const U = "ffffffff-0000-0000-0000-000000000001";
const SIG = "data:image/png;base64,iVBORw0KGgo=";

type H = Awaited<ReturnType<typeof makeDb>>;
let h: H;
type Cert = { code: string; number: number; participant_name: string; doc_number: string; course_title: string; hours: number; trainer_name: string; started_on: string; finished_on: string };
const issue = async (name = "  Luna   María Pérez  ", doc = "1012345678") =>
  (await h.db.query<{ r: { code: string; new: boolean } }>("select public.issue_certificate($1, 'primer-portal', $2, 'CC', $3) as r", [U, name, doc])).rows[0].r;
const finishCourse = async () => {
  const ms = (await h.db.query<{ id: string }>("select id from public.missions where course_slug = 'primer-portal' order by position")).rows;
  for (const m of ms) await h.db.query("select public.complete_mission($1, $2, 100, 70, '{}')", [U, m.id]);
};

beforeEach(async () => {
  h = await makeDb();
  await h.addUser(U, { display_name: "Luna" });
  await h.grant(U);
  await h.db.query("update public.courses set hours = 12, trainer_name = 'Jesús David Álvarez Sáez', trainer_title = 'Magíster en Educación' where slug = 'primer-portal'");
  await h.db.query("update public.platform_settings set issuer_name = 'Mgtr. Jesús David Álvarez Sáez', issuer_title = 'Responsable', city = 'Bogotá D. C.', signature_png = $1", [SIG]);
});

describe("issue_certificate", () => {
  it("no se expide si el curso no está terminado", async () => {
    await expect(issue()).rejects.toThrow(/curso_sin_terminar/);
  });

  it("al terminar, expide una constancia con los datos fijos del curso y un código verificable", async () => {
    await finishCourse();
    const r = await issue();
    expect(r.new).toBe(true);
    expect(r.code).toMatch(/^UMB-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    const c = (await h.db.query<Cert>("select * from public.certificates where code = $1", [r.code])).rows[0];
    expect(c).toMatchObject({ participant_name: "Luna María Pérez", doc_number: "1012345678", course_title: "El Portal de los Pasos Pequeños", hours: 12, trainer_name: "Jesús David Álvarez Sáez" });
    expect(c.number).toBeGreaterThan(0);
    expect(new Date(c.finished_on).getTime()).toBeGreaterThanOrEqual(new Date(c.started_on).getTime());
  });

  it("pedirla otra vez devuelve la misma, sin cambiar los datos", async () => {
    await finishCourse();
    const a = await issue();
    const b = await issue("Otro Nombre Distinto", "999999");
    expect(b).toEqual({ code: a.code, new: false });
  });

  it("cambiar el curso después no altera una constancia ya expedida", async () => {
    await finishCourse();
    const r = await issue();
    await h.db.query("update public.courses set hours = 40, title = 'Otro título' where slug = 'primer-portal'");
    const c = (await h.db.query<Cert>("select * from public.certificates where code = $1", [r.code])).rows[0];
    expect(c).toMatchObject({ hours: 12, course_title: "El Portal de los Pasos Pequeños" });
  });

  it("exige que el responsable haya configurado su nombre y firma", async () => {
    await finishCourse();
    await h.db.query("update public.platform_settings set signature_png = null");
    await expect(issue()).rejects.toThrow(/falta_configuracion/);
  });

  it("valida el documento y que el curso tenga horas y formador", async () => {
    await finishCourse();
    await expect(issue("Luna María Pérez", "12")).rejects.toThrow(/check/i);
    await h.db.query("update public.courses set trainer_title = null where slug = 'primer-portal'");
    await expect(issue()).rejects.toThrow(/curso_incompleto/);
  });

  it("solo el servidor la expide, y cada quien ve solo las suyas", async () => {
    await finishCourse();
    await issue();
    await expect(h.as("authenticated", U, "select public.issue_certificate($1, 'primer-portal', 'Luna María', 'CC', '123456')", [U])).rejects.toThrow(/permission denied/);
    expect((await h.as("authenticated", U, "select * from public.certificates")).rows).toHaveLength(1);
    expect((await h.as("authenticated", "ffffffff-0000-0000-0000-000000000009", "select * from public.certificates")).rows).toHaveLength(0);
    await expect(h.as("authenticated", U, "update public.certificates set hours = 100")).rejects.toThrow(/permission denied/);
    await expect(h.as("authenticated", U, "select * from public.platform_settings")).rejects.toThrow(/permission denied/);
  });
});
