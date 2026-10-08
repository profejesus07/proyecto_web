import type { Metadata } from "next";
import Link from "next/link";
import { EN_TEXTO, Icon, type IconName } from "@/components/icons";
import { PAYMENT_STATUS, shortDate, dateTime } from "@/components/workspace/admin-format";
import { Empty, Kpi, PanelHeader, PanelSection } from "@/components/workspace/ui";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { formatPrice } from "@/lib/data/queries";
import { isAccessActive } from "@/lib/roles";
import { providerMode } from "@/lib/payments/config";

export const metadata: Metadata = { title: "Resumen · Consola" };

const ACTIONS: { href: string; label: string; text: string; icon: IconName }[] = [
  { href: "/admin/personas#docente-t", label: "Crear docente", text: "Cuenta lista con contraseña temporal", icon: "user" },
  { href: "/admin/grupos", label: "Crear grupo", text: "Código de acceso anual a una clase", icon: "hash" },
  { href: "/admin/contenido", label: "Nuevo curso", text: "Editor o importación desde Excel", icon: "lesson" },
  { href: "/admin/constancias", label: "Firma de constancias", text: "Responsable, ciudad y firma", icon: "seal" },
];

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const viewer = await requireAdmin("/admin");
  const sp = await searchParams;
  const repo = getRepo();
  const [users, classes, settings, certs, payments] = await Promise.all([
    repo.adminUsers(viewer.id, ""), repo.adminClasses(viewer.id), repo.getIssuerSettings(), repo.listCertificates({ limit: 50 }), repo.adminPayments(viewer.id),
  ]);
  const count = (role: string) => users.filter((u) => u.role === role).length;
  const activeAccess = users.reduce((n, u) => n + u.access.filter((a) => isAccessActive(a.expiresAt)).length, 0);
  const approved = payments.filter((p) => p.status === "aprobado");
  const income = approved.reduce((n, p) => n + p.amount, 0);
  const pending = payments.filter((p) => p.status === "pendiente").length;
  const groups = classes.filter((c) => !c.archived);
  const alerts: { tone: "warn" | "muted"; text: string; href: string; cta: string }[] = [
    ...(!settings.issuerName || !settings.signaturePng ? [{ tone: "warn" as const, text: "Faltan el nombre o la firma del responsable: los estudiantes no pueden obtener su constancia.", href: "/admin/constancias", cta: "Completar" }] : []),
    ...(!providerMode("wompi") && !providerMode("mercadopago") ? [{ tone: "muted" as const, text: "Ninguna pasarela de pago está configurada todavía.", href: "/admin/pagos", cta: "Ver pagos" }] : []),
  ];

  return (
    <div className="space-y-8">
      <PanelHeader eyebrow="Consola" title="Administración" description={`Hola, ${viewer.displayName}. Este es el estado de la academia.`}>
        <Link href="/admin/contenido" className="btn btn-secondary btn-sm"><Icon name="lesson" className="size-4" /> Contenido</Link>
        <Link href="/admin/personas" className="btn btn-primary btn-sm"><Icon name="people" className="size-4" /> Personas</Link>
      </PanelHeader>
      {sp.aviso === "clave" && <p role="status" className="panel p-4 font-medium text-ok"><Icon name="check" className={EN_TEXTO} /> Tu contraseña quedó guardada.</p>}

      {alerts.length > 0 && (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.href} className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm ${a.tone === "warn" ? "border-[#f5dfa0] bg-[#fffaeb]" : "border-line bg-white"}`}>
              <Icon name="alert" className={`size-5 shrink-0 ${a.tone === "warn" ? "text-warn" : "text-muted"}`} />
              <span className="flex-1">{a.text}</span>
              <Link href={a.href} className="font-semibold text-accion hover:underline">{a.cta} →</Link>
            </li>
          ))}
        </ul>
      )}

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon="people" label="Estudiantes" value={count("estudiante")} hint={`${count("familia")} familias vinculadas`} />
        <Kpi icon="user" label="Docentes" value={count("docente")} hint={`${groups.length} grupos activos`} tone="muted" />
        <Kpi icon="key" label="Cursos activados" value={activeAccess} hint="Accesos vigentes" tone="muted" />
        <Kpi icon="coins" label="Ingresos aprobados" value={formatPrice(income)} hint={pending ? `${pending} pagos pendientes` : `${approved.length} pagos`} tone="warn" />
      </dl>

      <PanelSection id="acciones-t" title="Accesos rápidos">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ACTIONS.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className="panel group flex h-full items-center gap-3 p-4 transition hover:border-line-fuerte">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accion-suave text-accion"><Icon name={a.icon} /></span>
                <span className="min-w-0 flex-1"><span className="block font-semibold">{a.label}</span><span className="block text-xs text-muted">{a.text}</span></span>
                <Icon name="arrow" className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-accion" />
              </Link>
            </li>
          ))}
        </ul>
      </PanelSection>

      <div className="grid gap-8 xl:grid-cols-2">
        <PanelSection id="ult-pagos-t" title="Últimos pagos" action={<Link href="/admin/pagos" className="text-sm font-semibold text-accion hover:underline">Ver todos →</Link>}>
          {payments.length === 0 ? <Empty icon="coins">Todavía no hay pagos.</Empty> : (
            <ul className="panel divide-y divide-line">
              {payments.slice(0, 6).map((p) => (
                <li key={p.reference} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.student}</span><span className="block break-words text-xs text-muted">{p.courseTitle} · {dateTime(p.createdAt)}</span></span>
                  <span className="font-semibold tabular-nums">{formatPrice(p.amount)}</span>
                  <span className={`badge ${PAYMENT_STATUS[p.status].badge}`}>{PAYMENT_STATUS[p.status].label}</span>
                </li>
              ))}
            </ul>
          )}
        </PanelSection>
        <PanelSection id="ult-const-t" title="Últimas constancias" action={<Link href="/admin/constancias" className="text-sm font-semibold text-accion hover:underline">Ver todas →</Link>}>
          {certs.length === 0 ? <Empty icon="seal">Todavía no se ha expedido ninguna constancia.</Empty> : (
            <ul className="panel divide-y divide-line">
              {certs.slice(0, 6).map((c) => (
                <li key={c.code}>
                  <Link href={`/admin/constancias/${c.code}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#f8f8fc]">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accion-suave text-accion"><Icon name="seal" className="size-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-medium">{c.participantName}</span><span className="block break-words text-xs text-muted">{c.courseTitle} · {shortDate(c.issuedAt)}</span></span>
                    <span className="font-mono text-xs text-muted">{c.code}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PanelSection>
      </div>
    </div>
  );
}
