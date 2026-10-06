import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateDocument } from "@/components/certificate-document";
import { Icon } from "@/components/icons";
import { PrintButton } from "@/components/print-button";
import { PanelHeader } from "@/components/workspace/ui";
import { requireAdmin } from "@/lib/auth";
import { CODE_PATTERN } from "@/lib/certificates";
import { getRepo } from "@/lib/data";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Constancia · Consola" };

/** La constancia tal como la recibe el estudiante, dentro de la consola. */
export default async function AdminCertificatePage({ params }: PageProps<"/admin/constancias/[code]">) {
  const { code } = await params;
  await requireAdmin(`/admin/constancias/${code}`);
  if (!CODE_PATTERN.test(code)) notFound();
  const repo = getRepo();
  const [cert, settings, base] = await Promise.all([repo.getCertificate(code), repo.getIssuerSettings(), siteUrl()]);
  if (!cert) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/constancias" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text print:hidden">
        <Icon name="arrow" className="size-4 rotate-180" /> Constancias
      </Link>
      <div className="print:hidden">
        <PanelHeader eyebrow={`Constancia N.º ${String(cert.number).padStart(6, "0")}`} title={cert.participantName} description={`${cert.courseTitle} · ${cert.hours} horas`}>
          <Link href={`/verificar/${code}`} className="btn btn-secondary btn-sm"><Icon name="qr" className="size-4" /> Verificación pública</Link>
          <PrintButton className="btn btn-primary btn-sm">Descargar PDF</PrintButton>
        </PanelHeader>
      </div>
      <CertificateDocument cert={cert} verifyUrl={`${base}/verificar/${code}`} signaturePng={settings.signaturePng} />
    </div>
  );
}
