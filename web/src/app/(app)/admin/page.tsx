import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { AccessChip, CreateTeacherForm, GrantAccess, PriceForm, RoleSelect } from "@/components/admin-client";
import { PageTitle } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { formatPrice } from "@/lib/data/queries";
import { ROLE_LABEL, isAccessActive } from "@/lib/roles";

export const metadata: Metadata = { title: "Administración" };

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const viewer = await requireAdmin("/admin");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const repo = getRepo();
  const [users, courses, classes] = await Promise.all([repo.adminUsers(viewer.id, q), repo.listCourses(), repo.adminClasses(viewer.id)]);
  const title = new Map(courses.map((c) => [c.slug, c.title]));
  const count = (role: string) => users.filter((u) => u.role === role).length;
  const activeAccess = users.reduce((n, u) => n + u.access.filter((a) => isAccessActive(a.expiresAt)).length, 0);

  return (
    <div className="space-y-10">
      <PageTitle eyebrow="Panel del administrador" title="Administración">
        <p>Cuentas de docente, acceso a los cursos, precios y todas las clases.</p>
      </PageTitle>
      <AdminNav current="general" />

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: q ? "Personas encontradas" : "Personas", value: users.length, icon: "👥" },
          { label: "Estudiantes", value: count("estudiante"), icon: "🧑‍🎓" },
          { label: "Docentes", value: count("docente"), icon: "🧑‍🏫" },
          { label: "Cursos activados", value: activeAccess, icon: "🔑" },
        ].map((s) => (
          <div key={s.label} className="panel flex items-center gap-4 p-5">
            <span aria-hidden="true" className="text-3xl">{s.icon}</span>
            <div><dt className="text-sm text-muted">{s.label}</dt><dd className="font-display text-3xl font-extrabold">{s.value}</dd></div>
          </div>
        ))}
      </dl>

      <section aria-labelledby="docente-t" className="panel space-y-3 p-6">
        <h2 id="docente-t" className="text-2xl">Crear cuenta de docente</h2>
        <p className="text-sm text-muted">La cuenta queda lista para entrar, con una contraseña temporal. Los docentes pueden crear clases y ver el avance de sus estudiantes, pero no cambiar sus datos ni sus notas.</p>
        <CreateTeacherForm />
      </section>

      <section aria-labelledby="personas-t" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="personas-t" className="text-2xl">Personas</h2>
          <form role="search" className="flex w-full flex-wrap gap-2 sm:w-auto">
            <label htmlFor="buscar" className="sr-only">Buscar por nombre o correo</label>
            <input id="buscar" name="q" defaultValue={q} placeholder="Buscar por nombre o correo" className="input min-w-0 flex-1 sm:!w-64 sm:flex-none" />
            <button type="submit" className="btn btn-secondary">Buscar</button>
            {q && <Link href="/admin" className="btn btn-ghost">Limpiar</Link>}
          </form>
        </div>
        {users.length === 0 ? (
          <p className="panel p-6 text-muted">No hay personas que coincidan.</p>
        ) : (
          <ul className="space-y-3">
            {users.map((u) => (
              <li key={u.id} className="panel grid gap-3 p-4 md:grid-cols-[1.2fr_auto_2fr] md:items-center">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{u.name} <span className="text-xs font-normal text-muted">· {ROLE_LABEL[u.role]} · {u.xp} XP</span></p>
                  <p className="truncate text-sm text-muted">{u.email}</p>
                  <p className="text-xs text-muted">Desde {new Date(u.createdAt).toLocaleDateString("es-CO")}{u.lastSignInAt ? ` · último ingreso ${new Date(u.lastSignInAt).toLocaleDateString("es-CO")}` : ""}</p>
                </div>
                <RoleSelect userId={u.id} role={u.role} name={u.name} />
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
        {users.length >= 200 && <p className="text-sm text-muted">Se muestran las 200 más recientes. Usa la búsqueda para encontrar a alguien.</p>}
      </section>

      <section aria-labelledby="precios-t" className="space-y-4">
        <h2 id="precios-t" className="text-2xl">Cursos y precios</h2>
        <ul className="space-y-3">
          {courses.map((c) => (
            <li key={c.slug} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-muted">Precio actual: {formatPrice(c.price)}. La primera lección siempre es gratis.</p>
              </div>
              <PriceForm course={c.slug} title={c.title} price={c.price} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="clases-t" className="space-y-4">
        <h2 id="clases-t" className="text-2xl">Todas las clases</h2>
        {classes.length === 0 ? (
          <p className="panel p-6 text-muted">Todavía no hay clases.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <li key={c.id}>
                <Link href={`/maestro/${c.id}`} className="panel flex h-full flex-col gap-1 p-4 transition hover:border-cyan/50">
                  <span className="font-semibold">{c.name}{c.archived ? " · archivada" : ""}</span>
                  <span className="text-sm text-muted">{c.teacher} · {c.members} estudiantes · código <span className="font-mono">{c.code}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
