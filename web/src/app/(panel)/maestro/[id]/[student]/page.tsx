import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AvatarFace } from "@/components/avatar-face";
import { Icon } from "@/components/icons";
import { PrintButton } from "@/components/print-button";
import { BackLink } from "@/components/ui";
import { Kpi, PanelHeader, PanelSection } from "@/components/workspace/ui";
import { guardianBySlug } from "@/content/guardians";
import { lastSeen } from "@/lib/activity";
import { requireTeacher } from "@/lib/auth";
import { titleLabel } from "@/lib/catalog";
import { getRepo } from "@/lib/data";
import type { ClassReport, ClassSummary } from "@/lib/data/types";
import { PASS_MARK } from "@/lib/game/grading";
import { rankForXp } from "@/lib/game/ranks";
import { isAdmin } from "@/lib/roles";
import { groupCourses, publishedCourses, studentStat } from "@/lib/supervision";

export const metadata: Metadata = { title: "Detalle del estudiante" };

/** Detalle de un estudiante del grupo: avance por curso y misión, notas, intentos y actividad. */
export default async function StudentDetailPage({ params }: PageProps<"/maestro/[id]/[student]">) {
  const { id, student: studentId } = await params;
  const viewer = await requireTeacher(`/maestro/${id}/${studentId}`);
  const repo = getRepo();
  let report: ClassReport;
  try {
    report = await repo.classReport(viewer.id, id);
  } catch {
    notFound();
  }
  const s = report.students.find((x) => x.id === studentId);
  if (!s) notFound();
  const summary: Pick<ClassSummary, "courseSlug"> | undefined = isAdmin(viewer.role)
    ? (await repo.adminClasses(viewer.id)).find((c) => c.id === id)
    : (await repo.listTeacherClasses(viewer.id)).find((c) => c.id === id);
  if (!summary) notFound();
  const courses = groupCourses(summary, await publishedCourses(repo));
  const st = studentStat(s, courses.flatMap((c) => c.missions));
  const rank = rankForXp(s.xp);
  const byMission = new Map(s.progress.map((p) => [p.missionId, p]));
  const title = titleLabel(s.avatarLook.title);

  return (
    <div className="space-y-8">
      <div className="print:hidden"><BackLink href={`/maestro/${id}`}>{report.class.name}</BackLink></div>

      <PanelHeader eyebrow={`Estudiante · ${report.class.name}`} title={s.name} description={
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded px-1.5 text-xs font-extrabold text-[#14123b]" style={{ background: rank.color }}>Rango {rank.key}</span>
          <span>{s.xp} XP</span>
          {title && <span>· «{title}»</span>}
          <span>· Última actividad: {lastSeen(s.lastActive)}</span>
          {s.streak > 1 && <span className="inline-flex items-center gap-1">· <Icon name="flame" className="size-4 text-[#c2410c]" /> racha de {s.streak} días</span>}
        </span>
      }>
        <PrintButton className="btn btn-secondary btn-sm">Imprimir</PrintButton>
      </PanelHeader>

      <div className="flex items-center gap-4">
        <AvatarFace base={s.avatar} look={s.avatarLook} rank={rank.key} size={64} />
        {st.needsSupport
          ? <p className="flex items-center gap-2 rounded-xl border border-[#f5dfa0] bg-[#fffaeb] px-4 py-2.5 text-sm"><Icon name="alert" className="size-5 text-warn" /> Necesita apoyo: {st.reason}.</p>
          : <p className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm"><Icon name="check" className="size-5 text-ok" /> Va al día: activo esta semana y sin retos pendientes.</p>}
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon="chart" label="Avance" value={`${st.pct} %`} hint={`${st.done} de ${st.total} misiones superadas`} />
        <Kpi icon="target" label="Promedio de notas" value={st.avgScore === null ? "—" : `${st.avgScore} %`} tone={st.avgScore !== null && st.avgScore >= PASS_MARK ? "ok" : "warn"} hint="Mejor nota de cada misión intentada" />
        <Kpi icon="feedback" label="Intentos" value={st.attempts} tone="muted" hint={st.pending ? `${st.pending} ${st.pending === 1 ? "misión" : "misiones"} sin superar` : "Sin retos pendientes"} />
        <Kpi icon="crown" label="Guardianes vencidos" value={st.bosses} tone="warn" />
      </dl>

      {courses.map((c) => {
        const done = c.missions.filter((m) => byMission.get(m.id)?.completed).length;
        const pct = c.missions.length ? Math.round((done / c.missions.length) * 100) : 0;
        return (
          <PanelSection key={c.slug} id={`curso-${c.slug}`} title={c.title} description={`Guardián: ${guardianBySlug(c.guardian)?.name ?? c.guardian} · ${done} de ${c.missions.length} misiones superadas`}
            action={<span className="flex w-48 items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eceef4]"><span className="block h-full rounded-full bg-[#4a22c9]" style={{ width: `${pct}%` }} /></span><span className="text-sm font-semibold tabular-nums">{pct} %</span></span>}>
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <caption className="sr-only">Avance de {s.name} en {c.title}</caption>
                <thead className="border-b border-line bg-[#f8f8fc] text-xs uppercase tracking-wider text-muted">
                  <tr><th className="w-14 px-4 py-3">N.º</th><th className="px-3 py-3">Misión</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3 text-right">Mejor nota</th><th className="px-3 py-3 text-right">Intentos</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {c.missions.map((m) => {
                    const p = byMission.get(m.id);
                    const state = !p ? { label: "Sin intentar", badge: "badge-muted" } : p.completed ? { label: "Superada", badge: "badge-ok" } : { label: `En curso (menos del ${PASS_MARK} %)`, badge: "badge-warn" };
                    return (
                      <tr key={m.id}>
                        <td className="px-4 py-3 tabular-nums text-muted">{m.position}</td>
                        <th scope="row" className="px-3 py-3 font-medium">
                          <span className="flex items-center gap-2">{m.title}{m.isBoss && <span className="badge badge-brand"><Icon name="crown" className="size-3.5" /> Reto del Guardián</span>}{m.lessonKind === "explicacion" && <span className="badge badge-muted">Explicación</span>}</span>
                        </th>
                        <td className="px-3 py-3"><span className={`badge ${state.badge}`}>{state.label}</span></td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums">{p ? `${p.bestScore} %` : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-muted">{p?.attempts ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </PanelSection>
        );
      })}
    </div>
  );
}
