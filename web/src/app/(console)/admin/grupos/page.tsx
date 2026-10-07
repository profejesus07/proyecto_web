import type { Metadata } from "next";
import Link from "next/link";
import { CreateLinkedClassForm } from "@/components/admin-client";
import { DeleteButton } from "@/components/delete-button";
import { Icon } from "@/components/icons";
import { Empty, Kpi, PanelHeader, PanelSection } from "@/components/workspace/ui";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Grupos y códigos · Consola" };

export default async function GroupsPage() {
  const viewer = await requireAdmin("/admin/grupos");
  const repo = getRepo();
  const [classes, users, allCourses] = await Promise.all([repo.adminClasses(viewer.id), repo.adminUsers(viewer.id, ""), repo.listAllCourses()]);
  const teachers = users.filter((u) => u.role === "docente" || u.role === "admin").map((u) => ({ id: u.id, name: u.role === "admin" ? `${u.name} (yo)` : u.name }));
  const clases = allCourses.filter((c) => c.kind === "clase").map((c) => ({ slug: c.slug, title: c.title }));
  const active = classes.filter((c) => !c.archived);

  return (
    <div className="space-y-8">
      <PanelHeader title="Grupos y códigos" description="Cada grupo tiene un docente que supervisa a sus estudiantes. Si se liga a una clase, sus estudiantes la reciben gratis hasta el fin del año lectivo." />

      <dl className="grid gap-4 sm:grid-cols-3">
        <Kpi icon="hash" label="Grupos activos" value={active.length} />
        <Kpi icon="people" label="Estudiantes en grupos" value={active.reduce((n, c) => n + c.members, 0)} tone="brand" />
        <Kpi icon="user" label="Docentes supervisando" value={new Set(active.map((c) => c.teacherId)).size} tone="muted" />
      </dl>

      <section aria-labelledby="nuevo-grupo-t" className="panel space-y-3 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accion-suave text-accion"><Icon name="plus" /></span>
          <div>
            <h2 id="nuevo-grupo-t" className="text-lg">Crear grupo</h2>
            <p className="text-sm text-muted">Elige el docente que lo supervisa. Después asigna sus estudiantes.</p>
          </div>
        </div>
        <CreateLinkedClassForm clases={clases} teachers={teachers} />
      </section>

      <PanelSection id="grupos-t" title="Todos los grupos">
        {classes.length === 0 ? <Empty icon="hash">Todavía no hay grupos.</Empty> : (
          <ul className="panel divide-y divide-line">
            {classes.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-4 p-4">
                <span className="rounded-lg bg-accion-suave px-2.5 py-1.5 font-mono text-sm font-bold tracking-[0.2em] text-accion-fuerte">{c.code}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/grupos/${c.id}`} className="font-semibold hover:text-accion hover:underline">{c.name}</Link>
                    {c.archived && <span className="badge badge-muted">Archivado</span>}
                  </p>
                  <p className="text-sm text-muted">
                    {c.courseTitle ? <>Da acceso a <strong className="text-text">{c.courseTitle}</strong></> : "Seguimiento (no da acceso)"} · {c.members} {c.members === 1 ? "estudiante" : "estudiantes"} · supervisa {c.teacher}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/grupos/${c.id}`} className="btn btn-secondary btn-sm" aria-label={`Gestionar ${c.name}`}><Icon name="people" className="size-4" /> Estudiantes</Link>
                  <Link href={`/maestro/${c.id}`} className="btn btn-secondary btn-sm" aria-label={`Informe de ${c.name}`}><Icon name="chart" className="size-4" /> Informe</Link>
                  <DeleteButton kind="grupo" id={c.id} name={c.name} consequences={[
                    `Sus ${c.members} estudiantes salen del grupo (sus cuentas y su avance se conservan).`,
                    ...(c.courseSlug ? ["Pierden el acceso a la clase que les dio el código."] : []),
                    "El código deja de funcionar. Si solo quieres cerrarlo, el docente puede archivarlo.",
                  ]} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>
    </div>
  );
}
