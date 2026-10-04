import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpeechBubble } from "@/components/dialogue";
import { Sprite, asset } from "@/components/sprite";
import { BackLink } from "@/components/ui";
import { CHAPTERS } from "@/content/cronicas";
import { ELEMENT_COLOR, guardianBySlug } from "@/content/guardians";
import { requireViewer } from "@/lib/auth";
import { formatPrice, loadCourseView } from "@/lib/data/queries";
import { INFORMAL_NOTICE } from "@/lib/content";
import { SUPPORT_EMAIL } from "@/lib/features";

export const metadata: Metadata = { title: "Desbloquear curso" };

export default async function SubscribePage({ params }: PageProps<"/suscribirse/[slug]">) {
  const { slug } = await params;
  const viewer = await requireViewer(`/suscribirse/${slug}`);
  const course = await loadCourseView(viewer.id, slug);
  if (!course) notFound();
  const g = guardianBySlug(course.guardian);
  const color = ELEMENT_COLOR[course.element];
  const chapters = CHAPTERS.filter((c) => c.course === course.slug).length;
  const subject = `Quiero suscribirme a «${course.title}»`;
  const body = `Hola. Quiero activar el curso completo «${course.title}».\nMi nombre de aventurero en UMBRAL es: ${viewer.displayName}\nEl correo de mi cuenta es: `;
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href={`/portales/${course.slug}`}>{course.title}</BackLink>

      <section className="panel relative isolate grid gap-6 overflow-hidden p-6 sm:p-8 md:grid-cols-[1fr_auto]" style={{ borderColor: `${color}88` }}>
        <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(60% 90% at 90% 50%, ${color}30, transparent 70%)` }} />
        <div className="space-y-4">
          <p className="eyebrow">{course.kind === "clase" ? "Acceso anual a la clase" : "Curso completo"}</p>
          <h1 className="text-3xl leading-tight sm:text-4xl">{course.title}</h1>
          <p className="font-display text-4xl font-extrabold text-gold">{formatPrice(course.price)}</p>
          <ul className="space-y-2 text-muted">
            <li>✔ Las {course.total - 1} lecciones que siguen a la lección gratis</li>
            <li>✔ La batalla final contra {g?.name ?? "el Guardián"} y su recompensa</li>
            {chapters > 0 && <li>✔ Los {chapters} capítulos de sus Crónicas</li>}
            {course.kind === "curso"
              ? <li>✔ Tu constancia de asistencia{course.hours ? ` por ${course.hours} horas` : ""}, verificable en línea</li>
              : <li>✔ Acceso a todos los periodos{course.accessUntil ? ` hasta el ${new Date(`${course.accessUntil}T12:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}` : " durante el año lectivo"}</li>}
            <li>✔ Tu avance se conserva: sigues donde quedaste</li>
          </ul>
        </div>
        <Sprite src={asset.boss(course.guardian)} alt={g?.name ?? "El Guardián"} className="mx-auto h-44 w-auto" />
        {course.kind === "curso" && <p className="text-sm text-muted md:col-span-2">ℹ️ {INFORMAL_NOTICE}</p>}
      </section>

      {course.hasAccess ? (
        <div className="panel flex flex-wrap items-center justify-between gap-4 !border-green/50 p-5">
          <p className="font-semibold text-[#b6f5cb]">✔ Ya tienes este curso completo.</p>
          <Link href={course.next ? `/mision/${course.next.id}` : `/portales/${course.slug}`} className="btn btn-primary">Continuar</Link>
        </div>
      ) : (
        <section aria-labelledby="como-t" className="panel space-y-4 p-6">
          <h2 id="como-t" className="text-2xl">¿Cómo me suscribo?</h2>
          <SpeechBubble name="Forjadora Brann" src="/assets/personajes/brann/brann-hablar.svg" alt="La Forjadora Brann" tone="gold">
            Los pagos en línea llegan muy pronto. Mientras tanto, escríbenos y activamos tu curso a mano. Si eres menor de edad, pídele a tu acudiente que nos escriba.
          </SpeechBubble>
          <div className="flex flex-wrap items-center gap-3">
            <a href={mailto} className="btn btn-primary">✉️ Escribir para suscribirme</a>
            <span className="text-sm text-muted">o escribe a <strong className="text-text">{SUPPORT_EMAIL}</strong> con tu nombre de aventurero y el correo de tu cuenta.</span>
          </div>
        </section>
      )}
    </div>
  );
}
