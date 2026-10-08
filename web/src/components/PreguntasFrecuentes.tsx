import { PREGUNTAS, type PreguntaId } from "@/content/preguntas-frecuentes";

/** Preguntas frecuentes de una página pública: el texto sale de content/preguntas-frecuentes.ts. */
export function PreguntasFrecuentes({ ids, antetitulo, className = "" }: { ids: readonly PreguntaId[]; antetitulo?: string; className?: string }) {
  return (
    <section aria-labelledby="preguntas-t" className={`grid gap-10 lg:grid-cols-[1fr_1.6fr] ${className}`}>
      <div>
        {antetitulo && <p className="eyebrow">{antetitulo}</p>}
        <h2 id="preguntas-t" className={antetitulo ? "mt-2" : ""}>Preguntas frecuentes</h2>
      </div>
      <div className="divide-y divide-line border-y border-line">
        {ids.map((id) => (
          <details key={id} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
              {PREGUNTAS[id].q}
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-cyan/10 text-cyan transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 max-w-2xl text-muted">{PREGUNTAS[id].a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
