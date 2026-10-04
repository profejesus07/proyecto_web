import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CertificateDocument } from "@/components/certificate-document";
import { PrintButton } from "@/components/print-button";
import { requireViewer } from "@/lib/auth";
import { CODE_PATTERN } from "@/lib/certificates";
import { getRepo } from "@/lib/data";
import { isAdmin } from "@/lib/roles";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Constancia de asistencia" };

export default async function CertificatePage({ params }: PageProps<"/constancia/[code]">) {
  const { code } = await params;
  if (!CODE_PATTERN.test(code)) notFound();
  const viewer = await requireViewer(`/constancia/${code}`);
  const repo = getRepo();
  const cert = await repo.getCertificate(code);
  if (!cert) notFound();
  // Solo su titular (o el administrador) ve el documento completo; los demás, la verificación pública.
  if (cert.userId !== viewer.id && !isAdmin(viewer.role)) redirect(`/verificar/${code}`);
  const [settings, base] = await Promise.all([repo.getIssuerSettings(), siteUrl()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="eyebrow">Tu constancia</p>
          <h1 className="text-2xl sm:text-3xl">{cert.courseTitle}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/verificar/${code}`} className="btn btn-secondary">Ver la verificación pública</Link>
          <PrintButton />
        </div>
      </div>
      <p className="text-sm text-muted print:hidden">Para guardarla como PDF, pulsa «Descargar PDF / imprimir» y elige «Guardar como PDF» en el destino.</p>
      <CertificateDocument cert={cert} verifyUrl={`${base}/verificar/${code}`} signaturePng={settings.signaturePng} />
    </div>
  );
}
