import { Sprite } from "@/components/sprite";

/** Un personaje que habla: retrato a un lado y globo de diálogo al otro. */
export function SpeechBubble({
  name, src, alt, children, tone = "cyan", className = "",
}: {
  name: string; src: string; alt: string; children: React.ReactNode; tone?: "cyan" | "gold" | "coral" | "violet"; className?: string;
}) {
  const border = { cyan: "border-cyan/40", gold: "border-gold/50", coral: "border-coral/50", violet: "border-violet/50" }[tone];
  const label = { cyan: "text-cyan", gold: "text-gold", coral: "text-coral", violet: "text-[#b9a0ff]" }[tone];
  return (
    <div className={`flex items-end gap-3 sm:gap-4 ${className}`}>
      <Sprite key={src} src={src} alt={alt} className="h-24 w-auto shrink-0 sm:h-28" />
      <div className={`relative mb-3 min-w-0 flex-1 rounded-2xl border bg-panel/95 px-4 py-3 sm:px-5 ${border}`}>
        <span aria-hidden="true" className={`absolute -left-2 bottom-4 size-4 rotate-45 border-b border-l bg-panel ${border}`} />
        <p className={`text-xs font-bold uppercase tracking-wider ${label}`}>{name}</p>
        <div className="mt-1 text-[0.95rem] leading-relaxed sm:text-base">{children}</div>
      </div>
    </div>
  );
}
