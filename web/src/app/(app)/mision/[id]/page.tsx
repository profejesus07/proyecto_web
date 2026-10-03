import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Quiz } from "@/components/quiz";
import { BackLink } from "@/components/ui";
import { guardianBySlug } from "@/content/guardians";
import { requireViewer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
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
        questions={play.questions.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options, hint: q.hint }))}
        nextMissionId={next?.id ?? null}
      />
    </div>
  );
}
