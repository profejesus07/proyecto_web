import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TeacherSelect } from "@/components/admin-client";
import { AvatarFace } from "@/components/avatar-face";
import { AssignStudents, ClassActions, CodeCard, RemoveStudentButton } from "@/components/classes-client";
import { DeleteButton } from "@/components/delete-button";
import { Icon } from "@/components/icons";
import { Empty, Kpi, PanelHeader, PanelSection } from "@/components/workspace/ui";
import { lastSeen } from "@/lib/activity";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { rankForXp } from "@/lib/game/ranks";
import { overview, publishedCourses } from "@/lib/supervision";

export const metadata: Metadata = { title: "Grupo · Consola" };

/** Gestión de un grupo: su docente, su código y los estudiantes que supervisa. */
export default async function AdminGroupPage({ params }: PageProps<"/admin/grupos/[id]">) {
  const { id } = await params;
  const viewer = await requireAdmin(`/admin/grupos/${id}`);
  const repo = getRepo();
  const [classes, users, all] = await Promise.all([repo.adminClasses(viewer.id), repo.adminUsers(viewer.id, ""), publishedCourses(repo)]);
  const group = classes.find((c) => c.id === id);
  if (!group) notFound();
  const report = await repo.classReport(viewer.id, id);
  const g = overview({ ...group, createdAt: report.class.createdAt }, report.students, all);
  const stats = new Map(g.stats.map((st) => [st.student.id, st]));
  const members = new Set(report.students.map((s) => s.id));
  const candidates = users.filter((u) => u.role === "estudiante" && !members.has(u.id)).map((u) => ({ id: u.id, name: u.name, email: u.email }));
  const teachers = users.filter((u) => u.role === "docente" || u.role === "admin").map((u) => ({ id: u.id, name: u.role === "admin" ? `${u.name} (yo)` : u.name }));

  return (
    <div className="space-y-8">
      <Link href="/admin/grupos" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text"><Icon name="arrow" className="size-4 rotate-180" /> Grupos y códigos</Link>

      <PanelHeader eyebrow={group.archived ? "Grupo · Archivado" : "Grupo"} title={group.name}
        description={group.courseTitle ? <>Da acceso a <strong className="text-text">{group.courseTitle}</strong> hasta el fin del año lectivo.</> : "Grupo de seguimiento: no da acceso a ninguna clase."}>
        <Link href={`/maestro/${id}`} className="btn btn-primary btn-sm"><Icon name="chart" className="size-4" /> Ver informe</Link>
      </PanelHeader>

      <dl className="grid gap-4 sm:grid-cols-3">
        <Kpi icon="people" label="Estudiantes" value={report.students.length} />
        <Kpi icon="chart" label="Avance promedio" value={`${g.avgPct} %`} tone="muted" />
        <Kpi icon="alert" label="Necesitan apoyo" value={g.needSupport} tone="warn" />
      </dl>

      <section aria-labelledby="ajustes-t" className="panel grid gap-6 p-5 sm:p-6 lg:grid-cols-3">
        <h2 id="ajustes-t" className="sr-only">Ajustes del grupo</h2>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-muted">Docente que lo supervisa</p>
          <TeacherSelect classId={id} teacherId={group.teacherId} teachers={teachers} name={group.name} />
          <p className="hint">Ve el avance de estos estudiantes en su panel.</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-muted">Código del grupo</p>
          <CodeCard code={group.code} />
          <p className="hint">Los estudiantes también pueden unirse escribiéndolo en Perfil → Mis clases.</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted">Acciones</p>
          {!group.archived && <ClassActions classId={id} name={group.name} />}
          <DeleteButton kind="grupo" id={id} name={group.name} after="/admin/grupos" consequences={[
            `Sus ${group.members} estudiantes salen del grupo (sus cuentas y su avance se conservan).`,
            ...(group.courseSlug ? ["Pierden el acceso a la clase que les dio el grupo."] : []),
            "El código deja de funcionar. Si solo quieres cerrarlo, archívalo.",
          ]} />
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <PanelSection id="miembros-t" title="Estudiantes del grupo" description="El docente supervisa su avance.">
          {report.students.length === 0 ? <Empty icon="people">Todavía no hay estudiantes. Asígnalos desde el panel de la derecha.</Empty> : (
            <ul className="panel divide-y divide-line">
              {report.students.map((s) => {
                const st = stats.get(s.id)!;
                return (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <AvatarFace base={s.avatar} look={s.avatarLook} rank={rankForXp(s.xp).key} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{s.name}</p>
                      <p className="text-xs text-muted">{st.pct} % de avance · {lastSeen(s.lastActive)}</p>
                    </div>
                    {st.needsSupport && <span className="badge badge-warn">{st.reason}</span>}
                    {!group.archived && <RemoveStudentButton classId={id} studentId={s.id} name={s.name} />}
                  </li>
                );
              })}
            </ul>
          )}
        </PanelSection>
        <PanelSection id="asignar-t" title="Asignar estudiantes" description="Elige uno o varios y pulsa «Asignar».">
          {group.archived ? <Empty icon="layers">El grupo está archivado.</Empty> : (
            <div className="panel p-4"><AssignStudents classId={id} students={candidates} /></div>
          )}
        </PanelSection>
      </div>
    </div>
  );
}
