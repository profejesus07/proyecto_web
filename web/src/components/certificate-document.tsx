import QRCode from "qrcode";
import { dmSans, fraunces } from "@/app/fonts/documentos";
import { LEGAL_FOOTER, docShort, longDate } from "@/lib/certificates";
import type { Certificate } from "@/lib/data/types";

/** Esquinas ornamentales del marco (se rotan para cada esquina). */
function Corner({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 80 80" className={`absolute w-[7%] ${className}`} aria-hidden="true">
      <path d="M4 76V20C4 11 11 4 20 4h56" fill="none" stroke="#b08a2e" strokeWidth="1.6" />
      <path d="M12 76V26c0-8 6-14 14-14h50" fill="none" stroke="#15103f" strokeWidth="0.8" />
      <path d="M20 4c0 9 7 16 16 16M4 20c9 0 16 7 16 16" fill="none" stroke="#b08a2e" strokeWidth="1" />
      <path d="M26 26l4.5 1.5L32 32l1.5-4.5L38 26l-4.5-1.5L32 20l-1.5 4.5z" fill="#b08a2e" />
    </svg>
  );
}

/** Contorno dentado del sello: 36 puntas alrededor del centro (60, 60). */
const SEAL_POINTS = Array.from({ length: 72 }, (_, i) => {
  const a = (i / 72) * Math.PI * 2;
  const r = i % 2 ? 53 : 58;
  return `${(60 + r * Math.cos(a)).toFixed(2)},${(60 + r * Math.sin(a)).toFixed(2)}`;
}).join(" ");

/** Sello dorado de la academia. */
function Seal() {
  return (
    <svg viewBox="0 0 120 120" className="w-full" aria-hidden="true">
      <defs>
        <radialGradient id="cert-seal" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="0.55" stopColor="#e2b23f" />
          <stop offset="1" stopColor="#a87b18" />
        </radialGradient>
        <path id="cert-seal-arc" d="M60 60m-41 0a41 41 0 1 1 82 0a41 41 0 1 1-82 0" />
      </defs>
      <polygon points={SEAL_POINTS} fill="url(#cert-seal)" />
      <circle cx="60" cy="60" r="49" fill="none" stroke="#a87b18" strokeWidth="0.8" />
      <circle cx="60" cy="60" r="44" fill="none" stroke="#fff6d6" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="33" fill="#15103f" />
      <text fontSize="6.6" fontWeight="700" fill="#15103f" fontFamily="system-ui, sans-serif">
        <textPath href="#cert-seal-arc" textLength="252" lengthAdjust="spacing">ACADEMIA VIRTUAL UMBRAL · CONSTANCIA VERIFICABLE ·</textPath>
      </text>
      <path d="M60 42l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="#ffc83d" />
    </svg>
  );
}

/**
 * Constancia de asistencia (educación informal). Documento horizontal con proporción de hoja A4,
 * pensado para verse en pantalla y para imprimir o guardar como PDF. Las medidas van en unidades
 * del contenedor (cqw), así la composición es idéntica a cualquier tamaño.
 * Los datos vienen de la «foto» fija de la constancia.
 */
export async function CertificateDocument({ cert, verifyUrl, signaturePng }: { cert: Certificate; verifyUrl: string; signaturePng: string | null }) {
  const qr = await QRCode.toString(verifyUrl, { type: "svg", margin: 0, color: { dark: "#15103f", light: "#ffffff00" } });
  const number = String(cert.number).padStart(6, "0");
  return (
    <div className="rounded-2xl print:rounded-none">
      <article aria-label="Constancia de asistencia"
        className={`${fraunces.variable} ${dmSans.className} certificate relative mx-auto aspect-[297/210] w-full max-w-[1100px] overflow-hidden bg-[#fffdf8] text-[#15103f] shadow-[0_30px_60px_-30px_rgb(21_16_63/0.45)] [container-type:inline-size] print:max-w-none print:shadow-none`}>
        {/* Fondo: guilloche suave y marca de agua. */}
        <div className="absolute inset-0" aria-hidden="true" style={{
          backgroundImage: "repeating-radial-gradient(circle at 50% 120%, rgb(176 138 46 / 0.06) 0 1px, transparent 1px 9px), radial-gradient(70% 60% at 50% 45%, #fffdf8, #f6f0e2)",
        }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/academia-umbral-isotipo-estatico-claro.svg" alt="" aria-hidden="true" className="absolute left-1/2 top-1/2 w-[34%] -translate-x-1/2 -translate-y-1/2 opacity-[0.045]" />

        {/* Marco doble: índigo y dorado. */}
        <div className="absolute inset-[2.2%] border-[0.25cqw] border-[#15103f]" aria-hidden="true" />
        <div className="absolute inset-[3.1%] border-[0.12cqw] border-[#b08a2e]" aria-hidden="true" />
        <Corner className="left-[2.2%] top-[2.2%]" />
        <Corner className="right-[2.2%] top-[2.2%] rotate-90" />
        <Corner className="bottom-[2.2%] right-[2.2%] rotate-180" />
        <Corner className="bottom-[2.2%] left-[2.2%] -rotate-90" />

        <div className="relative flex h-full flex-col px-[9%] pb-[5.5%] pt-[6%] text-center">
          <header className="flex items-start justify-between">
            <p className="w-[22%] text-left text-[1cqw] uppercase tracking-[0.18em] text-[#6b6788]">Educación informal<br /><span className="text-[#15103f]">Modalidad virtual</span></p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/academia-umbral-horizontal-claro.svg" alt="Academia Virtual Umbral" className="w-[24%]" />
            <p className="w-[22%] text-right text-[1cqw] uppercase tracking-[0.18em] text-[#6b6788]">Constancia N.º<br /><strong className="font-mono text-[1.25cqw] tracking-[0.12em] text-[#15103f]">{number}</strong></p>
          </header>

          <div className="mt-[2.2%] flex flex-1 flex-col items-center justify-center">
            <h1 className="font-[family-name:var(--font-serif)] text-[5.4cqw] font-semibold uppercase leading-none tracking-[0.12em] text-[#15103f]">Constancia</h1>
            <p className="mt-[0.6%] font-[family-name:var(--font-serif)] text-[1.9cqw] italic text-[#8a6a1e]">de asistencia</p>
            <div className="my-[1.6%] flex w-[22%] items-center gap-[4%]" aria-hidden="true">
              <span className="h-px flex-1 bg-[#b08a2e]" /><span className="size-[0.7cqw] rotate-45 bg-[#b08a2e]" /><span className="h-px flex-1 bg-[#b08a2e]" />
            </div>
            <p className="text-[1.45cqw] text-[#3b3770]">{cert.issuerName}{cert.issuerTitle ? `, ${cert.issuerTitle},` : ""} hace constar que</p>
            <p className="mt-[1.2%] font-[family-name:var(--font-serif)] text-[4.2cqw] font-semibold italic leading-tight text-[#2a1f7a]">{cert.participantName}</p>
            <span className="mt-[0.6%] h-[0.12cqw] w-[46%] bg-gradient-to-r from-transparent via-[#b08a2e] to-transparent" aria-hidden="true" />
            <p className="mt-[1.4%] text-[1.45cqw] text-[#3b3770]">identificado(a) con {docShort(cert.docType)} n.º <strong className="text-[#15103f]">{cert.docNumber}</strong>,</p>
            <p className="mx-auto mt-[0.8%] max-w-[78%] text-[1.45cqw] leading-relaxed text-[#3b3770]">
              asistió y finalizó el curso <strong className="text-[#15103f]">«{cert.courseTitle}»</strong>, con una intensidad de <strong className="text-[#15103f]">{cert.hours} {cert.hours === 1 ? "hora" : "horas"}</strong>,
              en modalidad virtual, entre el {longDate(cert.startedOn)} y el {longDate(cert.finishedOn)}.
            </p>
            <p className="mt-[0.8%] text-[1.2cqw] text-[#6b6788]">Formador: <strong className="text-[#15103f]">{cert.trainerName}</strong>, {cert.trainerTitle} · Expedida en {cert.city ?? "Colombia"}, el {longDate(cert.issuedAt)}.</p>
          </div>

          <footer className="mt-[1.5%] grid grid-cols-[1fr_auto_1fr] items-end gap-[3%]">
            <div className="flex flex-col items-center">
              {signaturePng ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={signaturePng} alt={`Firma de ${cert.issuerName}`} className="h-[6cqw] w-auto object-contain" />
              ) : <span className="h-[6cqw]" />}
              <span className="h-[0.1cqw] w-[78%] bg-[#15103f]" aria-hidden="true" />
              <p className="mt-[3%] text-[1.25cqw] font-semibold">{cert.issuerName}</p>
              {cert.issuerTitle && <p className="text-[1.05cqw] text-[#6b6788]">{cert.issuerTitle}</p>}
            </div>
            <div className="w-[11cqw]"><Seal /></div>
            <div className="flex items-center justify-center gap-[5%] text-left">
              <div className="size-[8.5cqw] shrink-0 rounded-[0.6cqw] bg-white p-[0.5cqw] ring-1 ring-[#e6dcc2] [&>svg]:size-full" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qr }} />
              <div className="min-w-0 text-[1cqw] leading-snug text-[#3b3770]">
                <p className="text-[1.1cqw] font-semibold uppercase tracking-[0.1em] text-[#15103f]">Verifica esta constancia</p>
                <p className="mt-[3%]">Escanea el código QR o entra a</p>
                <p className="break-all font-medium text-[#2a1f7a]">{verifyUrl.replace(/^https?:\/\//, "").replace(/\/verificar\/.*/, "/verificar")}</p>
                <p className="mt-[3%]">Código: <strong className="font-mono text-[#15103f]">{cert.code}</strong></p>
              </div>
            </div>
          </footer>

          <p className="mx-auto mt-[2%] max-w-[88%] border-t border-[#e6dcc2] pt-[1%] text-[0.85cqw] leading-snug text-[#6b6788]">{LEGAL_FOOTER}</p>
        </div>
      </article>
    </div>
  );
}
