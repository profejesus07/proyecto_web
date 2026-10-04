import QRCode from "qrcode";
import { LEGAL_FOOTER, docShort, longDate } from "@/lib/certificates";
import type { Certificate } from "@/lib/data/types";

/**
 * Constancia de asistencia (educación informal). Diseñada para verse en pantalla y para imprimir
 * o guardar como PDF en una hoja horizontal. Los datos vienen de la «foto» fija de la constancia.
 */
export async function CertificateDocument({ cert, verifyUrl, signaturePng }: { cert: Certificate; verifyUrl: string; signaturePng: string | null }) {
  const qr = await QRCode.toString(verifyUrl, { type: "svg", margin: 0, width: 112, color: { dark: "#14123b", light: "#ffffff" } });
  const number = String(cert.number).padStart(6, "0");
  return (
    <article aria-label="Constancia de asistencia" className="certificate mx-auto w-full max-w-[1000px] overflow-hidden rounded-2xl bg-white text-[#14123b] shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
      <div className="m-3 rounded-xl border-[3px] border-[#8a5cff] p-6 sm:m-4 sm:p-10" style={{ boxShadow: "inset 0 0 0 6px #fff, inset 0 0 0 7px #ffc83d" }}>
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 48 48" className="size-11" aria-hidden="true">
              <rect x="2" y="2" width="44" height="44" rx="12" fill="#14123b" />
              <path d="M14 36V22a10 10 0 0 1 20 0v14" fill="none" stroke="#ffc83d" strokeWidth="4" strokeLinecap="round" />
              <circle cx="24" cy="24" r="3" fill="#2ee6d6" />
            </svg>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#5b5788]">Academia Virtual</p>
              <p className="font-display text-2xl font-extrabold leading-none tracking-wide">UMBRAL</p>
              <p className="text-xs text-[#5b5788]">Cursos que se viven como una aventura</p>
            </div>
          </div>
          <p className="text-right text-xs text-[#5b5788]">Constancia N.º <strong className="text-[#14123b]">{number}</strong></p>
        </header>

        <div className="mt-8 space-y-5 text-center">
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-[0.18em] text-[#14123b] sm:text-4xl">Constancia de asistencia</h1>
          <p className="text-base sm:text-lg">{cert.issuerName}{cert.issuerTitle ? `, ${cert.issuerTitle},` : ""} hace constar que</p>
          <p className="font-display text-3xl font-extrabold text-[#6a3fe0] sm:text-4xl">{cert.participantName}</p>
          <p className="text-base sm:text-lg">identificado(a) con {docShort(cert.docType)} n.º <strong>{cert.docNumber}</strong>,</p>
          <p className="mx-auto max-w-3xl text-base leading-relaxed sm:text-lg">
            asistió y finalizó el curso <strong>«{cert.courseTitle}»</strong>, con una intensidad de <strong>{cert.hours} {cert.hours === 1 ? "hora" : "horas"}</strong>,
            en modalidad virtual, entre el {longDate(cert.startedOn)} y el {longDate(cert.finishedOn)}.
          </p>
          <p className="text-sm text-[#3b3770] sm:text-base">Formador: <strong>{cert.trainerName}</strong>, {cert.trainerTitle}.</p>
          <p className="text-sm text-[#3b3770] sm:text-base">Expedida en {cert.city ?? "Colombia"}, el {longDate(cert.issuedAt)}.</p>
        </div>

        <div className="mt-8 grid items-end gap-6 sm:grid-cols-[1fr_auto]">
          <div className="text-center sm:text-left">
            {signaturePng && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signaturePng} alt={`Firma de ${cert.issuerName}`} className="mx-auto h-20 w-auto object-contain sm:mx-0" />
            )}
            <div className="mx-auto mt-1 w-64 border-t-2 border-[#14123b] pt-1 sm:mx-0">
              <p className="font-semibold">{cert.issuerName}</p>
              {cert.issuerTitle && <p className="text-sm text-[#5b5788]">{cert.issuerTitle}</p>}
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="size-28 shrink-0" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qr }} />
            <div className="max-w-56 text-left text-xs leading-snug text-[#3b3770]">
              <p className="font-semibold text-[#14123b]">Verifica esta constancia</p>
              <p className="break-all">{verifyUrl}</p>
              <p className="mt-1">Código: <strong className="font-mono text-[#14123b]">{cert.code}</strong></p>
            </div>
          </div>
        </div>

        <p className="mt-6 border-t border-[#d9d5f5] pt-3 text-center text-[11px] leading-snug text-[#5b5788]">{LEGAL_FOOTER}</p>
      </div>
    </article>
  );
}
