import { DIPLOMA_SVG } from "@/content/diploma-svg";

/** Escapa texto para meterlo dentro de un SVG (el nombre lo escribe el estudiante). */
export function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
}

/** Tamaño de letra que cabe en el ancho del diploma. */
const fit = (text: string, base: number, maxChars: number) => Math.round(text.length <= maxChars ? base : Math.max(base * 0.5, (base * maxChars) / text.length));

export interface DiplomaData { name: string; course: string; date: string }

/** SVG del diploma con los datos ya escritos. */
export function renderDiploma({ name, course, date }: DiplomaData): string {
  return DIPLOMA_SVG
    .replaceAll("__ARIA__", escapeXml(`Diploma Sello del Portal de ${name}: ${course}`))
    .replace("__FS_NOMBRE__", String(fit(name, 58, 22)))
    .replace("__FS_CURSO__", String(fit(course, 34, 40)))
    .replace("__NOMBRE__", escapeXml(name))
    .replace("__CURSO__", escapeXml(course))
    .replace("__FECHA__", escapeXml(date));
}
