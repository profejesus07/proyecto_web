/**
 * Adultos del Gremio: los Maestros (docentes) y los Guardianes del Hogar (familias).
 * Cada docente o familia elige el suyo; es su retrato en la plataforma (ver biblia §3.3).
 */
export interface Guide { id: string; name: string; group: "maestro" | "hogar"; folder: string }

export const MAESTROS: readonly Guide[] = [
  { id: "maestra-ilia", name: "Maestra Ilia", group: "maestro", folder: "maestros" },
  { id: "maestra-nadia", name: "Maestra Nadia", group: "maestro", folder: "maestros" },
  { id: "maestro-olu", name: "Maestro Olu", group: "maestro", folder: "maestros" },
  { id: "maestro-ravi", name: "Maestro Ravi", group: "maestro", folder: "maestros" },
];

export const GUARDIANES_HOGAR: readonly Guide[] = [
  { id: "mama-lucia", name: "Mamá Lucía", group: "hogar", folder: "familia" },
  { id: "papa-kenji", name: "Papá Kenji", group: "hogar", folder: "familia" },
  { id: "abuela-amara", name: "Abuela Amara", group: "hogar", folder: "familia" },
  { id: "abuelo-iker", name: "Abuelo Iker", group: "hogar", folder: "familia" },
];

export type GuideAnim = "reposo" | "saludar" | "hablar" | "animar" | "celebrar" | "pensar" | "alerta" | "senalar" | "orgullo" | "abrir-portal";

const ALL = [...MAESTROS, ...GUARDIANES_HOGAR];
export const guideById = (id: string | undefined) => ALL.find((g) => g.id === id);

/** Guía por defecto: uno fijo por persona (según su id), para que no todos se vean iguales. */
export function defaultGuide(group: Guide["group"], personId: string): Guide {
  const list = group === "maestro" ? MAESTROS : GUARDIANES_HOGAR;
  let h = 0;
  for (const ch of personId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

export function guideSrc(g: Guide, anim: GuideAnim = "reposo"): string {
  // Los Maestros no tienen «orgullo»; los Guardianes del Hogar no tienen «abrir-portal».
  const a = g.group === "maestro" && anim === "orgullo" ? "celebrar" : g.group === "hogar" && anim === "abrir-portal" ? "senalar" : anim;
  return `/assets/${g.folder}/${g.id}/${g.id}-${a}.svg`;
}

/**
 * Mensajes de apoyo que la familia envía al estudiante (biblia §3.3). Son frases fijas:
 * no hay texto libre, así nadie tiene que moderar lo que llega a un menor.
 */
export const FAMILY_MESSAGES: Record<string, { text: string; anim: GuideAnim }> = {
  orgullo: { text: "¡Qué orgullo verte avanzar en tus portales!", anim: "orgullo" },
  animo: { text: "Sigue así: cada paso pequeño cuenta.", anim: "animar" },
  error: { text: "Equivocarse también es aprender. ¡Inténtalo otra vez!", anim: "animar" },
  racha: { text: "¡Qué constancia! Me encanta verte aprender cada día.", anim: "celebrar" },
  cuentame: { text: "¿Me cuentas hoy qué aprendiste?", anim: "hablar" },
  guardian: { text: "¡Venciste a un Guardián! Eres valiente.", anim: "celebrar" },
  descanso: { text: "Descansa bien; mañana seguimos la aventura.", anim: "saludar" },
  carino: { text: "Te quiero mucho. Estoy contigo en cada portal.", anim: "orgullo" },
};
export const FAMILY_MESSAGE_KEYS = Object.keys(FAMILY_MESSAGES);
/** Mensajes por día y por hijo o hija (lo aplica la base de datos). */
export const FAMILY_MESSAGES_PER_DAY = 5;
