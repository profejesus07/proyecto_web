import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AvatarFace } from "@/components/avatar-face";
import { ClassActions, CodeCard, RemoveStudentButton } from "@/components/classes-client";
import { ClassReportTable, type ReportColumn, type ReportRow } from "@/components/class-report-table";
import { GuideFace } from "@/components/guide-face";
import { Icon } from "@/components/icons";
import { PrintButton } from "@/components/print-button";
import { BackLink } from "@/components/ui";
import { Empty, Kpi, PanelHeader, PanelSection } from "@/components/workspace/ui";
import type { GuideAnim } from "@/content/elenco";
import { guideFor } from "@/lib/guides";
import { titleLabel } from "@/lib/catalog";
import { guardianBySlug } from "@/content/guardians";
import { daysAgo, lastSeen } from "@/lib/activity";
import { requireTeacher } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import type { ClassReport, CourseDetail } from "@/lib/data/types";
import { PASS_MARK } from "@/lib/game/grading";
import { rankForXp } from "@/lib/game/ranks";
import { isAdmin } from "@/lib/roles";

export const metadata: Metadata = { title: "Informe de la clase" };

export default async function ClassReportPage({ params }: PageProps<"/maestro/[id]">) {
  const { id } = await params;
  const viewer = await requireTeacher(`/maestro/${id}`);
  const repo = getRepo();
  let report: ClassReport;
  try {
    report = await repo.classReport(viewer.id, id);
  } catch {
    notFound();
  }
  // El administrador puede ver cualquier clase, pero solo su docente la gestiona.
  const own = await repo.listTeacherClasses(viewer.id);
  const mine = own.some((c) => c.id === id);
  const editable = mine && !report.class.archived;
  // Si el grupo está ligado a una clase, el informe muestra solo esa clase.
  const linked = (mine ? own : isAdmin(viewer.role) ? await repo.adminClasses(viewer.id) : []).find((c) => c.id === id)?.courseSlug ?? null;
  const allCourses = (await Promise.all((await repo.listCourses()).map((c) => repo.getCourse(c.slug)))).filter((c): c is CourseDetail => !!c);
  const courses = linked ? allCourses.filter((c) => c.slug === linked) : allCourses;
  const missions = courses.flatMap((c) => c.missions);
  const { students } = report;

  const doneOf = (s: ClassReport["students"][number]) => new Set(s.progress.filter((p) => p.completed).map((p) => p.missionId));
  const activeWeek = students.filter((s) => (daysAgo(s.lastActive) ?? 99) < 7).length;
  const avgDone = students.length ? students.reduce((n, s) => n + doneOf(s).size, 0) / students.length : 0;
  const bossIds = new Set(missions.filter((m) => m.isBoss).map((m) => m.id));
  const guardians = students.reduce((n, s) => n + [...doneOf(s)].filter((m) => bossIds.has(m)).length, 0);

  // Preguntas que más cuestan: menor porcentaje de aciertos (con al menos 2 respuestas).
  const hardest = report.questions
    .filter((q) => q.answered >= 2)
    .map((q) => ({ ...q, pct: Math.round((q.right / q.answered) * 100) }))
    .sort((a, b) => a.pct - b.pct || b.answered - a.answered)
    .slice(0, 5);
  // Lectura rápida de la clase en boca del Maestro del docente.
  const guide = guideFor(viewer)!;
  const away = students.filter((s) => (daysAgo(s.lastActive) ?? 99) >= 7).length;
  const reading: { anim: GuideAnim; text: string } = students.length === 0
    ? { anim: "saludar", text: "Cuando tus estudiantes se unan con el código, aquí verás su avance misión por misión." }
    : away > students.length / 2
      ? { anim: "alerta", text: `${away} de ${students.length} estudiantes llevan una semana o más sin entrar. Un recordatorio en clase puede reactivar la racha.` }
      : hardest[0] && hardest[0].pct < 50
        ? { anim: "pensar", text: `La pregunta que más cuesta acierta solo el ${hardest[0].pct}% de las veces. Vale la pena repasarla juntos (la ves abajo).` }
        : guardians > 0
          ? { anim: "celebrar", text: `¡La clase ya purificó ${guardians} ${guardians === 1 ? "Guardián" : "Guardianes"}! ${activeWeek} ${activeWeek === 1 ? "estudiante estuvo activo" : "estudiantes estuvieron activos"} esta semana.` }
          : { anim: "animar", text: `${activeWeek} de ${students.length} ${students.length === 1 ? "estudiante estuvo activo" : "estudiantes estuvieron activos"} esta semana. Celebra cada misión superada: la constancia se contagia.` };

  const detail = await Promise.all(hardest.map(async (q) => {
    const [play, key] = await Promise.all([repo.getMissionPlay(q.missionId), repo.getAnswerKey(q.missionId)]);
    const question = play?.questions[q.position - 1];
    const k = key[q.position - 1];
    return { ...q, mission: play?.mission.title ?? "", course: play?.course.title ?? "", prompt: question?.prompt ?? "", answer: question && k ? question.options[k.correctIndex] : "" };
  }));

  const columns: ReportColumn[] = courses.map((c) => ({
    course: guardianBySlug(c.guardian)?.name ?? c.title,
    missions: c.missions.map((m) => ({ id: m.id, label: `M${m.position}`, title: m.title, boss: m.isBoss })),
  }));
  const rows: ReportRow[] = students.map((s) => {
    const rank = rankForXp(s.xp);
    const byMission = new Map(s.progress.map((p) => [p.missionId, p]));
    const done = doneOf(s);
    return {
      id: s.id, name: s.name, title: titleLabel(s.avatarLook.title) || null,
      avatar: <AvatarFace base={s.avatar} look={s.avatarLook} rank={rank.key} size={32} />,
      rankKey: rank.key, rankColor: rank.color, xp: s.xp,
      lastSeen: lastSeen(s.lastActive), inactiveDays: daysAgo(s.lastActive), streak: s.streak,
      done: missions.filter((m) => done.has(m.id)).length, total: missions.length,
      cells: Object.fromEntries(missions.map((m) => {
        const p = byMission.get(m.id);
        return [m.id, p ? { score: p.bestScore, attempts: p.attempts, completed: p.completed } : null];
      })),
      action: editable ? <RemoveStudentButton classId={report.class.id} studentId={s.id} name={s.name} /> : undefined,
    };
  });
  const avgPct = rows.length && missions.length ? Math.round(rows.reduce((n, r) => n + r.done / r.total, 0) / rows.length * 100) : 0;
  const fileName = `informe-${report.class.name.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  return (
    <div className="space-y-8">
      <div className="print:hidden"><BackLink href="/maestro">Tus clases</BackLink></div>

      <PanelHeader eyebrow={`Informe de la clase${report.class.archived ? " · Archivada" : ""}`} title={report.class.name}
        description={linked && courses[0] ? <>Clase: <strong className="text-text">{courses[0].title}</strong> · el código da acceso hasta el fin del año lectivo.</> : "Avance de tus estudiantes misión por misión."}>
        <PrintButton className="btn btn-secondary btn-sm">Imprimir</PrintButton>
      </PanelHeader>

      {editable && (
        <section aria-label="Código y ajustes de la clase" className="panel flex flex-wrap items-center justify-between gap-4 p-5 print:hidden">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-muted">Código para unirse</p>
            <CodeCard code={report.class.code} />
            <p className="hint">Tus estudiantes lo escriben en <strong>Perfil → Mis clases</strong>.</p>
          </div>
          <ClassActions classId={report.class.id} name={report.class.name} />
        </section>
      )}

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon="people" label="Estudiantes" value={students.length} />
        <Kpi icon="flame" label="Activos esta semana" value={activeWeek} tone="ok" hint={students.length ? `${Math.round((activeWeek / students.length) * 100)} % de la clase` : undefined} />
        <Kpi icon="chart" label="Avance promedio" value={`${avgPct} %`} tone="muted" hint={`${avgDone.toFixed(1).replace(".", ",")} misiones por estudiante`} />
        <Kpi icon="crown" label="Guardianes purificados" value={guardians} tone="warn" />
      </dl>

      <div className={`flex items-start gap-3 rounded-xl border p-4 ${reading.anim === "alerta" || reading.anim === "pensar" ? "border-[#f5dfa0] bg-[#fffaeb]" : "border-line bg-white"}`}>
        <GuideFace guide={guide} size={40} />
        <p className="text-sm"><strong>{guide.name}:</strong> {reading.text}</p>
      </div>

      <PanelSection id="est-t" title="Estudiantes" description="Cada casilla muestra la mejor nota de la misión.">
        {students.length === 0 ? (
          <Empty icon="people">Todavía no hay estudiantes. Comparte el código de la clase para que se unan.</Empty>
        ) : (
          <ClassReportTable columns={columns} rows={rows} passMark={PASS_MARK} fileName={fileName} editable={editable} />
        )}
      </PanelSection>

      <PanelSection id="dificiles-t" title="Preguntas que más cuestan" description="Menor porcentaje de aciertos, con al menos dos respuestas.">
        {detail.length === 0 ? (
          <Empty icon="feedback">Aparecerán aquí cuando tus estudiantes terminen algunas misiones.</Empty>
        ) : (
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

      <p className="flex items-center gap-1.5 text-sm text-muted"><Icon name="shield" className="size-4" /> Solo tú ves este informe. Muestra el nombre de aventurero, el rango y el avance de cada estudiante; nunca su correo ni su contraseña.</p>
    </div>
  );
}
