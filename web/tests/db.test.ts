import { beforeAll, describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// Prueba el esquema de verdad (tablas, trigger, RLS y permisos por columna) en un Postgres en memoria.
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";

let db: Awaited<ReturnType<typeof makeDb>>["db"];
let as: Awaited<ReturnType<typeof makeDb>>["as"];

beforeAll(async () => {
  const h = await makeDb();
  db = h.db;
  as = h.as;
  await h.addUser(A, { display_name: "Ana", role: "estudiante", avatar: "leo" });
  await h.addUser(B, { display_name: "Beto", role: "superadmin", avatar: "hacker" });
});

describe("esquema", () => {
  it("el trigger crea el perfil y sanea rol y avatar", async () => {
    const r = await db.query<{ id: string; role: string; display_name: string; avatar: { base: string } }>("select id, role, display_name, avatar from public.profiles order by display_name");
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]).toMatchObject({ display_name: "Ana", role: "estudiante", avatar: { base: "leo" } });
    expect(r.rows[1]).toMatchObject({ display_name: "Beto", role: "estudiante", avatar: { base: "aria" } });
  });

  it("siembra dos portales, cada uno con 4 misiones (la última es el Guardián) y 18 preguntas", async () => {
    const r = await db.query<{ slug: string; guardian: string; position: number; misiones: number; jefes: number; preguntas: number }>(`
      select c.slug, c.guardian, c.position,
             count(distinct m.id)::int misiones,
             count(distinct m.id) filter (where m.is_boss)::int jefes,
             count(q.id)::int preguntas
        from public.courses c join public.missions m on m.course_slug = c.slug join public.questions q on q.mission_id = m.id
       group by c.slug order by c.position`);
    expect(r.rows).toEqual([
      { slug: "primer-portal", guardian: "petrox", position: 1, misiones: 4, jefes: 1, preguntas: 18 },
      { slug: "portal-del-primer-intento", guardian: "ignaris", position: 2, misiones: 4, jefes: 1, preguntas: 18 },
    ]);
  });

  it("un curso de educación informal no puede tener 160 horas o más", async () => {
    await expect(db.query("update public.courses set hours = 160 where slug = 'primer-portal'")).rejects.toThrow(/check/i);
    await expect(db.query("update public.courses set hours = 159 where slug = 'primer-portal'")).resolves.toBeTruthy();
    await expect(db.query("update public.courses set kind = 'otro' where slug = 'primer-portal'")).rejects.toThrow(/check/i);
    await expect(db.query("update public.missions set period = 5 where course_slug = 'primer-portal' and position = 1")).rejects.toThrow(/check/i);
    await db.query("update public.courses set hours = null where slug = 'primer-portal'");
  });

  it("cada pregunta tiene una respuesta correcta válida", async () => {
    const r = await db.query<{ n: number }>("select count(*)::int n from public.questions where correct_index >= jsonb_array_length(options)");
    expect(r.rows[0].n).toBe(0);
  });
});

describe("seguridad por filas", () => {
  it("un estudiante solo ve su propio perfil", async () => {
    const r = await as("authenticated", A, "select display_name from public.profiles");
    expect(r.rows).toEqual([{ display_name: "Ana" }]);
  });

  it("un visitante anónimo no ve perfiles", async () => {
    await expect(as("anon", null, "select * from public.profiles")).rejects.toThrow();
  });

  it("las respuestas correctas nunca llegan al navegador", async () => {
    await expect(as("authenticated", A, "select correct_index from public.questions")).rejects.toThrow();
    await expect(as("anon", null, "select * from public.questions")).rejects.toThrow();
    const r = await as("service_role", null, "select count(*)::int n from public.questions");
    expect(r.rows[0]).toEqual({ n: 36 });
  });

  it("un estudiante NO puede darse XP ni monedas", async () => {
    await expect(as("authenticated", A, "update public.profiles set xp = 99999 where id = $1", [A])).rejects.toThrow();
    await expect(as("authenticated", A, "update public.profiles set coins = 99999 where id = $1", [A])).rejects.toThrow();
  });

  it("un estudiante NO puede cambiar su rol ni su avatar directamente", async () => {
    await expect(as("authenticated", A, "update public.profiles set role = 'docente' where id = $1", [A])).rejects.toThrow();
    await expect(as("authenticated", A, "update public.profiles set avatar = '{}'::jsonb where id = $1", [A])).rejects.toThrow();
  });

  it("sí puede cambiar su nombre, y el nombre se valida", async () => {
    await as("authenticated", A, "update public.profiles set display_name = 'Ana Luz' where id = $1", [A]);
    const r = await as("authenticated", A, "select display_name from public.profiles");
    expect(r.rows[0]).toEqual({ display_name: "Ana Luz" });
    await expect(as("authenticated", A, "update public.profiles set display_name = 'x' where id = $1", [A])).rejects.toThrow();
  });

  it("no puede modificar a otra persona", async () => {
    const r = await as("authenticated", A, "update public.profiles set display_name = 'Hackeado' where id = $1 returning id", [B]);
    expect(r.rows).toHaveLength(0);
  });

  it("no puede escribir progreso, inventario ni movimientos", async () => {
    await expect(as("authenticated", A, "insert into public.inventory (user_id, item_id) values ($1, 'obj_x')", [A])).rejects.toThrow();
    await expect(as("authenticated", A, "insert into public.ledger (user_id, kind, delta, reason) values ($1,'coins',100,'x')", [A])).rejects.toThrow();
  });

  it("el servidor escribe y cada quien lee solo lo suyo", async () => {
    await as("service_role", null, "insert into public.inventory (user_id, item_id) values ($1,'obj_a'), ($2,'obj_b')", [A, B]);
    const r = await as("authenticated", A, "select item_id from public.inventory");
    expect(r.rows).toEqual([{ item_id: "obj_a" }]);
  });

  it("nadie desde el navegador puede crear ni editar cursos o misiones", async () => {
    await expect(as("anon", null, "insert into public.courses (slug,title,summary,element,guardian) values ('x','x','x','luz','x')")).rejects.toThrow();
    await expect(as("authenticated", A, "update public.courses set title = 'hack'")).rejects.toThrow();
    await expect(as("authenticated", A, "delete from public.missions")).rejects.toThrow();
  });

  it("el disparador de perfiles no se puede llamar desde el navegador", async () => {
    await expect(as("authenticated", A, "select public.handle_new_user()")).rejects.toThrow();
  });

  it("los cursos publicados y sus misiones son públicos", async () => {
    const c = await as("anon", null, "select slug from public.courses");
    expect(c.rows).toEqual(expect.arrayContaining([{ slug: "primer-portal" }, { slug: "portal-del-primer-intento" }]));
    const m = await as("anon", null, "select count(*)::int n from public.missions");
    expect(m.rows[0].n).toBe(8);
  });

  it("un curso sin publicar queda oculto", async () => {
    await db.exec("update public.courses set published = false");
    const c = await as("anon", null, "select slug from public.courses");
    expect(c.rows).toHaveLength(0);
    const m = await as("anon", null, "select count(*)::int n from public.missions");
    expect(m.rows[0].n).toBe(0);
    await db.exec("update public.courses set published = true");
  });
});
