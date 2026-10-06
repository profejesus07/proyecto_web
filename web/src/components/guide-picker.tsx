"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveGuideAction } from "@/app/actions/guide";
import { Sprite } from "@/components/sprite";
import { guideSrc, type Guide } from "@/content/elenco";

/** Elegir retrato: Maestro del Gremio (docente) o Guardián del Hogar (familia). */
export function GuidePicker({ options, current, legend }: { options: readonly Guide[]; current: string; legend: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(current);
  const [error, setError] = useState<string | null>(null);

  function pick(id: string) {
    if (id === value) return;
    const before = value;
    setValue(id);
    setError(null);
    start(async () => {
      const r = await saveGuideAction(id);
      if (r.ok) router.refresh();
      else {
        setValue(before);
        setError("No pudimos guardar tu elección. Inténtalo de nuevo.");
      }
    });
  }

  return (
    <fieldset disabled={pending} className="space-y-2">
      <legend className="label">{legend}</legend>
      <div className="grid grid-cols-4 gap-2">
        {options.map((g) => (
          <label key={g.id} className="cursor-pointer">
            <input type="radio" name="guide" value={g.id} checked={value === g.id} onChange={() => pick(g.id)} className="peer sr-only" aria-label={g.name} />
            <span className="flex flex-col items-center gap-1 rounded-xl border-2 border-line bg-bg/40 p-1.5 text-center transition peer-checked:border-gold peer-checked:bg-gold/10 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan">
              <Sprite src={guideSrc(g, "saludar")} alt="" decorative className="h-24 w-auto" />
              <span className="text-[11px] font-bold leading-tight">{g.name}</span>
            </span>
          </label>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-err">{error}</p>}
    </fieldset>
  );
}
