import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpeechBubble } from "@/components/dialogue";
import { BackLink, PageTitle } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { formatPrice } from "@/lib/data/queries";
import type { PaymentStatus } from "@/lib/data/types";
import { SUPPORT_EMAIL } from "@/lib/features";
import { PROVIDER_LABEL } from "@/lib/payments/config";
import { confirmOnReturn } from "@/lib/payments/service";

export const metadata: Metadata = { title: "Estado del pago", robots: { index: false } };

const VIEW: Record<PaymentStatus, { icon: string; title: string; text: string; tone: "green" | "gold" | "red" }> = {
  aprobado: { icon: "✔", title: "¡Pago aprobado!", text: "El curso completo ya está abierto. ¡A seguir la aventura!", tone: "green" },
  pendiente: { icon: "⏳", title: "Tu pago está en proceso", text: "Algunos medios (como PSE o Efecty) tardan unos minutos. Apenas la pasarela lo confirme, el curso se abre solo. Puedes cerrar esta página.", tone: "gold" },
  rechazado: { icon: "✖", title: "El pago no se aprobó", text: "No se hizo ningún cobro. Puedes intentarlo otra vez con otro medio de pago.", tone: "red" },
  anulado: { icon: "↩", title: "El pago se anuló", text: "La pasarela anuló o reembolsó este pago, así que el curso ya no está activo por él.", tone: "red" },
  error: { icon: "⚠", title: "Hubo un problema con el pago", text: `La pasarela informó algo que no coincide con este pago. Escríbenos a ${SUPPORT_EMAIL} con la referencia y lo revisamos.`, tone: "red" },
};
const TONE = { green: "!border-green/50 text-[#b6f5cb]", gold: "!border-gold/50 text-[#ffe3a0]", red: "!border-[#ff8080]/50 text-[#ffb3b3]" };

export default async function PaymentResultPage({ params, searchParams }: PageProps<"/pago/[ref]">) {
  const { ref } = await params;
  const viewer = await requireViewer(`/pago/${ref}`);
  if (!/^UMB-[0-9A-F]{12}$/.test(ref)) notFound();
  const repo = getRepo();
  const payment = await repo.getPayment(ref);
  // Solo lo ve quien pagó o quien recibió el curso.
  if (!payment || (payment.payerId !== viewer.id && payment.userId !== viewer.id)) notFound();
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const status = await confirmOnReturn(payment, { id: one("id"), payment_id: one("payment_id"), collection_id: one("collection_id") });
  const course = (await repo.listCourses()).find((c) => c.slug === payment.courseSlug);
  const v = VIEW[status];
  const forFamily = payment.payerId === viewer.id && payment.userId !== viewer.id;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackLink href={forFamily ? "/familia" : `/portales/${payment.courseSlug}`}>{forFamily ? "Mi familia" : course?.title ?? "Volver"}</BackLink>
      <PageTitle eyebrow="Pago" title={course?.title ?? "Curso"} />
      <section className={`panel space-y-3 p-6 ${TONE[v.tone]}`} role="status" aria-live="polite">
        <h2 className="text-2xl"><span aria-hidden="true">{v.icon}</span> {v.title}</h2>
        <p className="text-text/90">{forFamily && status === "aprobado" ? "El curso completo ya está abierto en la cuenta de tu hijo o hija." : v.text}</p>
      </section>
      <dl className="panel grid grid-cols-2 gap-3 p-5 text-sm">
        <div><dt className="text-muted">Referencia</dt><dd className="font-mono font-bold">{payment.reference}</dd></div>
        <div><dt className="text-muted">Valor</dt><dd className="font-bold">{formatPrice(payment.amount)}</dd></div>
        <div><dt className="text-muted">Pasarela</dt><dd className="font-bold">{PROVIDER_LABEL[payment.provider]}</dd></div>
        <div><dt className="text-muted">Fecha</dt><dd className="font-bold">{new Date(payment.createdAt).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium", timeStyle: "short" })}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-3">
        {status === "aprobado" && !forFamily && <Link href={`/portales/${payment.courseSlug}`} className="btn btn-primary">Continuar el curso</Link>}
        {status === "pendiente" && <Link href={`/pago/${payment.reference}`} className="btn btn-primary">Actualizar</Link>}
        {(status === "rechazado" || status === "anulado") && (
          <Link href={forFamily ? "/familia" : `/suscribirse/${payment.courseSlug}`} className="btn btn-primary">Intentar de nuevo</Link>
        )}
      </div>
      <SpeechBubble name="Forjadora Brann" src="/assets/personajes/brann/brann-hablar.svg" alt="La Forjadora Brann" tone="gold">
        Guarda la referencia por si necesitas escribirnos. Nunca te pediremos tu clave del banco ni los datos de tu tarjeta.
      </SpeechBubble>
    </div>
  );
}
