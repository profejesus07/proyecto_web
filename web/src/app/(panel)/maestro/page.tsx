import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AvatarFace } from "@/components/avatar-face";
import { Icon } from "@/components/icons";
import { Empty, Kpi, PanelHeader, PanelSection } from "@/components/workspace/ui";
import { lastSeen } from "@/lib/activity";
import { requireTeacher } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { rankForXp } from "@/lib/game/ranks";
import { isAdmin } from "@/lib/roles";
import { overview, publishedCourses, type StudentStat } from "@/lib/supervision";

export const metadata: Metadata = { title: "Panel docente" };

function Bar({ pct, label }: { pct: number; label: string }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[#eceef4]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span className="block h-full rounded-full bg-violet" style={{ width: `${pct}%` }} />
    </span>
  );
}

export default async function TeacherHome() {
  const viewer = await requireTeacher("/maestro");
  // El administrador ve y gestiona los grupos desde su consola.
  if (isAdmin(viewer.role)) redirect("/admin/grupos");
  const repo = getRepo();
  const [classes, all] = await Promise.all([repo.listTeacherClasses(viewer.id), publishedCourses(repo)]);
  const active = classes.filter((c) => !c.archived);
  const reports = await Promise.all(active.map((c) => repo.classReport(viewer.id, c.id)));
  const groups = active.map((g, i) => overview(g, reports[i].students, all));

  // Un estudiante puede estar en varios grupos: se cuenta una vez (con su mejor avance).
  const byStudent = new Map<string, { stat: StudentStat; groupId: string; groupName: string }>();
  for (const g of groups) for (const st of g.stats) {
    const prev = byStudent.get(st.student.id);
    if (!prev || st.pct > prev.stat.pct) byStudent.set(st.student.id, { stat: st, groupId: g.group.id, groupName: g.group.name });
  }
  const students = [...byStudent.values()];
  const activeWeek = students.filter((s) => s.stat.inactiveDays !== null && s.stat.inactiveDays < 7).length;
  const avgPct = students.length ? Math.round(students.reduce((n, s) => n + s.stat.pct, 0) / students.length) : 0;
  const support = students.filter((s) => s.stat.needsSupport).sort((a, b) => (b.stat.inactiveDays ?? 999) - (a.stat.inactiveDays ?? 999));

  return (
    <div className="space-y-8">
      <PanelHeader eyebrow="Panel docente" title="Resumen" description="Progreso y estadísticas de los estudiantes que te asignó la academia." />

      {active.length === 0 ? (
        <Empty icon="people">
          <strong className="block text-base text-text">Todavía no tienes estudiantes asignados</strong>
          El administrador de la academia te asigna grupos de estudiantes desde su consola. Cuando lo haga, aquí verás su avance.
        </Empty>
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon="people" label="Estudiantes asignados" value={students.length} hint={`En ${active.length} ${active.length === 1 ? "grupo" : "grupos"}`} />
            <Kpi icon="flame" label="Activos esta semana" value={activeWeek} tone="ok" hint={students.length ? `${Math.round((activeWeek / students.length) * 100)} % del total` : undefined} />
            <Kpi icon="chart" label="Avance promedio" value={`${avgPct} %`} tone="muted" hint="Misiones superadas" />
            <Kpi icon="alert" label="Necesitan apoyo" value={support.length} tone="warn" hint="Inactivos o con retos pendientes" />
          </dl>

          <PanelSection id="grupos-t" title="Mis grupos">
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((g) => (
                <li key={g.group.id}>
                  <Link href={`/maestro/${g.group.id}`} className="panel group flex h-full flex-col gap-4 p-5 transition hover:border-line-fuerte hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg">{g.group.name}</h3>
                        <p className="break-words text-sm text-muted">{g.group.courseTitle ?? "Seguimiento general"}</p>
                      </div>
                      {g.needSupport > 0 && <span className="badge badge-warn shrink-0">{g.needSupport} con apoyo</span>}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted"><span>Avance promedio</span><span className="font-semibold text-text">{g.avgPct} %</span></div>
                      <Bar pct={g.avgPct} label={`Avance promedio de ${g.group.name}`} />
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-sm text-muted">
                      <span className="flex items-center gap-1.5"><Icon name="people" className="size-4" /> {g.group.members} {g.group.members === 1 ? "estudiante" : "estudiantes"}</span>
                      <span className="flex items-center gap-1.5"><Icon name="flame" className="size-4" /> {g.activeWeek} activos</span>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-accion">Ver informe <Icon name="arrow" className="size-4 transition group-hover:translate-x-0.5" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </PanelSection>

          <PanelSection id="apoyo-t" title="Necesitan apoyo" description="Llevan una semana o más sin entrar, o tienen retos intentados que aún no superan.">
            {support.length === 0 ? <Empty icon="check">Nadie necesita apoyo ahora mismo. ¡Buen ritmo!</Empty> : (
              <div className="panel overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <caption className="sr-only">Estudiantes que necesitan apoyo</caption>
                  <thead className="border-b border-line bg-[#f8f8fc] text-xs uppercase tracking-wider text-muted">
                    <tr><th className="px-4 py-3">Estudiante</th><th className="px-3 py-3">Grupo</th><th className="px-3 py-3">Motivo</th><th className="px-3 py-3">Avance</th><th className="px-3 py-3">Última vez</th><th className="px-3 py-3"><span className="sr-only">Detalle</span></th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {support.map(({ stat, groupId, groupName }) => (
                      <tr key={stat.student.id} className="hover:bg-[#fafafd]">
                        <th scope="row" className="px-4 py-3 font-semibold">
                          <span className="flex items-center gap-2.5"><AvatarFace base={stat.student.avatar} look={stat.student.avatarLook} rank={rankForXp(stat.student.xp).key} size={30} />{stat.student.name}</span>
                        </th>
                        <td className="px-3 py-3 text-muted">{groupName}</td>
                        <td className="px-3 py-3"><span className="badge badge-warn">{stat.reason}</span></td>
                        <td className="w-40 px-3 py-3"><span className="flex items-center gap-2"><Bar pct={stat.pct} label={`Avance de ${stat.student.name}`} /><span className="tabular-nums text-muted">{stat.pct}%</span></span></td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted">{lastSeen(stat.student.lastActive)}</td>
                        <td className="px-3 py-3 text-right"><Link href={`/maestro/${groupId}/${stat.student.id}`} className="btn btn-secondary btn-sm">Ver detalle</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PanelSection>
        </>
      )}

      {classes.some((c) => c.archived) && (
        <details className="panel p-5">
          <summary className="cursor-pointer font-semibold">Grupos archivados ({classes.filter((c) => c.archived).length})</summary>
          <ul className="mt-3 divide-y divide-line">
            {classes.filter((c) => c.archived).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link href={`/maestro/${c.id}`} className="font-medium hover:text-accion hover:underline">{c.name}</Link>
                <span className="text-muted">{c.members} estudiantes</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
