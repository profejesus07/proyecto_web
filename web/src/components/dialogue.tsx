import { SpeakButton } from "@/components/sound";
import { Sprite } from "@/components/sprite";

/**
 * Un personaje que habla: retrato a un lado y globo de diálogo al otro.
 * Trae su botón «Escuchar» (voz del personaje); con `auto` lo lee solo al aparecer.
 */
export function SpeechBubble({
  name, src, alt, children, tone = "cyan", className = "", auto = false, voice,
}: {
  name: string; src: string; alt: string; children: React.ReactNode; tone?: "cyan" | "gold" | "coral" | "violet"; className?: string; auto?: boolean;
  /** Personaje cuya voz se usa (si el nombre del globo es otro, p. ej. el nombre de la familia). */
  voice?: string;
}) {
  const border = { cyan: "border-cyan/40", gold: "border-gold/50", coral: "border-coral/50", violet: "border-violet/50" }[tone];
  const label = { cyan: "text-cyan", gold: "text-gold", coral: "text-coral", violet: "text-[#b9a0ff]" }[tone];
  return (
    <div data-bubble className={`bubble flex items-end gap-3 sm:gap-4 ${className}`}>
      <div className="portrait shrink-0">
        <Sprite key={src} src={src} alt={alt} className="h-24 w-auto sm:h-28" />
      </div>
      <div className={`bubble-body relative mb-3 min-w-0 flex-1 rounded-2xl border bg-panel/95 px-4 py-3 sm:px-5 ${border}`}>
        <span aria-hidden="true" className={`absolute -left-2 bottom-4 size-4 rotate-45 border-b border-l bg-panel ${border}`} />
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs font-bold uppercase tracking-wider ${label}`}>{name}</p>
          <SpeakButton name={voice ?? name} auto={auto} />
        </div>
        <div data-say className="mt-1 text-[0.95rem] leading-relaxed sm:text-base">{children}</div>
      </div>
    </div>
  );
}
