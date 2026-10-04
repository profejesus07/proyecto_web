import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AvatarFace } from "@/components/avatar-face";
import { ClassActions, CodeCard, RemoveStudentButton } from "@/components/classes-client";
import { SpeechBubble } from "@/components/dialogue";
import { BackLink } from "@/components/ui";
import { guideSrc, type GuideAnim } from "@/content/elenco";
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

  return (
    <div className="space-y-8">
      <BackLink href="/maestro">Tus clases</BackLink>

      <header className="panel grid gap-5 p-6 sm:p-8 md:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <p className="eyebrow">Maestro del Gremio{report.class.archived ? " · Archivada" : ""}</p>
          <h1 className="text-3xl leading-tight sm:text-4xl">{report.class.name}</h1>
          {linked && courses[0] && <p className="text-muted">Clase: <strong className="text-text">{courses[0].title}</strong> · el código da acceso hasta el fin del año lectivo.</p>}
          {editable && <ClassActions classId={report.class.id} name={report.class.name} />}
        </div>
        {editable && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted">Código para unirse</p>
            <CodeCard code={report.class.code} />
            <p className="hint max-w-xs">Tus estudiantes lo escriben en <strong>Perfil → Mis clases</strong>.</p>
          </div>
        )}
      </header>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Estudiantes", value: students.length, icon: "🧑‍🎓" },
          { label: "Activos esta semana", value: activeWeek, icon: "🔥" },
          { label: "Misiones por estudiante", value: avgDone.toFixed(1).replace(".", ","), icon: "🗺️" },
          { label: "Guardianes purificados", value: guardians, icon: "👑" },
        ].map((s) => (
          <div key={s.label} className="panel flex items-center gap-4 p-5">
            <span aria-hidden="true" className="text-3xl">{s.icon}</span>
            <div><dt className="text-sm text-muted">{s.label}</dt><dd className="font-display text-3xl font-extrabold">{s.value}</dd></div>
          </div>
        ))}
      </dl>

      <SpeechBubble name={guide.name} src={guideSrc(guide, reading.anim)} alt={guide.name} className="max-w-4xl">{reading.text}</SpeechBubble>

      <section aria-labelledby="est-t" className="space-y-3">
        <h2 id="est-t" className="text-2xl">Estudiantes</h2>
        {students.length === 0 ? (
          <p className="panel p-6 text-muted">Todavía no hay estudiantes. Comparte el código de arriba para que se unan.</p>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">Avance de cada estudiante. Cada casilla muestra la mejor nota de la misión.</caption>
              <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">Estudiante</th>
                  <th scope="col" className="px-3 py-3">Rango</th>
                  <th scope="col" className="px-3 py-3">Última vez</th>
                  {courses.map((c) => (
                    <th key={c.slug} scope="colgroup" colSpan={c.missions.length} className="border-l border-line px-3 py-3 text-center">{guardianBySlug(c.guardian)?.name ?? c.title}</th>
                  ))}
                  {editable && <th scope="col" className="px-3 py-3"><span className="sr-only">Acciones</span></th>}
                </tr>
                <tr>
                  <th colSpan={3} />
                  {courses.flatMap((c) => c.missions.map((m, i) => (
                    <th key={m.id} scope="col" title={m.title} className={`px-1 pb-2 text-center font-semibold ${i === 0 ? "border-l border-line" : ""}`}>{m.isBoss ? "👑" : `M${m.position}`}</th>
                  )))}
                  {editable && <th />}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const rank = rankForXp(s.xp);
                  const byMission = new Map(s.progress.map((p) => [p.missionId, p]));
                  return (
                    <tr key={s.id} className="border-b border-line/60 last:border-0">
                      <th scope="row" className="px-4 py-3 font-semibold">
                        <span className="flex items-center gap-2"><AvatarFace base={s.avatar} look={s.avatarLook} rank={rank.key} size={32} /> <span>{s.name}{titleLabel(s.avatarLook.title) && <span className="block text-xs font-normal text-[#d9c9ff]">«{titleLabel(s.avatarLook.title)}»</span>}</span></span>
                      </th>
                      <td className="px-3 py-3"><span className="rounded-md px-1.5 text-xs font-extrabold" style={{ background: rank.color, color: "#14123b" }}>{rank.key}</span> <span className="text-muted">{s.xp} XP</span></td>
                      <td className="px-3 py-3 text-muted">{lastSeen(s.lastActive)}{s.streak > 1 ? ` · 🔥${s.streak}` : ""}</td>
                      {courses.flatMap((c) => c.missions.map((m, i) => {
                        const p = byMission.get(m.id);
                        const tone = !p ? "bg-white/5 text-muted" : p.completed ? "bg-green/20 text-[#b6f5cb]" : "bg-gold/15 text-[#ffe3a0]";
                        const label = !p ? "Sin intentar" : `${p.bestScore}% en ${p.attempts} ${p.attempts === 1 ? "intento" : "intentos"}${p.completed ? "" : ` (aún no llega al ${PASS_MARK}%)`}`;
                        return (
                          <td key={m.id} className={`px-1 py-2 text-center ${i === 0 ? "border-l border-line" : ""}`}>
                            <span title={label} className={`inline-block min-w-11 rounded-md px-1.5 py-1 text-xs font-bold ${tone}`}>{p ? `${p.bestScore}%` : "—"}<span className="sr-only">: {label}</span></span>
                          </td>
                        );
                      }))}
                      {editable && <td className="px-3 py-2 text-right"><RemoveStudentButton classId={report.class.id} studentId={s.id} name={s.name} /></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="flex flex-wrap gap-4 text-xs text-muted">
          <span><span className="mr-1 inline-block size-3 rounded-sm bg-green/40 align-middle" />Superada ({PASS_MARK}% o más)</span>
          <span><span className="mr-1 inline-block size-3 rounded-sm bg-gold/30 align-middle" />Intentada, aún sin superar</span>
          <span><span className="mr-1 inline-block size-3 rounded-sm bg-white/10 align-middle" />Sin intentar</span>
        </p>
      </section>

      <section aria-labelledby="dificiles-t" className="space-y-3">
        <h2 id="dificiles-t" className="text-2xl">Preguntas que más cuestan</h2>
        {detail.length === 0 ? (
          <p className="panel p-6 text-muted">Aparecerán aquí cuando tus estudiantes terminen algunas misiones.</p>
        ) : (
          <ol className="space-y-3">
            {detail.map((q) => (
              <li key={`${q.missionId}-${q.position}`} className="panel flex flex-wrap items-center gap-4 p-5">
                <span className={`grid size-16 shrink-0 place-items-center rounded-2xl font-display text-xl font-extrabold ${q.pct < 50 ? "bg-coral/20 text-coral" : q.pct < 75 ? "bg-gold/15 text-gold" : "bg-green/15 text-green"}`}>{q.pct}%</span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">{q.course} · {q.mission} · pregunta {q.position}</p>
                  <p className="font-semibold">{q.prompt}</p>
                  <p className="text-sm text-muted">Respuesta correcta: <span className="text-green">{q.answer}</span> · {q.right} de {q.answered} respuestas acertadas</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="text-sm text-muted">🔒 Solo tú ves este informe. Muestra el nombre de aventurero, el rango y el avance de cada estudiante; nunca su correo ni su contraseña.</p>
    </div>
  );
}
