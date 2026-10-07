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

/**
 * Fecha de corte de la marca de las constancias. Cada constancia se dibuja con la marca con la que se
 * emitió: antes de esta fecha, Academia Virtual Umbral; desde esta fecha, UNEX Academy. La base de datos no
 * guarda la marca: se deduce de issued_at.
 *
 * Fijada al hacer el cambio de marca en producción: 7 de octubre de 2026, 13:00 hora de Colombia. No cambiarla:
 * las constancias anteriores dependen de ella para seguir viéndose como se emitieron.
 */
export const MARCA_UNEX_DESDE = "2026-10-07T13:00:00-05:00";

export interface MarcaConstancia {
  id: "umbral" | "unex";
  /** Quién la expide, como se lee en «Expedida por …». */
  emisor: string;
  logo: { src: string; alt: string };
  /** Marca de agua: isotipo monocromo al 4–6 % (excepción de documentos del manual UNEX). */
  marcaDeAgua: { src: string; opacidad: number };
  /** Texto circular del sello. */
  sello: string;
}

export const MARCAS: Record<MarcaConstancia["id"], MarcaConstancia> = {
  // Tal como se emitieron: no cambiar (logo, sello y textos de las constancias anteriores al corte).
  umbral: {
    id: "umbral",
    emisor: "la Academia Virtual Umbral",
    logo: { src: "/brand/academia-umbral-horizontal-claro.svg", alt: "Academia Virtual Umbral" },
    marcaDeAgua: { src: "/brand/academia-umbral-isotipo-estatico-claro.svg", opacidad: 0.045 },
    sello: "ACADEMIA VIRTUAL UMBRAL · CONSTANCIA VERIFICABLE ·",
  },
  unex: {
    id: "unex",
    emisor: "UNEX Academy",
    logo: { src: "/brand/unex-academy.svg", alt: "UNEX Academy" },
    marcaDeAgua: { src: "/brand/unex-isotipo-monocromo.svg", opacidad: 0.04 },
    sello: "UNEX ACADEMY · CONSTANCIA VERIFICABLE ·",
  },
};

/** Marca con la que se emitió una constancia, según su fecha de expedición. */
export function marcaDeConstancia(cert: { issuedAt: string }, desde: string = MARCA_UNEX_DESDE): MarcaConstancia {
  return new Date(cert.issuedAt).getTime() >= new Date(desde).getTime() ? MARCAS.unex : MARCAS.umbral;
}
