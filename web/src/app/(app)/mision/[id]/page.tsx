import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Quiz } from "@/components/quiz";
import { BackLink } from "@/components/ui";
import { guardianBySlug } from "@/content/guardians";
import { requireViewer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { AIDS } from "@/lib/game/aids";
import { kuroStage } from "@/lib/game/battle";
import { rankForXp } from "@/lib/game/ranks";
import { loadCourseView } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Misión" };

export default async function MissionPage({ params }: PageProps<"/mision/[id]">) {
  const { id } = await params;
  const viewer = await requireViewer(`/mision/${id}`);
  const play = await getRepo().getMissionPlay(id);
  if (!play || play.questions.length === 0) notFound();

  const course = await loadCourseView(viewer.id, play.course.slug);
  const view = course?.missions.find((m) => m.id === id);
  if (!course || !view) notFound();
  if (view.state === "bloqueada") redirect(`/portales/${course.slug}`);

  const repo = getRepo();
  const [stock, usesToday, open, key] = await Promise.all([
    repo.getConsumables(viewer.id), repo.getAidUsesToday(viewer.id), repo.getOpenAttempt(viewer.id, id), repo.getAnswerKey(id),
  ]);
  // Continuar donde quedó: solo se envía lo que el estudiante ya respondió (y por tanto ya vio).
  const resume = play.questions.map((_, i) => {
    const choice = open && open.length === key.length ? open[i] : -1;
    const k = key[i];
    return choice >= 0 && k ? { choice, correct: choice === k.correctIndex, correctIndex: k.correctIndex, explanation: k.explanation } : null;
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

  const next = course.missions.find((m) => m.position === play.mission.position + 1);
  const g = guardianBySlug(play.course.guardian);

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
        courseTitle={course.title}
        guardian={{ slug: play.course.guardian, name: g?.name ?? "el Guardián" }}
        questions={play.questions.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options, hasHint: q.hasHint }))}
        aids={aids}
        element={play.course.element}
        resume={resume}
        kuroStage={kuroStage(rankForXp(viewer.xp).key)}
        revealed={revealed}
        nextMissionId={next?.id ?? null}
      />
    </div>
  );
}
