import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { makeDb } from "./helpers/pg";

// supabase/contenido/curso_demo.sql: deja un solo curso de demostración (dos módulos, gratis, actividades variadas).
const script = readFileSync(path.resolve(import.meta.dirname, "../../supabase/contenido/curso_demo.sql"), "utf8");
const S = "dededede-0000-0000-0000-000000000001";

describe("curso de demostración", () => {
  it("une los dos portales de ejemplo en uno solo, gratis, con dos módulos y sin perder el avance", async () => {
    const h = await makeDb();
    await h.addUser(S, { display_name: "Luna" });
    const ignarisLesson = (await h.db.query<{ id: string }>("select id from public.missions where course_slug = 'portal-del-primer-intento' and position = 1")).rows[0].id;
    await h.db.query("insert into public.mission_progress (user_id, mission_id, best_score, attempts, completed_at) values ($1, $2, 100, 1, now())", [S, ignarisLesson]);

    await h.db.exec(script);
    await h.db.exec(script); // se puede repetir

    const courses = (await h.db.query<{ slug: string; is_free: boolean }>("select slug, is_free from public.courses")).rows;
    expect(courses).toEqual([{ slug: "primer-portal", is_free: true }]);
    const mods = (await h.db.query<{ title: string; guardian: string; n: number }>(
      "select mo.title, mo.guardian, (select count(*)::int from public.missions mi where mi.module_id = mo.id) as n from public.modules mo order by mo.position")).rows;
    expect(mods).toEqual([{ title: "Pasos pequeños", guardian: "petrox", n: 4 }, { title: "El primer intento", guardian: "ignaris", n: 4 }]);
    const lessons = (await h.db.query<{ position: number; is_boss: boolean }>("select position, is_boss from public.missions where course_slug = 'primer-portal' order by position")).rows;
    expect(lessons.map((l) => l.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(lessons.filter((l) => l.is_boss).map((l) => l.position)).toEqual([4, 8]);
    expect((await h.db.query<{ kind: string }>("select kind from public.questions where kind <> 'opcion' order by kind")).rows.map((r) => r.kind))
      .toEqual(["completar", "ordenar", "relacionar", "vf"]);
    // El avance en la lección movida se conserva, y el curso gratis abre todo.
    expect((await h.db.query("select 1 from public.mission_progress where mission_id = $1", [ignarisLesson])).rows.length).toBe(1);
    expect((await h.db.query<{ r: boolean }>("select public.has_course_access($1, 'primer-portal') as r", [S])).rows[0].r).toBe(true);
    // Las actividades nuevas se pueden responder.
    const m = (await h.db.query<{ id: string }>("select id from public.missions where title = 'Los errores son pistas'")).rows[0].id;
    await h.db.query("insert into public.mission_progress (user_id, mission_id, best_score, attempts, completed_at) select $1, id, 100, 1, now() from public.missions where course_slug = 'primer-portal' and position < 6 on conflict do nothing", [S]);
    const r = (await h.db.query<{ r: { correct: boolean } }>("select public.answer_activity($1, $2, 4, '\"PISTA\"'::jsonb) as r", [S, m])).rows[0].r;
    expect(r.correct).toBe(true);
  });
});
