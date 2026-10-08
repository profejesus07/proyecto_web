"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { setTheme, sfx, unlockAudio, type Theme } from "@/lib/audio/music";
import { getServerSettings, getSettings, subscribeSettings, updateSettings } from "@/lib/audio/settings";
import { isSpeechAvailable, onSpeaking, speak, stopSpeaking } from "@/lib/audio/voices";
import { Icon } from "@/components/icons";

const noop = () => () => {};

export function useSoundSettings() {
  return useSyncExternalStore(subscribeSettings, getSettings, getServerSettings);
}

/** Tema musical de cada sección. Admin y docentes trabajan en silencio. */
export function themeForPath(path: string): Theme | null {
  if (path.startsWith("/admin") || path.startsWith("/maestro") || path.startsWith("/constancia") || path.startsWith("/pago")) return null;
  if (path.startsWith("/mision")) return "mazmorra";
  if (path.startsWith("/cronicas")) return "cronicas";
  if (path.startsWith("/tienda")) return "tienda";
  if (path.startsWith("/familia")) return "hogar";
  return "gremio";
}

/**
 * Director de audio: activa el sonido en el primer toque (regla de los navegadores)
 * y cambia la música según la sección. Va una sola vez en el diseño de la app.
 */
export function AudioDirector() {
  const path = usePathname();
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  useEffect(() => {
    setTheme(themeForPath(path));
    // Al cambiar de página, nadie sigue hablando.
    stopSpeaking();
  }, [path]);
  return null;
}

/** Cambia el tema mientras este componente está en pantalla (p. ej. la batalla contra un Guardián). */
export function SceneTheme({ theme }: { theme: Theme }) {
  const path = usePathname();
  useEffect(() => {
    setTheme(theme);
    return () => setTheme(themeForPath(path));
  }, [theme, path]);
  return null;
}

/** Botón de sonido de la cabecera: música, voces, lectura automática y efectos. */
export function SoundControl() {
  const s = useSoundSettings();
  const id = useId();
  const canSpeak = useSyncExternalStore(noop, isSpeechAvailable, () => true);
  const allOff = !s.music && !s.voices && !s.sfx;
  return (
    <details className="relative">
      <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-full border border-line bg-panel/70 text-base hover:border-cyan/60 [&::-webkit-details-marker]:hidden"
        aria-label="Sonido" title="Sonido">
        <Icon name={allOff ? "mute" : "volume"} className="size-5" />
      </summary>
      <div className="absolute right-0 top-11 z-50 w-72 space-y-3 rounded-2xl border border-line bg-bg-2 p-4 text-sm shadow-2xl" role="group" aria-label="Opciones de sonido">
        <p className="font-display text-base font-bold">Sonido</p>
        {([
          ["music", "music", "Música de fondo"],
          ["voices", "feedback", "Voces de los personajes"],
          ["autoRead", "book", "Leer los diálogos al aparecer"],
          ["sfx", "sparkles", "Efectos de sonido"],
        ] as const).map(([k, icon, label]) => (
          <label key={k} className="flex cursor-pointer items-center justify-between gap-3">
            <span className="flex items-center gap-2"><Icon name={icon} className="size-4 shrink-0 text-muted" />{label}</span>
            <input type="checkbox" checked={s[k]} disabled={k === "autoRead" && !s.voices} className="size-4 accent-accion"
              onChange={(e) => { unlockAudio(); updateSettings({ [k]: e.target.checked }); if (k === "voices" && !e.target.checked) stopSpeaking(); }} />
          </label>
        ))}
        <label htmlFor={`${id}-vol`} className="block space-y-1">
          <span className="text-muted">Volumen de la música</span>
          <input id={`${id}-vol`} type="range" min={0} max={1} step={0.05} value={s.musicVolume} disabled={!s.music} className="w-full accent-accion"
            onChange={(e) => { unlockAudio(); updateSettings({ musicVolume: Number(e.target.value) }); }} />
        </label>
        <button type="button" className="btn btn-ghost btn-sm w-full" onClick={() => { unlockAudio(); updateSettings({ voices: true }); void speak("¡Hola! Así suena mi voz. Cuando quieras, seguimos aprendiendo.", "Maestra Sora", "prueba"); }}>
          Probar la voz de Sora
        </button>
        {!canSpeak && <p className="hint">Este navegador no tiene voces: los diálogos se leen en pantalla.</p>}
      </div>
    </details>
  );
}

/** Sigue quién está hablando (para animar su globo). */
export function useSpeaking(id: string): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => onSpeaking((who) => setOn(who === id)), [id]);
  return on;
}

let autoplayed = new Set<string>();

/**
 * Botón «Escuchar» dentro de un globo de diálogo. Lee el texto del globo con la voz del personaje.
 * Con `auto`, lo lee solo al aparecer (si la persona ya tocó la página y tiene activada la lectura automática).
 */
export function SpeakButton({ name, auto = false, text }: { name: string; auto?: boolean; text?: string }) {
  const s = useSoundSettings();
  const ref = useRef<HTMLButtonElement>(null);
  const id = useId();
  const speaking = useSpeaking(id);
  const ready = useSyncExternalStore(noop, isSpeechAvailable, () => false);

  // innerText respeta los saltos entre párrafos (la voz hace pausa en ellos); textContent los pegaría.
  const said = () => text ?? ref.current?.closest("[data-bubble]")?.querySelector<HTMLElement>("[data-say]")?.innerText ?? "";
  const read = () => speak(said(), name, id);

  // Anima el retrato mientras habla.
  useEffect(() => {
    const bubble = ref.current?.closest("[data-bubble]");
    if (!bubble) return;
    if (speaking) bubble.setAttribute("data-speaking", "");
    else bubble.removeAttribute("data-speaking");
  }, [speaking]);

  useEffect(() => {
    if (!auto || !ready || !s.voices || !s.autoRead) return;
    const key = `${name}:${said()}`;
    const active = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? false;
    if (!active || autoplayed.has(key)) return;
    autoplayed.add(key);
    if (autoplayed.size > 200) autoplayed = new Set([key]);
    const t = setTimeout(() => void read(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al aparecer o al cambiar el texto
  }, [auto, ready, s.voices, s.autoRead, text, name]);

  if (!ready || !s.voices) return null;
  return (
    <button ref={ref} type="button" onClick={() => { unlockAudio(); if (speaking) stopSpeaking(); else void read(); }}
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.7rem] font-bold text-muted transition hover:border-cyan/50 hover:text-text"
      aria-label={speaking ? `Detener la voz de ${name}` : `Escuchar a ${name}`}>
      {speaking ? <><span className="voice-wave" aria-hidden="true"><i /><i /><i /></span> Detener</> : <><Icon name="volume" className="size-4" /> Escuchar</>}
    </button>
  );
}

/** Efecto de sonido al montar (p. ej. victoria). */
export function PlaySfx({ name }: { name: Parameters<typeof sfx>[0] }) {
  useEffect(() => { sfx(name); }, [name]);
  return null;
}
