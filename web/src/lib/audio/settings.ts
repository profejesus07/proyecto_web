/** Preferencias de sonido del navegador (cada persona en su equipo). */
export interface SoundSettings {
  /** Música de fondo. */
  music: boolean;
  /** Voces de los personajes. */
  voices: boolean;
  /** Leer en voz alta los diálogos al aparecer (después de la primera interacción). */
  autoRead: boolean;
  /** Efectos (acierto, error, victoria, poderes). */
  sfx: boolean;
  /** Volumen de la música, 0 a 1. */
  musicVolume: number;
}

export const DEFAULT_SETTINGS: SoundSettings = { music: true, voices: true, autoRead: true, sfx: true, musicVolume: 0.35 };
const KEY = "umbral-sonido";
const listeners = new Set<() => void>();
let current: SoundSettings | null = null;

function load(): SoundSettings {
  if (current) return current;
  current = DEFAULT_SETTINGS;
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    if (raw) {
      const v = JSON.parse(raw) as Partial<SoundSettings>;
      current = {
        music: typeof v.music === "boolean" ? v.music : DEFAULT_SETTINGS.music,
        voices: typeof v.voices === "boolean" ? v.voices : DEFAULT_SETTINGS.voices,
        autoRead: typeof v.autoRead === "boolean" ? v.autoRead : DEFAULT_SETTINGS.autoRead,
        sfx: typeof v.sfx === "boolean" ? v.sfx : DEFAULT_SETTINGS.sfx,
        musicVolume: typeof v.musicVolume === "number" && v.musicVolume >= 0 && v.musicVolume <= 1 ? v.musicVolume : DEFAULT_SETTINGS.musicVolume,
      };
    }
  } catch {
    // Sin almacenamiento (modo privado): se usan los valores por defecto.
  }
  return current;
}

export function getSettings(): SoundSettings {
  return load();
}

export function getServerSettings(): SoundSettings {
  return DEFAULT_SETTINGS;
}

export function updateSettings(patch: Partial<SoundSettings>) {
  current = { ...load(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Se mantiene solo en esta pestaña.
  }
  for (const l of listeners) l();
}

export function subscribeSettings(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
