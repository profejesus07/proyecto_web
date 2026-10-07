import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpeechBubble } from "@/components/dialogue";
import { Sprite, asset } from "@/components/sprite";
import { PayButtons } from "@/components/pay-buttons";
import { BackLink } from "@/components/ui";
import { CHAPTERS } from "@/content/cronicas";
import { ELEMENT_COLOR, guardianBySlug } from "@/content/guardians";
import { requirePlayer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { formatPrice, loadCourseView } from "@/lib/data/queries";
import { INFORMAL_NOTICE } from "@/lib/content";
import { SUPPORT_EMAIL } from "@/lib/features";
import { isRecentPending, payOptions } from "@/lib/payments/config";

export const metadata: Metadata = { title: "Desbloquear curso" };

export default async function SubscribePage({ params }: PageProps<"/suscribirse/[slug]">) {
  const { slug } = await params;
  const viewer = await requirePlayer(`/suscribirse/${slug}`);
  const course = await loadCourseView(viewer.id, slug);
  if (!course) notFound();
  const g = guardianBySlug(course.guardian);
  const color = ELEMENT_COLOR[course.element];
  const chapters = CHAPTERS.filter((c) => c.guardian === course.guardian).length;
  const subject = `Quiero suscribirme a «${course.title}»`;
  const body = `Hola. Quiero activar el curso completo «${course.title}».\nMi nombre de aventurero en UNEX Academy es: ${viewer.displayName}\nEl correo de mi cuenta es: `;
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const { options, test } = payOptions();
  const canPay = options.length > 0 && (course.price ?? 0) > 0 && viewer.role === "estudiante";
  const pending = canPay ? (await getRepo().listPayments(viewer.id)).find((p) => p.courseSlug === course.slug && p.userId === viewer.id && isRecentPending(p)) : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href={`/portales/${course.slug}`}>{course.title}</BackLink>

      <section className="panel relative isolate grid gap-6 overflow-hidden p-6 sm:p-8 md:grid-cols-[1fr_auto]" style={{ borderColor: `${color}88` }}>
        <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(60% 90% at 90% 50%, ${color}30, transparent 70%)` }} />
        <div className="space-y-4">
          <p className="eyebrow">{course.kind === "clase" ? "Acceso anual a la clase" : "Curso completo"}</p>
          <h1 className="text-3xl leading-tight sm:text-4xl">{course.title}</h1>
          <p className="font-display text-4xl font-extrabold text-cyan">{formatPrice(course.price)}</p>
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
          <p className="font-semibold text-ok">✔ Ya tienes este curso completo.</p>
          <Link href={course.next ? `/mision/${course.next.id}` : `/portales/${course.slug}`} className="btn btn-primary">Continuar</Link>
        </div>
      ) : (
        <section aria-labelledby="como-t" className="panel space-y-4 p-6">
          <h2 id="como-t" className="text-2xl">¿Cómo me suscribo?</h2>
          {canPay ? (
            <>
              <SpeechBubble name="Forjadora Brann" src="/assets/personajes/brann/brann-hablar.svg" alt="La Forjadora Brann" tone="gold">
                Elige cómo pagar. Apenas la pasarela confirme el pago, el curso se abre solo. Si eres menor de edad, hazlo con tu acudiente.
              </SpeechBubble>
              {pending && (
                <p role="status" className="rounded-xl border border-warn/50 bg-warn/10 p-3 text-sm">
                  ⏳ Tienes un pago en proceso (referencia <span className="font-mono">{pending.reference}</span>).{" "}
                  <Link href={`/pago/${pending.reference}`} className="font-semibold text-cyan underline underline-offset-4">Ver cómo va</Link>
                </p>
              )}
              <PayButtons course={course.slug} options={options} test={test} />
              <p className="text-sm text-muted">
                ¿Prefieres otro medio? <a href={mailto} className="font-semibold text-cyan underline underline-offset-4">Escribir para suscribirme</a> a <strong className="text-text">{SUPPORT_EMAIL}</strong>.
              </p>
            </>
          ) : (
            <>
              <SpeechBubble name="Forjadora Brann" src="/assets/personajes/brann/brann-hablar.svg" alt="La Forjadora Brann" tone="gold">
                {viewer.role === "familia"
                  ? "Para pagar un curso de tu hijo o hija, entra a «Mi familia»: allí aparece el botón de pago junto a su avance."
                  : "Los pagos en línea llegan muy pronto. Mientras tanto, escríbenos y activamos tu curso a mano. Si eres menor de edad, pídele a tu acudiente que nos escriba."}
              </SpeechBubble>
              <div className="flex flex-wrap items-center gap-3">
                {viewer.role === "familia"
                  ? <Link href="/familia" className="btn btn-primary">Ir a Mi familia</Link>
                  : <a href={mailto} className="btn btn-primary">✉️ Escribir para suscribirme</a>}
                <span className="text-sm text-muted">o escribe a <strong className="text-text">{SUPPORT_EMAIL}</strong> con tu nombre de aventurero y el correo de tu cuenta.</span>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
