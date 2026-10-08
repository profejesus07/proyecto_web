import { getSettings, subscribeSettings } from "./settings";

/**
 * Música de fondo y efectos, generados en el navegador con Web Audio (sin archivos que descargar).
 * Cada escena tiene su tema: acordes suaves (pads), un arpegio con reverberación y, en las batallas,
 * una percusión ligera. Solo suena después de que la persona toca la página (regla de los navegadores).
 */

export type Theme = "gremio" | "mazmorra" | "jefe" | "cronicas" | "tienda" | "hogar" | "victoria";

interface ThemeDef {
  bpm: number;
  /** Nota base (MIDI). */
  key: number;
  /** Acordes: [grado en semitonos desde la base, tipo]. Uno por compás. */
  chords: [number, "M" | "m" | "sus"][];
  /** Patrón del arpegio por compás (índices de las notas del acorde; -1 = silencio), en corcheas. */
  arp: number[];
  arpWave: OscillatorType;
  drums: boolean;
  /** Brillo del pad (frecuencia del filtro). */
  bright: number;
  bell?: boolean;
}

const THEMES: Record<Exclude<Theme, "victoria">, ThemeDef> = {
  // Gremio: cálido y tranquilo (Do mayor, I–vi–IV–V).
  gremio: { bpm: 74, key: 60, chords: [[0, "M"], [9, "m"], [5, "M"], [7, "M"]], arp: [0, 2, 1, 2, 3, 2, 1, -1], arpWave: "sine", drums: false, bright: 1400 },
  // Mazmorra: aventura con pulso (Re dórico).
  mazmorra: { bpm: 96, key: 62, chords: [[0, "m"], [-2, "M"], [-4, "M"], [-2, "M"]], arp: [0, 1, 2, 1, 3, 2, 1, 2], arpWave: "triangle", drums: true, bright: 1700 },
  // Jefe: tensión (La menor, con dominante).
  jefe: { bpm: 118, key: 57, chords: [[0, "m"], [-4, "M"], [-2, "M"], [7, "M"]], arp: [0, 2, 3, 2, 0, 2, 3, 1], arpWave: "sawtooth", drums: true, bright: 1200 },
  // Crónicas: misterio y campanas (Mi menor, lento).
  cronicas: { bpm: 60, key: 64, chords: [[0, "m"], [-4, "M"], [3, "M"], [-2, "M"]], arp: [0, -1, 2, -1, 3, -1, 1, -1], arpWave: "sine", drums: false, bright: 1000, bell: true },
  // Tienda: juguetona (Fa mayor).
  tienda: { bpm: 100, key: 65, chords: [[0, "M"], [9, "m"], [5, "M"], [7, "sus"]], arp: [0, 1, 2, 3, 2, 1, 0, -1], arpWave: "triangle", drums: false, bright: 1800 },
  // Hogar: muy suave (Sol mayor).
  hogar: { bpm: 66, key: 55, chords: [[0, "M"], [5, "M"], [9, "m"], [7, "sus"]], arp: [0, -1, 2, -1, 1, -1, 3, -1], arpWave: "sine", drums: false, bright: 1100 },
};

const SHAPES = { M: [0, 4, 7, 12], m: [0, 3, 7, 12], sus: [0, 5, 7, 12] };
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let reverb: ConvolverNode | null = null;
let theme: Theme | null = null;
let wanted: Theme | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let nextBar = 0;
let bar = 0;
let ducked = false;
let unlocked = false;

function impulse(c: AudioContext, seconds = 2.4): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  master.connect(comp).connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0;
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.55;
  reverb = ctx.createConvolver();
  reverb.buffer = impulse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.32;
  reverb.connect(wet).connect(master);
  musicBus.connect(master);
  musicBus.connect(reverb);
  sfxBus.connect(master);
  sfxBus.connect(reverb);
  subscribeSettings(applyVolume);
  return ctx;
}

function targetVolume(): number {
  const s = getSettings();
  if (!s.music) return 0;
  return s.musicVolume * 0.5 * (ducked ? 0.35 : 1);
}

function applyVolume() {
  if (!ctx || !musicBus) return;
  musicBus.gain.setTargetAtTime(targetVolume(), ctx.currentTime, 0.4);
  if (getSettings().music && wanted && !timer) start(wanted);
  if (!getSettings().music && timer) stopLoop();
}

/** Baja la música mientras un personaje habla. */
export function duckMusic(on: boolean) {
  ducked = on;
  applyVolume();
}

function note(dest: AudioNode, freq: number, t: number, dur: number, opts: { wave: OscillatorType; gain: number; attack?: number; release?: number; detune?: number; filter?: number }) {
  const c = ctx!;
  const o = c.createOscillator();
  o.type = opts.wave;
  o.frequency.value = freq;
  if (opts.detune) o.detune.value = opts.detune;
  const g = c.createGain();
  const a = opts.attack ?? 0.01;
  const r = opts.release ?? 0.3;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain, t + a);
  g.gain.setValueAtTime(opts.gain, t + Math.max(a, dur - r));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let out: AudioNode = g;
  if (opts.filter) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = opts.filter;
    f.Q.value = 0.6;
    g.connect(f);
    out = f;
  }
  o.connect(g);
  out.connect(dest);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function kick(t: number) {
  const c = ctx!;
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  o.connect(g).connect(musicBus!);
  o.start(t);
  o.stop(t + 0.3);
}

function hat(t: number, gain = 0.05) {
  const c = ctx!;
  const len = Math.floor(c.sampleRate * 0.05);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 7000;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(musicBus!);
  src.start(t);
}

function scheduleBar(def: ThemeDef, t: number) {
  const beat = 60 / def.bpm;
  const barLen = beat * 4;
  const [deg, kind] = def.chords[bar % def.chords.length];
  const root = def.key + deg;
  const tones = SHAPES[kind].map((x) => root + x);
  // Pad: dos osciladores apenas desafinados, entrada y salida lentas.
  for (const n of tones.slice(0, 3)) {
    for (const det of [-7, 7]) note(musicBus!, hz(n - 12), t, barLen + 0.6, { wave: "triangle", gain: 0.035, attack: 0.9, release: 1.1, detune: det, filter: def.bright });
  }
  // Bajo
  note(musicBus!, hz(root - 24), t, barLen * 0.95, { wave: "sine", gain: 0.12, attack: 0.04, release: 0.5 });
  // Arpegio en corcheas
  def.arp.forEach((idx, i) => {
    if (idx < 0) return;
    const at = t + i * (beat / 2);
    const f = hz(tones[idx] + 12);
    note(musicBus!, f, at, beat * 0.9, { wave: def.arpWave, gain: def.arpWave === "sawtooth" ? 0.018 : 0.04, attack: 0.008, release: beat * 0.6, filter: def.arpWave === "sine" ? undefined : 2200 });
    if (def.bell) note(musicBus!, f * 2, at, beat * 1.6, { wave: "sine", gain: 0.012, attack: 0.004, release: beat * 1.4 });
  });
  if (def.drums) {
    for (let b = 0; b < 4; b++) {
      if (b % 2 === 0 || def.bpm > 110) kick(t + b * beat);
      hat(t + b * beat + beat / 2);
    }
  }
}

function loop() {
  if (!ctx || !theme || theme === "victoria") return;
  const def = THEMES[theme];
  const barLen = (60 / def.bpm) * 4;
  // Si la pestaña estuvo en segundo plano, se retoma desde ahora (sin ráfagas de notas atrasadas).
  if (nextBar < ctx.currentTime) nextBar = ctx.currentTime + 0.05;
  while (nextBar < ctx.currentTime + 0.25) {
    scheduleBar(def, nextBar);
    nextBar += barLen;
    bar++;
  }
}

function stopLoop() {
  if (timer) clearInterval(timer);
  timer = null;
  theme = null;
}

function start(t: Theme) {
  const c = ensure();
  // Un cambio de tema pendiente no vuelve a encender la música si mientras tanto se pidió otra cosa (o silencio).
  if (!c || !unlocked || !getSettings().music || t === "victoria" || wanted !== t) return;
  if (theme === t && timer) return;
  stopLoop();
  theme = t;
  bar = 0;
  nextBar = c.currentTime + 0.1;
  timer = setInterval(loop, 60);
  loop();
  applyVolume();
}

/** Elige el tema de la escena actual. Empieza a sonar cuando la persona interactúa con la página. */
export function setTheme(t: Theme | null) {
  wanted = t;
  if (!t) {
    if (musicBus && ctx) musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    stopLoop();
    return;
  }
  if (unlocked) {
    // Cambio suave de tema: baja, cambia y vuelve a subir.
    if (musicBus && ctx && theme && theme !== t) {
      musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      setTimeout(() => start(t), 450);
    } else start(t);
  }
}

/** Se llama en el primer toque o tecla: los navegadores no dejan sonar audio antes. */
export function unlockAudio() {
  const c = ensure();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  if (!unlocked) {
    unlocked = true;
    if (wanted) start(wanted);
  }
}

// ----- Efectos -----
export type Sfx = "acierto" | "error" | "victoria" | "poder" | "moneda" | "rango" | "pagina" | "click";

export function sfx(name: Sfx) {
  const c = ensure();
  if (!c || !unlocked || !getSettings().sfx) return;
  const t = c.currentTime + 0.01;
  const play = (notes: number[], step: number, wave: OscillatorType, gain: number, dur: number) =>
    notes.forEach((n, i) => note(sfxBus!, hz(n), t + i * step, dur, { wave, gain, attack: 0.005, release: dur * 0.8 }));
  switch (name) {
    case "acierto": play([76, 83, 88], 0.07, "sine", 0.18, 0.35); break; // Mi–Si–Mi: brillante
    case "error": play([60, 57], 0.12, "triangle", 0.12, 0.4); break; // suave, sin castigar
    case "poder": play([72, 76, 79, 84, 88], 0.045, "sine", 0.12, 0.5); break;
    case "moneda": play([88, 93], 0.06, "square", 0.04, 0.25); break;
    case "pagina": play([79], 0, "sine", 0.06, 0.25); break;
    case "click": play([84], 0, "sine", 0.04, 0.08); break;
    case "victoria":
      play([67, 72, 76, 79], 0.11, "triangle", 0.14, 0.5);
      [72, 76, 79, 84].forEach((n) => note(sfxBus!, hz(n), t + 0.5, 1.6, { wave: "sine", gain: 0.08, attack: 0.02, release: 1.2 }));
      break;
    case "rango":
      play([60, 64, 67, 72, 76, 79, 84], 0.07, "triangle", 0.12, 0.6);
      [72, 76, 79, 84].forEach((n) => note(sfxBus!, hz(n), t + 0.55, 2, { wave: "sine", gain: 0.08, attack: 0.03, release: 1.6 }));
      break;
  }
}
