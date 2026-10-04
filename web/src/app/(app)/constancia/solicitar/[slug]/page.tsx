import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requestCertificateAction } from "@/app/actions/certificates";
import { CertificateRequestForm } from "@/components/certificate-form";
import { SpeechBubble } from "@/components/dialogue";
import { asset } from "@/components/sprite";
import { BackLink } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { INFORMAL_NOTICE } from "@/lib/content";
import { getRepo } from "@/lib/data";
import { loadCourseView } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Solicitar constancia" };

export default async function RequestCertificatePage({ params }: PageProps<"/constancia/solicitar/[slug]">) {
  const { slug } = await params;
  const viewer = await requireViewer(`/constancia/solicitar/${slug}`);
  const course = await loadCourseView(viewer.id, slug);
  if (!course || course.kind !== "curso") notFound();
  const existing = (await getRepo().listCertificates({ userId: viewer.id })).find((c) => c.courseSlug === slug);
  if (existing) redirect(`/constancia/${existing.code}`);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackLink href={`/portales/${slug}`}>{course.title}</BackLink>
      <header className="space-y-2">
        <p className="eyebrow">Constancia de asistencia</p>
        <h1 className="text-3xl leading-tight sm:text-4xl">{course.title}</h1>
        <p className="text-muted">{course.hours ? `${course.hours} horas · ` : ""}{course.trainerName ? `Formador: ${course.trainerName}` : ""}</p>
      </header>
      {course.status !== "completado" ? (
        <div className="panel space-y-3 p-6">
          <p className="font-semibold">Aún te faltan {course.total - course.done} {course.total - course.done === 1 ? "lección" : "lecciones"} para terminar el curso.</p>
          <p className="text-muted">La constancia se expide cuando completas todas las lecciones, incluida la prueba final.</p>
          <Link href={course.next ? `/mision/${course.next.id}` : `/portales/${slug}`} className="btn btn-primary">Continuar el curso</Link>
        </div>
      ) : (
        <section className="panel space-y-5 p-6 sm:p-8" aria-label="Datos para la constancia">
          <SpeechBubble name="Maestra Sora" src={asset.sora("celebrar")} alt="La Maestra Sora celebra" tone="gold">
            ¡Terminaste el curso! Escribe tus datos tal como aparecen en tu documento de identidad: así quedarán en tu constancia.
          </SpeechBubble>
          <CertificateRequestForm action={requestCertificateAction.bind(null, slug)} />
          <p className="text-xs text-muted">ℹ️ {INFORMAL_NOTICE} Tus datos se usan solo para expedir y verificar la constancia.</p>
        </section>
      )}
    </div>
  );
}
