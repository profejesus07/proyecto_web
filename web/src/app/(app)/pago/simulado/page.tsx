import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { simulatePaymentAction } from "@/app/actions/payments";
import { PageTitle } from "@/components/ui";
import { requirePlayer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { formatPrice } from "@/lib/data/queries";
import { isPreview } from "@/lib/env";
import { PROVIDER_LABEL } from "@/lib/payments/config";

export const metadata: Metadata = { title: "Pago simulado", robots: { index: false } };

/** Solo existe en la vista previa: hace las veces del checkout de la pasarela. */
export default async function SimulatedCheckoutPage({ searchParams }: PageProps<"/pago/simulado">) {
  if (!isPreview()) notFound();
  const viewer = await requirePlayer("/gremio");
  const ref = (await searchParams).ref;
  const payment = typeof ref === "string" ? await getRepo().getPayment(ref) : null;
  if (!payment || payment.payerId !== viewer.id) notFound();
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageTitle eyebrow={`Checkout simulado · ${PROVIDER_LABEL[payment.provider]}`} title={formatPrice(payment.amount)}>
        <p>Esto reemplaza a la pasarela en la vista previa. Con las llaves reales, aquí se abre {PROVIDER_LABEL[payment.provider]}.</p>
      </PageTitle>
      <form action={simulatePaymentAction} className="panel flex flex-wrap gap-3 p-6">
        <input type="hidden" name="ref" value={payment.reference} />
        <button name="outcome" value="aprobar" className="btn btn-primary">Aprobar el pago</button>
        <button name="outcome" value="pendiente" className="btn btn-secondary">Dejarlo pendiente</button>
        <button name="outcome" value="rechazar" className="btn btn-ghost">Rechazarlo</button>
      </form>
    </div>
  );
}
