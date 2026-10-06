import { duckMusic } from "./music";
import { getSettings } from "./settings";

/**
 * Voces de los personajes con la síntesis de voz del navegador.
 * Para que no suenen robóticas:
 *  · se elige la voz en español más natural disponible (las «Natural», «Neural», «Online» o de Google
 *    y Apple de mejor calidad), prefiriendo acentos latinoamericanos;
 *  · cada personaje cambia solo un poco el tono y la velocidad (los extremos suenan a robot);
 *  · el texto se limpia (sin emojis ni símbolos) y se lee frase por frase, con pausas como las de una
 *    persona: más largas tras un título o un párrafo, medianas tras un punto y cortas tras una coma.
 */

export type Gender = "f" | "m";
export interface VoiceProfile {
  gender: Gender;
  /** Tono: 1 = natural. Se mantiene cerca de 1 para que no suene artificial. */
  pitch: number;
  /** Velocidad: 1 = natural. */
  rate: number;
  /** Personajes del mismo género usan voces distintas cuando hay varias (0 = la mejor). */
  slot: number;
}

/** Perfil de cada personaje (por el nombre que aparece en su globo de diálogo). */
export const VOICES: Record<string, VoiceProfile> = {
  "Maestra Sora": { gender: "f", pitch: 1.02, rate: 0.96, slot: 0 },
  Kuro: { gender: "f", pitch: 1.22, rate: 1.06, slot: 1 },
  "Archivista Eon": { gender: "m", pitch: 0.9, rate: 0.9, slot: 0 },
  Kael: { gender: "m", pitch: 1.06, rate: 1.06, slot: 1 },
  "Forjadora Brann": { gender: "f", pitch: 0.92, rate: 0.98, slot: 2 },
  "Maestra Ilia": { gender: "f", pitch: 1.0, rate: 0.97, slot: 1 },
  "Maestra Nadia": { gender: "f", pitch: 1.05, rate: 1.0, slot: 2 },
  "Maestro Olu": { gender: "m", pitch: 0.94, rate: 0.95, slot: 0 },
  "Maestro Ravi": { gender: "m", pitch: 1.0, rate: 0.98, slot: 1 },
  "Mamá Lucía": { gender: "f", pitch: 1.03, rate: 0.98, slot: 1 },
  "Papá Kenji": { gender: "m", pitch: 0.96, rate: 0.97, slot: 0 },
  "Abuela Amara": { gender: "f", pitch: 0.94, rate: 0.9, slot: 2 },
  "Abuelo Iker": { gender: "m", pitch: 0.9, rate: 0.9, slot: 1 },
  // Guardianes: más graves y pausados, sin pasarse.
  Petrox: { gender: "m", pitch: 0.82, rate: 0.86, slot: 0 },
  Ignaris: { gender: "m", pitch: 1.0, rate: 1.04, slot: 1 },
  Brumalis: { gender: "f", pitch: 0.92, rate: 0.88, slot: 2 },
  Mirelle: { gender: "f", pitch: 1.1, rate: 0.95, slot: 1 },
  Quimax: { gender: "m", pitch: 0.9, rate: 0.95, slot: 1 },
  Sandrael: { gender: "f", pitch: 0.95, rate: 0.85, slot: 0 },
  Eclipsa: { gender: "f", pitch: 0.97, rate: 0.92, slot: 2 },
  "Zhaal, el Vacío": { gender: "m", pitch: 0.8, rate: 0.85, slot: 0 },
};
const NARRATOR: VoiceProfile = { gender: "f", pitch: 1, rate: 0.97, slot: 0 };

export function profileFor(name: string): VoiceProfile {
  return VOICES[name] ?? VOICES[name.split(",")[0].trim()] ?? NARRATOR;
}

// ----- Elección de voces -----
const FEMALE = /dalia|salom[eé]|elvira|paloma|paulina|m[oó]nica|marisol|laura|helena|sabina|camila|valentina|lupe|pen[eé]lope|sof[ií]a|isabela|francisca|catalina|ximena|hilda|beatriz|l[ií]a\b|ana\b|carmen|esperanza|roc[ií]o|estrella|abril|vera|irene|triana|nuria|gabriela|elena|renata|yolanda|marta|luc[ií]a|soledad|female|mujer|google espa[nñ]ol/i;
const MALE = /jorge|gonzalo|[aá]lvaro|tom[aá]s|diego|juan|pablo|ra[uú]l|enrique|carlos|andr[eé]s|gerardo|federico|alonso|emilio|liberto|luciano|yago|sa[uú]l|teo\b|dar[ií]o|arnau|lorenzo|cristian|v[ií]ctor|rodrigo|ricardo|jaime|alberto|male|hombre|eddy|reed|rocko|grandpa/i;
const NATURAL = /natural|neural|online|premium|enhanced|mejorad|siri|wavenet|studio/i;
const BAD = /espeak|compact|eloquence|robot|novelty|whisper|bells|zarvox|trinoids|bad news|bahh|bubbles|cellos|jester|organ|superstar|wobble|albert|fred|junior|ralph/i;

export function voiceGender(v: Pick<SpeechSynthesisVoice, "name">): Gender | null {
  if (FEMALE.test(v.name)) return "f";
  if (MALE.test(v.name)) return "m";
  return null;
}

/** Puntaje de naturalidad de una voz en español (mayor = mejor). */
export function voiceScore(v: Pick<SpeechSynthesisVoice, "name" | "lang" | "localService">): number {
  const lang = v.lang.replace("_", "-").toLowerCase();
  if (!lang.startsWith("es")) return -100;
  let s = 0;
  if (/^es-(co|419|mx|us|ar|cl|pe|ve|ec)/.test(lang)) s += 3;
  else if (lang === "es-es") s += 2;
  else s += 1;
  if (NATURAL.test(v.name)) s += 8;
  if (/google/i.test(v.name)) s += 4;
  if (/microsoft/i.test(v.name) && !NATURAL.test(v.name)) s -= 1;
  if (!v.localService) s += 1;
  if (BAD.test(v.name)) s -= 20;
  return s;
}

let cache: SpeechSynthesisVoice[] = [];
function voices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const all = window.speechSynthesis.getVoices();
  if (all.length) cache = all;
  return cache;
}

/** La voz para un perfil: la mejor de su género (o la mejor en español si no se sabe el género). */
export function pickVoice(p: VoiceProfile, list: SpeechSynthesisVoice[] = voices()): { voice: SpeechSynthesisVoice | null; matched: boolean } {
  const es = list.filter((v) => voiceScore(v) > -50).sort((a, b) => voiceScore(b) - voiceScore(a));
  if (!es.length) return { voice: null, matched: false };
  const same = es.filter((v) => voiceGender(v) === p.gender);
  // Solo se usan voces de buena calidad para variar entre personajes; si no, la mejor.
  const top = same.filter((v) => voiceScore(v) >= voiceScore(same[0] ?? es[0]) - 4);
  if (top.length) return { voice: top[p.slot % top.length], matched: true };
  return { voice: es[0], matched: false };
}

/** Limpia el texto para que se lea natural: sin emojis, comillas ni símbolos. Conserva los saltos de línea (pausas largas). */
export function speakable(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}|️|‍/gu, "")
    .replace(/[«»"“”]/g, "")
    .replace(/\b50\/50\b/g, "cincuenta cincuenta")
    .replace(/\bXP\b/g, "puntos de experiencia")
    .replace(/(\d)\s?%/g, "$1 por ciento")
    .replace(/[^\S\n]*[·•|→][^\S\n]*/g, ", ")
    .replace(/\.{3}|…/g, "… ")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

export interface Phrase { text: string; /** Silencio después de la frase, en milisegundos. */ pause: number }

/** Pausas como las de una persona que lee en voz alta: más largas al cerrar una idea o un título. */
const PAUSE = { titulo: 750, parrafo: 650, punto: 480, pregunta: 520, dosPuntos: 400, puntoYComa: 340, coma: 220 };

function pauseAfter(phrase: string, endOfLine: boolean): number {
  const end = phrase.trim().slice(-1);
  if (endOfLine) return /[.!?…:;,]/.test(end) ? PAUSE.parrafo : PAUSE.titulo; // una línea sin punto final es un título
  if (end === "?" || end === "!") return PAUSE.pregunta;
  if (end === "…") return PAUSE.parrafo;
  if (end === ":") return PAUSE.dosPuntos;
  if (end === ";") return PAUSE.puntoYComa;
  if (end === ",") return PAUSE.coma;
  return PAUSE.punto;
}

/**
 * Parte el texto en frases cortas, cada una con su pausa (la síntesis suena mejor, no se corta
 * en textos largos y no lee todo de corrido). Cada salto de línea (título, párrafo) es una pausa larga.
 */
export function phrases(text: string): Phrase[] {
  const out: Phrase[] = [];
  const lines = speakable(text).split("\n").filter((l) => l.trim());
  lines.forEach((line, li) => {
    const parts: string[] = [];
    for (const s of line.split(/(?<=[.!?…])\s+(?=[\p{Lu}¿¡\d])|(?<=[:;])\s+/u)) {
      let rest = s.trim();
      while (rest.length > 200) {
        const cut = rest.lastIndexOf(",", 200);
        const at = cut > 60 ? cut + 1 : 200;
        parts.push(rest.slice(0, at).trim());
        rest = rest.slice(at).trim();
      }
      if (rest) parts.push(rest);
    }
    parts.forEach((t, i) => {
      const last = i === parts.length - 1;
      out.push({ text: t, pause: last && li === lines.length - 1 ? 0 : pauseAfter(t, last) });
    });
  });
  return out;
}

/** Solo el texto de cada frase. */
export function sentences(text: string): string[] {
  return phrases(text).map((p) => p.text);
}

// ----- Reproducción -----
type Listener = (speaking: string | null) => void;
const listeners = new Set<Listener>();
let speakingId: string | null = null;
let token = 0;

function setSpeaking(id: string | null) {
  speakingId = id;
  duckMusic(id !== null);
  for (const l of listeners) l(id);
}

export function onSpeaking(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

export function stopSpeaking() {
  token++;
  if (isSpeechAvailable()) window.speechSynthesis.cancel();
  setSpeaking(null);
}

/**
 * Lee un texto con la voz de un personaje. `id` identifica quién habla (para animar su globo).
 * Devuelve una promesa que se cumple al terminar (o al interrumpirse).
 */
export function speak(text: string, character: string, id = character): Promise<void> {
  if (!isSpeechAvailable() || !getSettings().voices) return Promise.resolve();
  stopSpeaking();
  const my = ++token;
  const p = profileFor(character);
  const parts = phrases(text);
  if (!parts.length) return Promise.resolve();
  const synth = window.speechSynthesis;
  const run = () => new Promise<void>((resolve) => {
    const { voice, matched } = pickVoice(p);
    // Si no hay voz del género del personaje, se ajusta un poco el tono (sin exagerar).
    const pitch = matched ? p.pitch : p.gender === "m" ? Math.min(p.pitch, 0.88) : Math.max(p.pitch, 1.08);
    setSpeaking(id);
    let i = 0;
    const next = () => {
      if (my !== token) return resolve();
      if (i >= parts.length) { setSpeaking(null); return resolve(); }
      const part = parts[i++];
      const u = new SpeechSynthesisUtterance(part.text);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = "es-CO";
      u.pitch = pitch;
      // Pequeña variación entre frases: el habla humana no tiene un ritmo fijo.
      u.rate = p.rate * (1 + (((i * 37) % 7) - 3) / 100);
      u.volume = 1;
      u.onend = () => setTimeout(next, part.pause);
      u.onerror = () => { if (my === token) setSpeaking(null); resolve(); };
      synth.speak(u);
    };
    next();
  });
  // Las voces se cargan de forma asíncrona la primera vez.
  if (!synth.getVoices().length) {
    return new Promise((resolve) => {
      let started = false;
      const go = () => {
        if (started) return;
        started = true;
        synth.removeEventListener("voiceschanged", go);
        run().then(resolve);
      };
      synth.addEventListener("voiceschanged", go);
      setTimeout(go, 700);
    });
  }
  return run();
}

export function currentSpeaker(): string | null {
  return speakingId;
}
