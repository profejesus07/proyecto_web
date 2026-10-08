import { duckMusic } from "./music";
import { getSettings } from "./settings";

/**
 * Voces de los personajes con la síntesis de voz del navegador.
 * Para que suenen lo más humanas posible:
 *  · se elige la voz en español más natural disponible (las «Natural», «Neural», «Online» o de Google
 *    y Apple de mejor calidad), prefiriendo acentos latinoamericanos;
 *  · cada personaje se distingue sobre todo por su voz (cuando hay varias), no por el tono: el tono se
 *    queda entre 0,94 y 1,06 y la velocidad entre 0,97 y 1,06 (cambiar el tono es lo que más suena a
 *    robot; por debajo de 0,95 de velocidad se oye lento);
 *  · el texto se limpia (sin emojis ni símbolos) y cada párrafo se lee de corrido, en trozos de hasta
 *    unos 180 caracteres: así el motor hace la entonación de las frases y las pausas de los puntos y
 *    las comas, como una persona. Las pausas propias van solo entre párrafos y después de un título.
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
  "Maestra Sora": { gender: "f", pitch: 1.0, rate: 1.0, slot: 0 },
  Kuro: { gender: "f", pitch: 1.06, rate: 1.05, slot: 1 },
  "Archivista Eon": { gender: "m", pitch: 0.95, rate: 0.97, slot: 0 },
  Kael: { gender: "m", pitch: 1.02, rate: 1.05, slot: 1 },
  "Forjadora Brann": { gender: "f", pitch: 0.97, rate: 1.02, slot: 2 },
  "Maestra Ilia": { gender: "f", pitch: 1.0, rate: 1.0, slot: 1 },
  "Maestra Nadia": { gender: "f", pitch: 1.02, rate: 1.02, slot: 2 },
  "Maestro Olu": { gender: "m", pitch: 0.96, rate: 0.99, slot: 0 },
  "Maestro Ravi": { gender: "m", pitch: 1.0, rate: 1.01, slot: 1 },
  "Mamá Lucía": { gender: "f", pitch: 1.01, rate: 1.0, slot: 1 },
  "Papá Kenji": { gender: "m", pitch: 0.97, rate: 1.0, slot: 0 },
  "Abuela Amara": { gender: "f", pitch: 0.97, rate: 0.97, slot: 2 },
  "Abuelo Iker": { gender: "m", pitch: 0.95, rate: 0.97, slot: 1 },
  // Guardianes: más graves y pausados, sin pasarse.
  Petrox: { gender: "m", pitch: 0.94, rate: 0.97, slot: 0 },
  Ignaris: { gender: "m", pitch: 1.0, rate: 1.04, slot: 1 },
  Brumalis: { gender: "f", pitch: 0.96, rate: 0.97, slot: 2 },
  Mirelle: { gender: "f", pitch: 1.04, rate: 1.0, slot: 1 },
  Quimax: { gender: "m", pitch: 0.96, rate: 0.99, slot: 1 },
  Sandrael: { gender: "f", pitch: 0.97, rate: 0.97, slot: 0 },
  Eclipsa: { gender: "f", pitch: 0.98, rate: 0.98, slot: 2 },
  "Zhaal, el Vacío": { gender: "m", pitch: 0.94, rate: 0.97, slot: 0 },
};
const NARRATOR: VoiceProfile = { gender: "f", pitch: 1, rate: 1, slot: 0 };

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

/** Pausas entre trozos, como las de una persona que lee en voz alta (dentro de un trozo las hace el motor). */
const PAUSE = { titulo: 520, parrafo: 440, punto: 260, pregunta: 300, dosPuntos: 220, puntoYComa: 200, coma: 140 };
/** Largo máximo de un trozo: lo bastante largo para una entonación natural y lo bastante corto para que el
 *  navegador no lo corte (algunas voces se detienen en textos de más de unos 15 segundos). */
const CHUNK = 180;

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

/** Las frases de una línea, sin partir ninguna de más de CHUNK caracteres (esas se parten en una coma). */
function frasesDe(line: string): string[] {
  const out: string[] = [];
  for (const s of line.split(/(?<=[.!?…])\s+(?=[\p{Lu}¿¡\d])|(?<=[:;])\s+/u)) {
    let rest = s.trim();
    while (rest.length > CHUNK) {
      const cut = rest.lastIndexOf(",", CHUNK);
      const at = cut > 60 ? cut + 1 : CHUNK;
      out.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) out.push(rest);
  }
  return out;
}

/**
 * Parte el texto en trozos para leerlo en voz alta, cada uno con su pausa. Las frases de un mismo párrafo se
 * juntan en trozos de hasta CHUNK caracteres (el motor las entona y hace las pausas de los puntos, como al
 * hablar); cada salto de línea (título, párrafo) es una pausa más larga.
 */
export function phrases(text: string): Phrase[] {
  const out: Phrase[] = [];
  const lines = speakable(text).split("\n").filter((l) => l.trim());
  lines.forEach((line, li) => {
    const parts: string[] = [];
    for (const f of frasesDe(line)) {
      const last = parts.length - 1;
      if (last >= 0 && parts[last].length + 1 + f.length <= CHUNK) parts[last] += ` ${f}`;
      else parts.push(f);
    }
    parts.forEach((t, i) => {
      const last = i === parts.length - 1;
      out.push({ text: t, pause: last && li === lines.length - 1 ? 0 : pauseAfter(t, last) });
    });
  });
  return out;
}

/** Las frases del texto, una por una (sin juntar). */
export function sentences(text: string): string[] {
  return speakable(text).split("\n").filter((l) => l.trim()).flatMap(frasesDe);
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
    // Si no hay voz del género del personaje, el tono se mueve apenas: forzarlo suena más artificial que la voz.
    const pitch = matched ? p.pitch : p.gender === "m" ? Math.min(p.pitch, 0.95) : Math.max(p.pitch, 1.04);
    setSpeaking(id);
    let i = 0;
    const next = () => {
      if (my !== token) return resolve();
      if (i >= parts.length) { setSpeaking(null); return resolve(); }
      const part = parts[i++];
      const u = new SpeechSynthesisUtterance(part.text);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = "es-CO";
      u.pitch = pitch;
      // Ritmo parejo: cambiar la velocidad entre trozos se oye como saltos.
      u.rate = p.rate;
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
