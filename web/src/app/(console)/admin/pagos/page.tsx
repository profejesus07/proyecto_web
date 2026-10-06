import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { PAYMENT_STATUS, dateTime } from "@/components/workspace/admin-format";
import { Empty, Kpi, PanelHeader, PanelSection } from "@/components/workspace/ui";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { formatPrice } from "@/lib/data/queries";
import { PROVIDER_LABEL, isTestMode, providerMode } from "@/lib/payments/config";
import { siteUrl } from "@/lib/site";
import type { PaymentProvider } from "@/lib/data/types";

export const metadata: Metadata = { title: "Pagos · Consola" };

export default async function PaymentsPage() {
  const viewer = await requireAdmin("/admin/pagos");
  const [payments, site] = await Promise.all([getRepo().adminPayments(viewer.id), siteUrl()]);
  const providers: { id: PaymentProvider; env: string; hook: string }[] = [
    { id: "wompi", env: "WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET y WOMPI_EVENTS_SECRET", hook: `${site}/api/pagos/wompi` },
    { id: "mercadopago", env: "MERCADOPAGO_ACCESS_TOKEN (y MERCADOPAGO_WEBHOOK_SECRET)", hook: `${site}/api/pagos/mercadopago` },
  ];
  const sum = (s: string) => payments.filter((p) => p.status === s).reduce((n, p) => n + p.amount, 0);
  const n = (s: string) => payments.filter((p) => p.status === s).length;

  return (
    <div className="space-y-8">
      <PanelHeader title="Pagos en línea" description="Estado de las pasarelas y los últimos pagos de los cursos." />

      <dl className="grid gap-4 sm:grid-cols-3">
        <Kpi icon="coins" label="Aprobado" value={formatPrice(sum("aprobado"))} hint={`${n("aprobado")} pagos`} tone="ok" />
        <Kpi icon="clock" label="Pendiente" value={formatPrice(sum("pendiente"))} hint={`${n("pendiente")} pagos`} tone="warn" />
        <Kpi icon="alert" label="Rechazados o anulados" value={n("rechazado") + n("anulado") + n("error")} tone="muted" />
      </dl>

      <PanelSection id="pasarelas-t" title="Pasarelas">
        <ul className="grid gap-4 md:grid-cols-2">
          {providers.map((p) => {
            const mode = providerMode(p.id);
            return (
              <li key={p.id} className="panel space-y-2 p-5 text-sm">
                <p className="flex flex-wrap items-center gap-2 text-base font-semibold">{PROVIDER_LABEL[p.id]}
                  <span className={`badge ${mode ? "badge-ok" : "badge-muted"}`}>{mode === "simulado" ? "Simulado (vista previa)" : mode ? (isTestMode(p.id) ? "Activo · modo de prueba" : "Activo") : "Sin configurar"}</span>
                </p>
                {!mode && <p className="text-muted">Pon {p.env} en Vercel → Settings → Environment Variables.</p>}
                <p className="text-muted">URL de avisos (webhook): <code className="break-all rounded bg-[#f3f4f8] px-1.5 py-0.5 text-text">{p.hook}</code></p>
              </li>
            );
          })}
        </ul>
      </PanelSection>

      <PanelSection id="lista-pagos-t" title="Últimos pagos">
        {payments.length === 0 ? <Empty icon="coins">Todavía no hay pagos.</Empty> : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Últimos {payments.length} pagos</caption>
              <thead className="border-b border-line bg-[#f8f8fc] text-xs uppercase tracking-wide text-muted">
                <tr><th className="p-3">Fecha</th><th className="p-3">Estudiante</th><th className="p-3">Curso</th><th className="p-3 text-right">Valor</th><th className="p-3">Pasarela</th><th className="p-3">Estado</th><th className="p-3">Referencia</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((p) => (
                  <tr key={p.reference} className="hover:bg-[#fafafd]">
                    <td className="whitespace-nowrap p-3 text-muted">{dateTime(p.createdAt)}</td>
                    <td className="p-3 font-medium">{p.student}{p.payer && <span className="block text-xs font-normal text-muted">pagó {p.payer}</span>}</td>
                    <td className="p-3">{p.courseTitle}</td>
                    <td className="whitespace-nowrap p-3 text-right font-semibold tabular-nums">{formatPrice(p.amount)}</td>
                    <td className="p-3">{PROVIDER_LABEL[p.provider]}</td>
                    <td className="p-3" title={p.detail ?? undefined}><span className={`badge ${PAYMENT_STATUS[p.status].badge}`}>{PAYMENT_STATUS[p.status].label}</span></td>
                    <td className="p-3 font-mono text-xs">{p.reference}{p.providerRef && <span className="block text-muted">{p.providerRef}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="flex items-center gap-1.5 text-xs text-muted"><Icon name="shield" className="size-4" /> Nunca vemos ni guardamos los datos de tarjetas: el cobro ocurre en la pasarela.</p>
      </PanelSection>
    </div>
  );
}
