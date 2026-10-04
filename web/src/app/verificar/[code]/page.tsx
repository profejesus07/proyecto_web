import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { CODE_PATTERN, LEGAL_FOOTER, docShort, longDate, maskDoc } from "@/lib/certificates";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Verificación de constancia", robots: { index: false } };

export default async function VerifyPage({ params }: PageProps<"/verificar/[code]">) {
  const { code } = await params;
  const cert = CODE_PATTERN.test(code) ? await getRepo().getCertificate(code) : null;
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        <p className="eyebrow">Verificación de constancia</p>
        {cert ? (
          <section className="mt-4 space-y-5">
            <div className="panel flex items-center gap-4 !border-green/60 p-5">
              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-green text-2xl text-ink">✓</span>
              <div>
                <h1 className="text-2xl">Constancia auténtica</h1>
                <p className="text-sm text-muted">Expedida por la Academia Virtual Umbral. Código <strong className="font-mono text-text">{cert.code}</strong> · N.º {String(cert.number).padStart(6, "0")}</p>
              </div>
            </div>
            <dl className="panel grid gap-x-6 gap-y-3 p-5 sm:grid-cols-[auto_1fr]">
              <dt className="text-muted">Participante</dt><dd className="font-semibold">{cert.participantName}</dd>
              <dt className="text-muted">Documento</dt><dd>{docShort(cert.docType)} {maskDoc(cert.docNumber)}</dd>
              <dt className="text-muted">Curso</dt><dd className="font-semibold">{cert.courseTitle}</dd>
              <dt className="text-muted">Intensidad</dt><dd>{cert.hours} horas · modalidad virtual</dd>
              <dt className="text-muted">Fechas</dt><dd>Del {longDate(cert.startedOn)} al {longDate(cert.finishedOn)}</dd>
              <dt className="text-muted">Formador</dt><dd>{cert.trainerName}, {cert.trainerTitle}</dd>
              <dt className="text-muted">Expedida</dt><dd>{longDate(cert.issuedAt)}{cert.city ? `, en ${cert.city}` : ""}, por {cert.issuerName}</dd>
            </dl>
            <p className="text-xs text-muted">{LEGAL_FOOTER}</p>
          </section>
        ) : (
          <section className="mt-4 space-y-4">
            <div className="panel flex items-center gap-4 !border-coral/60 p-5">
              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-coral text-2xl text-ink">✕</span>
              <div>
                <h1 className="text-2xl">No encontramos esa constancia</h1>
                <p className="text-sm text-muted">El código <strong className="font-mono">{code}</strong> no corresponde a ninguna constancia expedida por la Academia Virtual Umbral.</p>
              </div>
            </div>
            <Link href="/verificar" className="btn btn-secondary">Probar con otro código</Link>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
