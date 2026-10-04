/**
 * Tipos de actividad de una lección. La revisión de verdad la hace la base de datos (answer_activity);
 * aquí están las reglas compartidas: cómo se guarda cada tipo, qué se le puede mostrar al estudiante
 * (sin revelar la respuesta) y la misma revisión para la vista previa.
 */
export const ACTIVITY_KINDS = ["opcion", "vf", "completar", "ordenar", "relacionar"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  opcion: "Selección múltiple",
  vf: "Verdadero o falso",
  completar: "Completar (respuesta corta)",
  ordenar: "Ordenar pasos",
  relacionar: "Relacionar parejas",
};

export const VF_OPTIONS = ["Verdadero", "Falso"];

/** Lo que se muestra como solución al responder (en las actividades que no son de opciones). */
export type Solution = string | string[] | { left: string[]; right: string[] };
/** Respuesta del estudiante: índice (opciones), texto (completar) o lista de textos (ordenar, relacionar). */
export type ActivityResponse = number | string | string[];

export const isChoiceKind = (k: ActivityKind) => k === "opcion" || k === "vf";
export const asKind = (k: unknown): ActivityKind => (ACTIVITY_KINDS as readonly unknown[]).includes(k) ? (k as ActivityKind) : "opcion";

/** Mezcla estable (la misma cada vez para la misma pregunta) que nunca deja el orden correcto. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1 && out.every((x, i) => x === items[i])) out.push(out.shift()!);
  return out;
}

/** Lo que viaja al navegador: nunca las respuestas aceptadas ni el orden correcto. */
export function publicActivity(id: string, kind: ActivityKind, options: string[], data: { right?: string[] }): { options: string[]; right?: string[] } {
  if (kind === "completar") return { options: [] };
  if (kind === "ordenar") return { options: seededShuffle(options, id) };
  if (kind === "relacionar") return { options, right: seededShuffle(data.right ?? [], `${id}:r`) };
  return { options };
}

export function solutionOf(kind: ActivityKind, options: string[], data: { right?: string[] }): Solution | undefined {
  if (kind === "completar") return options[0];
  if (kind === "ordenar") return options;
  if (kind === "relacionar") return { left: options, right: data.right ?? [] };
  return undefined;
}

/** Igual que public.norm_answer: minúsculas, sin tildes ni signos, espacios simples. */
export function normAnswer(t: string): string {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Revisión (la de la base de datos manda; esta es para la vista previa). null = respuesta con forma inválida. */
export function gradeActivity(kind: ActivityKind, options: string[], data: { right?: string[] }, correctIndex: number, response: ActivityResponse): boolean | null {
  if (isChoiceKind(kind)) return typeof response === "number" && Number.isInteger(response) && response >= 0 && response < options.length ? response === correctIndex : null;
  if (kind === "completar") return typeof response === "string" && response.length <= 200 ? normAnswer(response) !== "" && options.some((a) => normAnswer(a) === normAnswer(response)) : null;
  const target = kind === "ordenar" ? options : data.right ?? [];
  if (!Array.isArray(response) || response.length !== target.length || response.some((x) => typeof x !== "string")) return null;
  return response.every((x, i) => x === target[i]);
}

export interface ActivityDraft {
  kind: ActivityKind;
  options: string[];
  correctIndex: number;
  right: string[];
}

/**
 * Valida lo que escribió el editor y lo deja listo para guardar.
 * Devuelve un mensaje de error para mostrar, o la actividad normalizada.
 */
export function normalizeActivity(d: ActivityDraft): { error: string } | { options: string[]; correctIndex: number; data: { right?: string[] } } {
  const clean = (xs: string[]) => xs.map((x) => x.trim()).filter(Boolean);
  const opts = clean(d.options);
  const distinct = (xs: string[]) => new Set(xs.map((x) => x.toLowerCase())).size === xs.length;
  switch (d.kind) {
    case "vf":
      if (d.correctIndex !== 0 && d.correctIndex !== 1) return { error: "Marca si la afirmación es verdadera o falsa." };
      return { options: VF_OPTIONS, correctIndex: d.correctIndex, data: {} };
    case "completar":
      if (opts.length < 1 || opts.length > 6) return { error: "Escribe entre 1 y 6 respuestas aceptadas." };
      if (opts.some((o) => o.length > 80)) return { error: "Cada respuesta aceptada debe tener máximo 80 caracteres." };
      // La base de datos pide al menos dos elementos: se repite la única respuesta.
      return { options: opts.length === 1 ? [opts[0], opts[0]] : opts, correctIndex: 0, data: {} };
    case "ordenar":
      if (opts.length < 2 || opts.length > 6) return { error: "Escribe entre 2 y 6 pasos, en el orden correcto." };
      if (!distinct(opts)) return { error: "Los pasos no se pueden repetir." };
      return { options: opts, correctIndex: 0, data: {} };
    case "relacionar": {
      const pairs = d.options.map((l, i) => [l.trim(), (d.right[i] ?? "").trim()] as const).filter(([l, r]) => l || r);
      if (pairs.some(([l, r]) => !l || !r)) return { error: "Cada pareja necesita sus dos lados." };
      if (pairs.length < 2 || pairs.length > 6) return { error: "Escribe entre 2 y 6 parejas." };
      const left = pairs.map(([l]) => l);
      const right = pairs.map(([, r]) => r);
      if (!distinct(left) || !distinct(right)) return { error: "Los elementos de cada columna no se pueden repetir." };
      return { options: left, correctIndex: 0, data: { right } };
    }
    default:
      if (opts.length < 2 || opts.length > 6) return { error: "Escribe entre 2 y 6 opciones." };
      if (d.correctIndex < 0 || d.correctIndex >= d.options.length || !d.options[d.correctIndex]?.trim()) return { error: "Marca cuál es la opción correcta." };
      // El índice correcto se recalcula sobre las opciones sin las vacías.
      return { options: opts, correctIndex: opts.indexOf(d.options[d.correctIndex].trim()), data: {} };
  }
}
