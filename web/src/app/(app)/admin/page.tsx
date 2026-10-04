import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { IssuerSettingsForm } from "@/components/issuer-settings-form";
import { AccessChip, CreateLinkedClassForm, CreateTeacherForm, GrantAccess, PriceForm, RoleSelect, TeacherSelect } from "@/components/admin-client";
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
  const [users, courses, classes, allCourses, everyone, settings, certs] = await Promise.all([
    repo.adminUsers(viewer.id, q), repo.listCourses(), repo.adminClasses(viewer.id), repo.listAllCourses(), q ? repo.adminUsers(viewer.id, "") : Promise.resolve(null),
    repo.getIssuerSettings(), repo.listCertificates({ limit: 50 }),
  ]);
  const teachers = (everyone ?? users).filter((u) => u.role === "docente" || u.role === "admin").map((u) => ({ id: u.id, name: u.role === "admin" ? `${u.name} (yo)` : u.name }));
  const clases = allCourses.filter((c) => c.kind === "clase").map((c) => ({ slug: c.slug, title: c.title }));
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
        <h2 id="clases-t" className="text-2xl">Grupos y códigos</h2>
        <div className="panel space-y-3 p-5">
          <h3 className="font-display text-lg font-bold">Crear grupo para una clase</h3>
          <p className="text-sm text-muted">Quien se une con el código del grupo entra gratis a la clase hasta el fin del año lectivo. El docente que elijas lo gestiona y ve el avance de sus estudiantes.</p>
          <CreateLinkedClassForm clases={clases} teachers={teachers} />
        </div>
        {classes.length === 0 ? (
          <p className="panel p-6 text-muted">Todavía no hay grupos.</p>
        ) : (
          <ul className="space-y-2">
            {classes.map((c) => (
              <li key={c.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link href={`/maestro/${c.id}`} className="font-semibold text-cyan hover:underline">{c.name}{c.archived ? " · archivado" : ""}</Link>
                  <p className="text-sm text-muted">
                    {c.courseTitle ? <>Da acceso a <strong className="text-text">{c.courseTitle}</strong></> : "Grupo propio del docente (no da acceso)"} · {c.members} estudiantes · código <span className="font-mono font-bold text-gold">{c.code}</span>
                  </p>
                </div>
                {c.courseSlug ? <TeacherSelect classId={c.id} teacherId={c.teacherId} teachers={teachers} name={c.name} /> : <span className="text-sm text-muted">{c.teacher}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="const-t" className="space-y-4">
        <h2 id="const-t" className="text-2xl">Constancias de asistencia</h2>
        <div className="panel space-y-3 p-5">
          <h3 className="font-display text-lg font-bold">Responsable y firma</h3>
          <p className="text-sm text-muted">Aparecen en todas las constancias que se expidan desde ahora. Las ya expedidas no cambian.</p>
          {(!settings.issuerName || !settings.signaturePng) && <p role="note" className="text-sm font-semibold text-[#ffe3a0]">⚠ Mientras falten el nombre y la firma, los estudiantes no podrán obtener su constancia.</p>}
          <IssuerSettingsForm settings={settings} />
        </div>
        {certs.length === 0 ? (
          <p className="panel p-5 text-muted">Todavía no se ha expedido ninguna constancia.</p>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Últimas constancias expedidas</caption>
              <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <tr><th className="px-4 py-3">N.º</th><th className="px-3 py-3">Participante</th><th className="px-3 py-3">Curso</th><th className="px-3 py-3">Expedida</th><th className="px-3 py-3">Código</th></tr>
              </thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c.code} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-2 font-mono">{String(c.number).padStart(6, "0")}</td>
                    <td className="px-3 py-2">{c.participantName}</td>
                    <td className="px-3 py-2">{c.courseTitle} · {c.hours} h</td>
                    <td className="px-3 py-2">{new Date(c.issuedAt).toLocaleDateString("es-CO")}</td>
                    <td className="px-3 py-2"><Link href={`/constancia/${c.code}`} className="font-mono text-cyan hover:underline">{c.code}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
