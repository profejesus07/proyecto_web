import type { Metadata } from "next";
import Link from "next/link";
import { AccessChip, CreateTeacherForm, GrantAccess, RoleSelect } from "@/components/admin-client";
import { DeleteButton } from "@/components/delete-button";
import { Icon } from "@/components/icons";
import { shortDate } from "@/components/workspace/admin-format";
import { Empty, Kpi, PanelHeader, PanelSection } from "@/components/workspace/ui";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { ROLE_LABEL, isAccessActive } from "@/lib/roles";
import type { Role } from "@/lib/data/types";

export const metadata: Metadata = { title: "Personas · Consola" };

const ROLE_BADGE: Record<Role, string> = { estudiante: "badge-brand", familia: "badge-muted", docente: "badge-ok", admin: "badge-warn" };
const FILTERS: [string, string][] = [["", "Todas"], ["estudiante", "Estudiantes"], ["docente", "Docentes"], ["familia", "Familias"]];

export default async function PeoplePage({ searchParams }: PageProps<"/admin/personas">) {
  const viewer = await requireAdmin("/admin/personas");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const rol = typeof sp.rol === "string" && FILTERS.some(([v]) => v === sp.rol) ? sp.rol : "";
  const repo = getRepo();
  const [found, courses] = await Promise.all([repo.adminUsers(viewer.id, q), repo.listCourses()]);
  const users = rol ? found.filter((u) => u.role === rol) : found;
  const title = new Map(courses.map((c) => [c.slug, c.title]));
  const count = (role: string) => found.filter((u) => u.role === role).length;
  const href = (r: string) => `/admin/personas?${new URLSearchParams({ ...(q && { q }), ...(r && { rol: r }) }).toString()}`;

  return (
    <div className="space-y-8">
      <PanelHeader title="Personas" description="Cuentas, roles y acceso a los cursos." />

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon="people" label="Estudiantes" value={count("estudiante")} />
        <Kpi icon="user" label="Docentes" value={count("docente")} tone="ok" />
        <Kpi icon="people" label="Familias" value={count("familia")} tone="muted" />
        <Kpi icon="key" label="Cursos activados" value={found.reduce((n, u) => n + u.access.filter((a) => isAccessActive(a.expiresAt)).length, 0)} tone="warn" />
      </dl>

      <section aria-labelledby="docente-t" className="panel space-y-3 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#efeafe] text-[#4a22c9]"><Icon name="plus" /></span>
          <div>
            <h2 id="docente-t" className="text-lg">Crear cuenta de docente</h2>
            <p className="text-sm text-muted">Queda lista para entrar con una contraseña temporal. El docente supervisa a los estudiantes que le asignes en Grupos; no juega ni cambia sus datos o sus notas.</p>
          </div>
        </div>
        <CreateTeacherForm />
      </section>

      <PanelSection id="personas-t" title="Todas las personas" description={q ? `Resultados para «${q}»` : "Las 200 cuentas más recientes."}
        action={
          <form role="search" className="flex w-full flex-wrap gap-2 sm:w-auto">
            <label htmlFor="buscar" className="sr-only">Buscar por nombre o correo</label>
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input id="buscar" name="q" defaultValue={q} placeholder="Buscar por nombre o correo" className="input !pl-9 sm:!w-72" />
            </div>
            {rol && <input type="hidden" name="rol" value={rol} />}
            <button type="submit" className="btn btn-secondary">Buscar</button>
            {q && <Link href={rol ? `/admin/personas?rol=${rol}` : "/admin/personas"} className="btn btn-ghost">Limpiar</Link>}
          </form>
        }>
        <nav aria-label="Filtrar por rol" className="flex flex-wrap gap-1">
          {FILTERS.map(([v, label]) => (
            <Link key={v} href={href(v)} aria-current={rol === v ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${rol === v ? "bg-[#15103f] text-white" : "text-muted hover:bg-[#eef0f5] hover:text-text"}`}>{label}</Link>
          ))}
        </nav>
        {users.length === 0 ? <Empty icon="search">No hay personas que coincidan.</Empty> : (
          <ul className="panel divide-y divide-line">
            {users.map((u) => (
              <li key={u.id} className="grid gap-3 p-4 lg:grid-cols-[1.3fr_auto_1.7fr] lg:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eef0f5] text-sm font-bold text-[#3b2f8f]" aria-hidden="true">{u.name.slice(0, 1).toUpperCase()}</span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold"><span className="truncate">{u.name}</span> <span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span></p>
                    <p className="truncate text-sm text-muted">{u.email}</p>
                    <p className="text-xs text-muted">Desde {shortDate(u.createdAt)}{u.lastSignInAt ? ` · último ingreso ${shortDate(u.lastSignInAt)}` : ""}{u.role === "estudiante" ? ` · ${u.xp} XP` : ""}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RoleSelect userId={u.id} role={u.role} name={u.name} />
                  {u.role !== "admin" && u.id !== viewer.id && (
                    <DeleteButton kind="cuenta" id={u.id} name={u.name} consequences={
                      u.role === "docente"
                        ? ["Se borra la cuenta y no podrá volver a entrar con ese correo (salvo que se registre de nuevo).", "Se borran sus grupos; sus estudiantes siguen con sus cuentas, pero pierden el acceso que les dio el código.", "Si solo quieres quitarle el rol, cámbialo a Estudiante."]
                        : ["Se borra la cuenta con todo su avance, su inventario, sus vínculos de familia y sus clases.", "Sus pagos quedan en la copia contable y sus constancias expedidas siguen verificables (sin enlace a la cuenta)."]
                    } />
                  )}
                </div>
                <div className="space-y-2">
                  {u.role === "docente" || u.role === "admin" ? (
                    <p className="text-sm text-muted">Ve todos los cursos completos.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {u.access.length === 0 && <span className="text-sm text-muted">Solo lecciones gratis</span>}
                        {u.access.map((a) => <AccessChip key={a.course} userId={u.id} course={a.course} title={title.get(a.course) ?? a.course} expiresAt={a.expiresAt} expired={!isAccessActive(a.expiresAt)} />)}
                      </div>
                      <GrantAccess userId={u.id} name={u.name} courses={courses.map((c) => ({ slug: c.slug, title: c.title }))} />
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {found.length >= 200 && <p className="text-sm text-muted">Se muestran las 200 más recientes. Usa la búsqueda para encontrar a alguien.</p>}
      </PanelSection>
    </div>
  );
}
