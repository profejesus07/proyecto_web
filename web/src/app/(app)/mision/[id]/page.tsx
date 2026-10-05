import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ExplanationLesson } from "@/components/explanation-lesson";
import { Quiz, type QuizPowerState } from "@/components/quiz";
import { BackLink } from "@/components/ui";
import { guardianBySlug } from "@/content/guardians";
import { requirePlayer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { AIDS } from "@/lib/game/aids";
import { POWERS, POWER_KINDS, powerByItem } from "@/lib/game/powers";
import { kuroStage } from "@/lib/game/battle";
import { rankForXp } from "@/lib/game/ranks";
import { formatPrice, loadCourseView } from "@/lib/data/queries";
import { segmentOf } from "@/lib/modules";

export const metadata: Metadata = { title: "Misión" };

export default async function MissionPage({ params }: PageProps<"/mision/[id]">) {
  const { id } = await params;
  const viewer = await requirePlayer(`/mision/${id}`);
  const play = await getRepo().getMissionPlay(id);
  if (!play) notFound();
  const reading = play.mission.lessonKind === "explicacion";
  if (!reading && play.questions.length === 0) notFound();

  const course = await loadCourseView(viewer.id, play.course.slug);
  const view = course?.missions.find((m) => m.id === id);
  if (!course || !view) notFound();
  if (view.state === "bloqueada") redirect(`/portales/${course.slug}`);

  if (reading) {
    const nextLesson = course.missions.find((m) => m.position === play.mission.position + 1);
    const segment = segmentOf(course, play.mission.id);
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <BackLink href={`/portales/${course.slug}`}>{course.title}</BackLink>
        <ExplanationLesson
          missionId={play.mission.id} title={play.mission.title} intro={play.mission.intro} body={play.mission.body} videoUrl={play.mission.videoUrl}
          courseTitle={segment?.module ? `${course.title} · ${segment.module.title}` : course.title} courseSlug={course.slug}
          xpReward={play.mission.xpReward} done={view.state === "completada"} nextMissionId={nextLesson?.id ?? null}
          subscribe={nextLesson?.lock === "suscripcion" ? { href: `/suscribirse/${course.slug}`, price: formatPrice(course.price) } : null}
        />
      </div>
    );
  }

  const repo = getRepo();
  const [stock, usesToday, open, key, inventory] = await Promise.all([
    repo.getConsumables(viewer.id), repo.getAidUsesToday(viewer.id), repo.getOpenAttempt(viewer.id, id), repo.getAnswerKey(id), repo.getInventory(viewer.id),
  ]);
  // Continuar donde quedó: solo se envía lo que el estudiante ya respondió (y por tanto ya vio).
  const resume = play.questions.map((_, i) => {
    const choice = open && open.length === key.length ? open[i] : -1;
    const k = key[i];
    return choice >= 0 && k ? { choice, correct: choice === k.correctIndex, correctIndex: k.correctIndex, explanation: k.explanation, solution: k.solution } : null;
  });
  const paidToday = (itemId: string) => usesToday.filter((u) => u.itemId === itemId && !u.free).length;
  const ids = new Set(play.questions.map((q) => q.id));
  // Lo que ya reveló hoy en esta misión se conserva al recargar, sin volver a cobrar.
  const revealed: Record<string, { hint?: string; removed?: number[] }> = {};
  for (const u of usesToday) {
    if (!ids.has(u.questionId)) continue;
    revealed[u.questionId] = { ...revealed[u.questionId], ...(u.hint !== undefined && { hint: u.hint }), ...(u.removed && { removed: u.removed }) };
  }
  const aids = {
    pista: {
      stock: stock[AIDS.pista.itemId] ?? 0, usedToday: paidToday(AIDS.pista.itemId), cap: AIDS.pista.dailyCap,
      freeAvailable: !usesToday.some((u) => u.itemId === AIDS.pista.itemId && u.missionId === play.mission.id && u.free),
    },
    fifty: {
      stock: stock[AIDS["5050"].itemId] ?? 0, usedToday: paidToday(AIDS["5050"].itemId), cap: AIDS["5050"].dailyCap,
      unlocked: viewer.xp >= AIDS["5050"].minXp, minRank: AIDS["5050"].minRank,
    },
  };

  // Poderes: los que tiene (unidades o, los de rango S, en el inventario) y lo que ya activó hoy en esta misión.
  const owned = new Set(inventory.map((i) => i.itemId));
  const powers = POWER_KINDS.map((k) => {
    const r = POWERS[k];
    return { kind: k, have: r.permanent ? (owned.has(r.itemId) ? 1 : 0) : stock[r.itemId] ?? 0, usedToday: usesToday.filter((u) => u.itemId === r.itemId).length, cap: r.dailyCap, unlocked: viewer.xp >= r.minXp };
  });
  const powerState: Record<string, QuizPowerState> = {};
  let memory: Record<string, string> = {};
  for (const u of usesToday) {
    const pw = powerByItem(u.itemId);
    if (!pw || u.missionId !== play.mission.id || !ids.has(u.questionId) || !u.payload) continue;
    const st = (powerState[u.questionId] ??= {});
    const pl = u.payload;
    if (pw.kind === "rayo") st.rayo = { stems: pl.stems ?? [], lead: pl.lead ?? null };
    else if (pw.kind === "kuro") st.kuro = { hint: pl.hint ?? null, removed: pl.removed ?? [] };
    else if (pw.kind === "sombra" && pl.choice !== undefined) st.sombra = pl.choice;
    else if (pw.kind === "escudo" && !pl.spent) st.escudo = true;
    else if (pw.kind === "lluvia" && !pl.spent) st.lluvia = true;
    else if (pw.kind === "pulso" && pl.hints) memory = { ...memory, ...pl.hints };
  }

  const next = course.missions.find((m) => m.position === play.mission.position + 1);
  // Con módulos, el jefe de la lección es el Guardián de su módulo.
  const seg = segmentOf(course, play.mission.id);
  const guardianSlug = seg?.guardian ?? play.course.guardian;
  const g = guardianBySlug(guardianSlug);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href={`/portales/${course.slug}`}>{course.title}</BackLink>
      <Quiz
        key={id}
        missionId={play.mission.id}
        title={play.mission.title}
        intro={play.mission.intro}
        isBoss={play.mission.isBoss}
        xpReward={play.mission.xpReward}
        courseSlug={course.slug}
        courseTitle={seg?.module ? `${course.title} · ${seg.module.title}` : course.title}
        guardian={{ slug: guardianSlug, name: g?.name ?? "el Guardián" }}
        questions={play.questions.map((q) => ({ id: q.id, prompt: q.prompt, kind: q.kind, options: q.options, ...(q.right && { right: q.right }), hasHint: q.hasHint }))}
        aids={aids}
        powers={powers}
        powerState={powerState}
        memory={memory}
        element={play.course.element}
        resume={resume}
        kuroStage={kuroStage(rankForXp(viewer.xp).key)}
        revealed={revealed}
        nextMissionId={next?.id ?? null}
        certificateHref={course.kind === "curso" ? `/constancia/solicitar/${course.slug}` : null}
        subscribe={next?.lock === "suscripcion" ? { href: `/suscribirse/${course.slug}`, price: formatPrice(course.price) } : null}
      />
    </div>
  );
}
