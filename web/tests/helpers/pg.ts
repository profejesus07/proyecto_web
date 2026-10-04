import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";

export type Role = "anon" | "authenticated" | "service_role";

/** Postgres en memoria con el esquema real de Supabase simulado (roles, auth.uid(), RLS). */
export async function makeDb() {
  const setupSql = readFileSync(path.resolve(import.meta.dirname, "../../../supabase/setup.sql"), "utf8");
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (
      id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb, raw_app_meta_data jsonb default '{}'::jsonb,
      created_at timestamptz default now(), last_sign_in_at timestamptz
    );
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    grant usage on schema public to anon, authenticated, service_role;
  `);
  await db.exec(setupSql);
  await db.exec(setupSql); // el esquema debe ser idempotente
  await db.exec(`grant all on all tables in schema public to service_role;`);
  async function as<T = Record<string, unknown>>(role: Role, uid: string | null, sql: string, params: unknown[] = []) {
    await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`);
    try {
      return await db.query<T>(sql, params);
    } finally {
      await db.exec("reset role;");
    }
  }
  /** Crea una persona. `app` simula el app_metadata que solo escribe el servidor (p. ej. { role: "docente" }). */
  async function addUser(id: string, meta: Record<string, string> = {}, app: Record<string, string> = {}, email = `${id.slice(0, 8)}@prueba.co`) {
    await db.query("insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data) values ($1, $2, $3::jsonb, $4::jsonb)", [id, email, JSON.stringify(meta), JSON.stringify(app)]);
  }
  /** Da acceso completo a un curso (como haría el administrador o un pago). */
  async function grant(user: string, course = "primer-portal") {
    await db.query("insert into public.course_access (user_id, course_slug) values ($1, $2) on conflict do nothing", [user, course]);
  }
  return { db, as, addUser, grant };
}
