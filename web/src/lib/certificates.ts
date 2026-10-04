import type { DocType } from "@/lib/data/types";

export const DOC_TYPES: { value: DocType; label: string; short: string }[] = [
  { value: "CC", label: "Cédula de ciudadanía", short: "C.C." },
  { value: "TI", label: "Tarjeta de identidad", short: "T.I." },
  { value: "CE", label: "Cédula de extranjería", short: "C.E." },
  { value: "PPT", label: "Permiso por protección temporal", short: "PPT" },
  { value: "PA", label: "Pasaporte", short: "Pasaporte" },
];
export const docShort = (t: DocType) => DOC_TYPES.find((d) => d.value === t)?.short ?? t;

/** En la verificación pública solo se muestran los últimos 4 dígitos del documento. */
export function maskDoc(doc: string): string {
  return doc.length <= 4 ? doc : `${"•".repeat(Math.min(doc.length - 4, 6))}${doc.slice(-4)}`;
}

/** «12 de marzo de 2027» a partir de AAAA-MM-DD (o una fecha completa). */
export function longDate(value: string): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00-05:00`) : new Date(value);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" });
}

export const LEGAL_FOOTER = "Educación informal conforme a la Ley 115 de 1994 y al artículo 2.6.6.8 del Decreto 1075 de 2015. Esta constancia no conduce a título ni a certificado de aptitud ocupacional. Documento firmado electrónicamente (Ley 527 de 1999 y Decreto 2364 de 2012).";

export const CODE_PATTERN = /^UMB-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
