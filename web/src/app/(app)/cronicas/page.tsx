import type { Metadata } from "next";
import Link from "next/link";
import { SpeechBubble } from "@/components/dialogue";
import { Sprite, asset } from "@/components/sprite";
import { PageTitle } from "@/components/ui";
import { ELEMENT_COLOR, guardianBySlug } from "@/content/guardians";
import { requirePlayer } from "@/lib/auth";
import { loadChronicles, unreadCount } from "@/lib/data/chronicles";

export const metadata: Metadata = { title: "Archivo de Crónicas" };

export default async function ChroniclesPage() {
  const viewer = await requirePlayer("/cronicas");
  const shelves = await loadChronicles(viewer);
  const unread = unreadCount(shelves);

  return (
    <div className="space-y-8">
      <section className="panel relative isolate overflow-hidden rounded-3xl" aria-label="Archivo de Crónicas">
        <Sprite src={asset.scene("cronicas", "calma")} alt="" decorative priority className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/90 via-bg/60 to-transparent" />
        <div className="grid items-end gap-4 p-6 sm:p-10 md:grid-cols-[1fr_auto]">
          <div className="space-y-5 md:max-w-lg">
            <PageTitle eyebrow="Biblioteca infinita" title="Archivo de Crónicas">
              <p className="text-text/80">La historia de los Portales y sus Guardianes. Cada capítulo se abre cuando avanzas en tu aventura.</p>
            </PageTitle>
            <SpeechBubble name="Archivista Eon" src={asset.eon("saludar")} alt="El Archivista Eon" tone="violet" auto>
              {unread > 0
                ? <>Tienes <strong>{unread} {unread === 1 ? "capítulo nuevo" : "capítulos nuevos"}</strong> esperándote. Siéntate, que esta historia es larga.</>
                : "Cada libro de estos estantes guarda una historia. Cruza portales y te contaré más."}
            </SpeechBubble>
            <Link href="/cronicas/bestiario" className="btn btn-secondary w-fit">📖 Abrir el Bestiario</Link>
          </div>
        </div>
      </section>

      {shelves.map((shelf) => {
        const g = shelf.course ? guardianBySlug(shelf.course.guardian) : null;
        const color = shelf.course ? ELEMENT_COLOR[shelf.course.element] : "#8A5CFF";
        const title = shelf.course ? shelf.course.title : "Historia del Gremio";
        return (
          <section key={shelf.course?.slug ?? "gremio"} aria-labelledby={`estante-${shelf.course?.slug ?? "gremio"}`} className="space-y-4">
            <div className="flex items-center gap-3">
              {shelf.course && <Sprite src={asset.boss(shelf.course.guardian)} alt="" decorative className="size-12 object-contain" />}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{g ? `Crónicas de ${g.name}` : "El origen"}</p>
                <h2 id={`estante-${shelf.course?.slug ?? "gremio"}`} className="text-2xl">{title}</h2>
              </div>
            </div>
            <ol className="grid gap-3 md:grid-cols-3">
              {shelf.chapters.map(({ chapter: ch, unlocked, read }, i) => (
                <li key={ch.id}>
                  {unlocked ? (
                    <Link href={`/cronicas/${ch.id}`} className="panel group flex h-full flex-col gap-2 p-5 transition hover:-translate-y-0.5" style={{ borderColor: `${color}66` }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted">{shelf.course ? `Capítulo ${i + 1}` : "Prólogo"}</span>
                        {!read && <span className="rounded-md bg-gold px-2 py-0.5 text-xs font-extrabold text-ink">Nuevo</span>}
                      </div>
                      <h3 className="font-display text-lg font-bold leading-tight">{ch.title}</h3>
                      <p className="text-sm text-muted">{ch.teaser}</p>
                      <p className="mt-auto pt-2 text-sm font-semibold text-cyan">{read ? "Volver a leer →" : "Leer →"}</p>
                    </Link>
                  ) : (
                    <div className="panel flex h-full flex-col gap-2 border-dashed p-5 opacity-75" aria-label={`Capítulo ${i + 1} bloqueado`}>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">Capítulo {i + 1}</span>
                      <p className="font-display text-lg font-bold leading-tight">🔒 Páginas selladas</p>
                      <p className="text-sm text-muted">{ch.hint}</p>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
