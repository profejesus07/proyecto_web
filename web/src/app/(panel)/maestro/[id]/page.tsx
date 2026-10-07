import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvatarFace } from "@/components/avatar-face";
import { ClassReportTable, type ReportColumn, type ReportRow } from "@/components/class-report-table";
import { Icon } from "@/components/icons";
import { PrintButton } from "@/components/print-button";
import { BackLink } from "@/components/ui";
import { Empty, Kpi, PanelHeader, PanelSection } from "@/components/workspace/ui";
import { guardianBySlug } from "@/content/guardians";
import { lastSeen } from "@/lib/activity";
import { requireTeacher } from "@/lib/auth";
import { titleLabel } from "@/lib/catalog";
import { getRepo } from "@/lib/data";
import type { ClassReport, ClassSummary } from "@/lib/data/types";
import { PASS_MARK } from "@/lib/game/grading";
import { rankForXp } from "@/lib/game/ranks";
import { isAdmin } from "@/lib/roles";
import { overview, publishedCourses } from "@/lib/supervision";

export const metadata: Metadata = { title: "Informe del grupo" };

/** Informe de un grupo: solo lectura. El docente ve el avance; el administrador gestiona el grupo desde su consola. */
export default async function GroupReportPage({ params }: PageProps<"/maestro/[id]">) {
  const { id } = await params;
  const viewer = await requireTeacher(`/maestro/${id}`);
  const repo = getRepo();
  let report: ClassReport;
  try {
    report = await repo.classReport(viewer.id, id);
  } catch {
    notFound();
  }
  const admin = isAdmin(viewer.role);
  const summary: ClassSummary | undefined = admin
    ? (await repo.adminClasses(viewer.id)).map((c) => ({ ...c, createdAt: report.class.createdAt })).find((c) => c.id === id)
    : (await repo.listTeacherClasses(viewer.id)).find((c) => c.id === id);
  if (!summary) notFound();
  const all = await publishedCourses(repo);
  const g = overview(summary, report.students, all);
  const byId = new Map(g.stats.map((st) => [st.student.id, st]));

  // Preguntas que más cuestan: menor porcentaje de aciertos (con al menos 2 respuestas).
  const missionIds = new Set(g.missions.map((m) => m.id));
  const hardest = report.questions
    .filter((q) => q.answered >= 2 && missionIds.has(q.missionId))
    .map((q) => ({ ...q, pct: Math.round((q.right / q.answered) * 100) }))
    .sort((a, b) => a.pct - b.pct || b.answered - a.answered)
    .slice(0, 5);
  const detail = await Promise.all(hardest.map(async (q) => {
    const [play, key] = await Promise.all([repo.getMissionPlay(q.missionId), repo.getAnswerKey(q.missionId)]);
    const question = play?.questions[q.position - 1];
    const k = key[q.position - 1];
    return { ...q, mission: play?.mission.title ?? "", course: play?.course.title ?? "", prompt: question?.prompt ?? "", answer: question && k ? question.options[k.correctIndex] : "" };
  }));

  const bosses = g.stats.reduce((n, st) => n + st.bosses, 0);
  const insight = report.students.length === 0
    ? { warn: false, text: "Cuando el administrador asigne estudiantes a este grupo, aquí verás su avance misión por misión." }
    : g.stats.length - g.activeWeek > g.stats.length / 2
      ? { warn: true, text: `${g.stats.length - g.activeWeek} de ${g.stats.length} estudiantes llevan una semana o más sin entrar. Un recordatorio puede reactivar su ritmo.` }
      : detail[0] && detail[0].pct < 50
        ? { warn: true, text: `La pregunta que más cuesta solo se acierta el ${detail[0].pct} % de las veces. Vale la pena repasarla en clase (la ves abajo).` }
        : { warn: false, text: `${g.activeWeek} de ${g.stats.length} estudiantes estuvieron activos esta semana y el avance promedio es del ${g.avgPct} %.` };

  const columns: ReportColumn[] = g.courses.map((c) => ({
    course: guardianBySlug(c.guardian)?.name ?? c.title,
    missions: c.missions.map((m) => ({ id: m.id, label: `M${m.position}`, title: m.title, boss: m.isBoss })),
  }));
  const rows: ReportRow[] = report.students.map((s) => {
    const rank = rankForXp(s.xp);
    const st = byId.get(s.id)!;
    const byMission = new Map(s.progress.map((p) => [p.missionId, p]));
    return {
      id: s.id, name: s.name, title: titleLabel(s.avatarLook.title) || null,
      avatar: <AvatarFace base={s.avatar} look={s.avatarLook} rank={rank.key} size={32} />,
      rankKey: rank.key, rankColor: rank.color, xp: s.xp,
      lastSeen: lastSeen(s.lastActive), inactiveDays: st.inactiveDays, streak: s.streak,
      done: st.done, total: st.total, href: `/maestro/${id}/${s.id}`,
      cells: Object.fromEntries(g.missions.map((m) => {
        const p = byMission.get(m.id);
        return [m.id, p ? { score: p.bestScore, attempts: p.attempts, completed: p.completed } : null];
      })),
    };
  });
  const fileName = `informe-${report.class.name.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  return (
    <div className="space-y-8">
      <div className="print:hidden"><BackLink href={admin ? `/admin/grupos/${id}` : "/maestro"}>{admin ? "Gestionar el grupo" : "Resumen"}</BackLink></div>

      <PanelHeader eyebrow={`Informe del grupo${report.class.archived ? " · Archivado" : ""}`} title={report.class.name}
        description={summary.courseTitle ? <>Clase: <strong className="text-text">{summary.courseTitle}</strong></> : "Seguimiento general: todos los cursos publicados."}>
        <PrintButton className="btn btn-secondary btn-sm">Imprimir</PrintButton>
      </PanelHeader>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon="people" label="Estudiantes" value={report.students.length} />
        <Kpi icon="flame" label="Activos esta semana" value={g.activeWeek} tone="ok" hint={g.stats.length ? `${Math.round((g.activeWeek / g.stats.length) * 100)} % del grupo` : undefined} />
        <Kpi icon="chart" label="Avance promedio" value={`${g.avgPct} %`} tone="muted" hint={`${g.needSupport} necesitan apoyo`} />
        <Kpi icon="crown" label="Guardianes vencidos" value={bosses} tone="warn" />
      </dl>

      <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${insight.warn ? "border-[#f5dfa0] bg-[#fffaeb]" : "border-line bg-white"}`}>
        <Icon name={insight.warn ? "alert" : "chart"} className={`mt-0.5 size-5 shrink-0 ${insight.warn ? "text-warn" : "text-accion"}`} />
        <p>{insight.text}</p>
      </div>

      <PanelSection id="est-t" title="Estudiantes" description="Cada casilla muestra la mejor nota de la misión. Abre un nombre para ver su detalle.">
        {report.students.length === 0 ? <Empty icon="people">Este grupo todavía no tiene estudiantes.</Empty> : (
          <ClassReportTable columns={columns} rows={rows} passMark={PASS_MARK} fileName={fileName} editable={false} />
        )}
      </PanelSection>

      <PanelSection id="dificiles-t" title="Preguntas que más cuestan" description="Menor porcentaje de aciertos, con al menos dos respuestas.">
        {detail.length === 0 ? <Empty icon="feedback">Aparecerán aquí cuando los estudiantes terminen algunas misiones.</Empty> : (
          <ol className="panel divide-y divide-line">
            {detail.map((q) => (
              <li key={`${q.missionId}-${q.position}`} className="flex flex-wrap items-center gap-4 p-4">
                <span className={`grid size-14 shrink-0 place-items-center rounded-xl text-lg font-bold tabular-nums ${q.pct < 50 ? "bg-[#fdecea] text-[#b42318]" : q.pct < 75 ? "bg-[#fff4d6] text-[#8a5a00]" : "bg-[#e7f6ee] text-[#0f6b3a]"}`}>{q.pct}%</span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{q.course} · {q.mission} · pregunta {q.position}</p>
                  <p className="font-semibold">{q.prompt}</p>
                  <p className="text-sm text-muted">Respuesta correcta: <span className="font-medium text-ok">{q.answer}</span> · {q.right} de {q.answered} respuestas acertadas</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </PanelSection>

      <p className="flex items-center gap-1.5 text-sm text-muted"><Icon name="shield" className="size-4" /> Muestra el nombre de aventurero, el rango y el avance de cada estudiante; nunca su correo ni su contraseña.</p>
      {admin && <p className="text-sm"><Link href={`/admin/grupos/${id}`} className="font-semibold text-accion hover:underline">Asignar o quitar estudiantes →</Link></p>}
    </div>
  );
}
