/**
 * Lecciones de explicación: reglas compartidas por el editor, la importación desde Excel
 * y la vista del estudiante.
 */
import type { LessonKind } from "@/lib/data/types";

export const LESSON_KIND_LABEL: Record<LessonKind, string> = {
  reto: "Reto (actividades)",
  explicacion: "Explicación (para leer)",
};

export const MAX_BODY = 20000;
/** XP por leer una explicación (menos que un reto). */
export const READING_XP = 20;

/**
 * Video de una explicación: solo YouTube o Vimeo, para incrustarlo sin riesgos.
 * Devuelve la dirección para el <iframe>, o null si no es un video aceptado.
 */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  const id = (s: string | null | undefined) => (s && /^[\w-]{6,20}$/.test(s) ? s : null);
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = id(u.searchParams.get("v")) ?? id(u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1]);
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === "youtu.be") {
    const v = id(u.pathname.slice(1));
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const v = u.pathname.match(/(\d{6,12})/)?.[1];
    return v ? `https://player.vimeo.com/video/${v}` : null;
  }
  return null;
}

/** Bloques del texto de una explicación: párrafos, subtítulos («## »), listas («- ») y **negrita**. */
export type BodyBlock =
  | { type: "h"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

export function parseBody(body: string): BodyBlock[] {
  const out: BodyBlock[] = [];
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const h = line.match(/^#{1,3}\s+(.+)/);
    const ul = line.match(/^[-*•]\s+(.+)/);
    const ol = line.match(/^\d+[.)]\s+(.+)/);
    if (h) { flush(); out.push({ type: "h", text: h[1] }); continue; }
    if (ul || ol) {
      flush();
      const type = ul ? "ul" : "ol";
      const item = (ul ?? ol)![1];
      const last = out[out.length - 1];
      if (last && last.type === type) last.items.push(item);
      else out.push({ type, items: [item] });
      continue;
    }
    para.push(line);
  }
  flush();
  return out;
}

/** Trozos de una línea con **negrita**. */
export function inlineParts(text: string): { text: string; bold: boolean }[] {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((t) => (t.startsWith("**") && t.endsWith("**") && t.length > 4 ? { text: t.slice(2, -2), bold: true } : { text: t, bold: false }));
}

/**
 * Muestra gratis de un curso de pago: todas las lecciones hasta el primer reto, incluido
 * (así incluye la explicación inicial y una práctica). Misma regla que public.free_until.
 */
export function freeUntil(missions: { position: number; lessonKind: LessonKind }[]): number {
  const retos = missions.filter((m) => m.lessonKind === "reto").map((m) => m.position);
  return retos.length ? Math.min(...retos) : 1;
}

/** Texto plano (para leerlo en voz alta): cada título, párrafo y punto de lista en su línea, para hacer pausa. */
export function plainBody(body: string): string {
  return parseBody(body).map((b) => (b.type === "ul" || b.type === "ol" ? b.items.join("\n") : b.text)).join("\n").replace(/\*\*/g, "");
}
