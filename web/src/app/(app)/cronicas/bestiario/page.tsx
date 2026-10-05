import type { Metadata } from "next";
import { SpeechBubble } from "@/components/dialogue";
import { Sprite, asset } from "@/components/sprite";
import { BackLink, PageTitle } from "@/components/ui";
import { BEASTS } from "@/content/bestiario";
import { ELEMENT_COLOR, GUARDIANS } from "@/content/guardians";
import { requirePlayer } from "@/lib/auth";
import { loadCourseViews } from "@/lib/data/queries";
import { ALL_ENEMIES } from "@/lib/game/battle";

export const metadata: Metadata = { title: "Bestiario" };

export default async function BestiaryPage() {
  const viewer = await requirePlayer("/cronicas/bestiario");
  const courses = await loadCourseViews(viewer.id);
  const played = courses.some((c) => c.missions.some((m) => m.attempts > 0));
  // El Cofre Mímico aparece al final de las misiones largas: se descubre al terminar una.
  const mimicSeen = courses.some((c) => c.missions.some((m) => m.state === "completada"));
  const seen = (slug: string) => (slug === "cofre-mimico" ? mimicSeen : played);
  // Con módulos, cada módulo tiene su Guardián: se purifica al superar la prueba del módulo.
  const purified = new Set(courses.flatMap((c) => c.modules.length
    ? c.modules.filter((m) => c.missions.some((x) => x.moduleId === m.id && x.isBoss && x.state === "completada")).map((m) => m.guardian)
    : c.bossDefeated ? [c.guardian] : []));
  const inPortal = new Set(courses.flatMap((c) => (c.modules.length ? c.modules.map((m) => m.guardian) : [c.guardian])));
  const found = ALL_ENEMIES.filter((e) => seen(e.slug)).length + GUARDIANS.filter((g) => inPortal.has(g.slug)).length;

  return (
    <div className="space-y-8">
      <BackLink href="/cronicas">Archivo de Crónicas</BackLink>
      <PageTitle eyebrow="Archivo de Crónicas" title="Bestiario">
        <p className="text-muted">Las criaturas de las mazmorras y los Guardianes de los portales. Las que aún no conoces siguen en sombra.</p>
      </PageTitle>
      <SpeechBubble name="Archivista Eon" src={asset.eon("pensar")} alt="El Archivista Eon" tone="violet" className="max-w-3xl" auto>
        {played
          ? `Llevas ${found} de ${ALL_ENEMIES.length + GUARDIANS.length} criaturas registradas. Ninguna es malvada: cada una es un tropiezo pequeño que se vence aprendiendo.`
          : "Este libro se escribe con tus aventuras. Termina tu primera misión y anotaré las criaturas que encuentres."}
      </SpeechBubble>

      <section aria-labelledby="menores-t" className="space-y-4">
        <h2 id="menores-t" className="text-2xl">Criaturas de las mazmorras</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {ALL_ENEMIES.map((e) => {
            const lore = BEASTS.find((b) => b.slug === e.slug)!;
            const known = seen(e.slug);
            return (
              <li key={e.slug} className={`panel flex gap-4 p-5 ${known ? "" : "border-dashed"}`}>
                <div className="grid w-28 shrink-0 place-items-center rounded-xl bg-bg/40">
                  <Sprite src={asset.enemy(e.slug, known ? `especial-${e.special}` : "reposo")} alt={known ? `${e.name} usando su jugada especial` : "Criatura desconocida"}
                    className={`h-28 w-auto ${known ? "" : "brightness-0 opacity-40"}`} />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <h3 className="font-display text-xl font-bold">{known ? e.name : "???"}</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">{lore.role}</p>
                  {known ? (
                    <>
                      <p className="text-sm">{lore.lore}</p>
                      <p className="text-sm"><strong className="text-coral">⚡ {lore.special}</strong></p>
                      <p className="text-sm text-[#b6f5cb]">🛡️ {lore.howTo}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted">{e.slug === "cofre-mimico" ? "Termina una misión larga para descubrirla." : "Termina tu primera misión para descubrirla."}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="guardianes-t" className="space-y-4">
        <h2 id="guardianes-t" className="text-2xl">Guardianes de los portales</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GUARDIANS.map((g) => {
            const state = purified.has(g.slug) ? "purificado" : inPortal.has(g.slug) ? "portal" : "oculto";
            const color = ELEMENT_COLOR[Object.keys(ELEMENT_COLOR).find((k) => g.element.toLowerCase().includes(k)) ?? "sombra"];
            return (
              <li key={g.slug} className={`panel flex flex-col gap-2 p-4 ${state === "oculto" ? "border-dashed" : ""}`} style={state !== "oculto" ? { borderColor: `${color}77` } : undefined}>
                <div className="grid h-36 place-items-center rounded-xl bg-bg/40">
                  <Sprite src={asset.boss(g.slug, state === "purificado" ? "purificado" : "reposo")} alt={state === "oculto" ? "Guardián desconocido" : g.name}
                    className={`h-32 w-auto ${state === "oculto" ? "brightness-0 opacity-40" : ""}`} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: state === "oculto" ? undefined : color }}>
                  {state === "purificado" ? "✨ Purificado" : state === "portal" ? "Te espera en su portal" : `Rango ${g.rank} · Aún sin portal`}
                </p>
                <h3 className="font-display text-lg font-bold">{state === "oculto" ? "???" : g.name}</h3>
                {state === "oculto" ? (
                  <p className="text-sm text-muted">Su portal todavía no se ha abierto en el Gremio.</p>
                ) : (
                  <>
                    <p className="text-sm text-muted">{g.blurb}</p>
                    <p className="text-sm"><strong>Obstáculo:</strong> {g.obstacle}</p>
                    <p className="text-sm text-[#b6f5cb]"><strong>Se vence con:</strong> {g.weakness}</p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
