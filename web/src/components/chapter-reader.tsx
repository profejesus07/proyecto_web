"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { markChapterReadAction } from "@/app/actions/game";
import { SpeakButton } from "@/components/sound";
import { Sprite, asset } from "@/components/sprite";
import { sfx } from "@/lib/audio/music";

/** Lector de un capítulo: Eon narra página a página sobre el escenario del Archivo. */
export function ChapterReader({
  id, title, scene, guest, pages, next, alreadyRead,
}: {
  id: string; title: string; scene: string; guest: { src: string; alt: string } | null; pages: string[];
  next: { id: string; title: string } | null; alreadyRead: boolean;
}) {
  const [page, setPage] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);
  const last = page === pages.length - 1;

  useEffect(() => {
    if (!alreadyRead) void markChapterReadAction(id);
  }, [id, alreadyRead]);

  function go(to: number) {
    sfx("pagina");
    setPage(to);
    requestAnimationFrame(() => textRef.current?.focus({ preventScroll: true }));
  }

  return (
    <article className="space-y-5" aria-labelledby="cap-titulo">
      <header className="space-y-1">
        <p className="eyebrow !text-[#b9a0ff]">Crónicas del Archivo</p>
        <h1 id="cap-titulo" className="text-3xl leading-tight sm:text-4xl">{title}</h1>
      </header>

      <div className="panel relative isolate aspect-[4/3] overflow-hidden rounded-3xl sm:aspect-[16/9]">
        <Sprite src={asset.scene("cronicas", scene)} alt="" decorative priority className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-bg/70 to-transparent" />
        <Sprite key={last ? "eon-celebrar" : page === 0 ? "eon-cronica" : "eon-hablar"} src={asset.eon(last ? "animar" : page === 0 ? "cronica" : "hablar")} alt="El Archivista Eon narra"
          className="absolute bottom-[3%] left-[4%] h-[62%] w-auto sm:left-[10%]" />
        {guest && <Sprite src={guest.src} alt={guest.alt} className="absolute bottom-[4%] right-[4%] h-[48%] w-auto sm:right-[12%]" />}
      </div>

      <div data-bubble className="panel space-y-5 !border-violet/40 p-6 sm:p-8">
        <div className="flex justify-end">
          {/* El Archivista Eon narra cada página con su voz. */}
          <SpeakButton key={page} name="Archivista Eon" text={page === 0 ? `${title}\n${pages[0]}` : pages[page]} auto />
        </div>
        <div ref={textRef} tabIndex={-1} aria-live="polite" className="min-h-28 outline-none">
          <p key={page} className="pop font-display text-xl leading-relaxed sm:text-2xl">{pages[page]}</p>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {pages.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= page ? "bg-violet" : "bg-white/15"}`} />)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted">Página {page + 1} de {pages.length}</span>
          <div className="flex flex-wrap gap-2">
            {page > 0 && <button type="button" className="btn btn-secondary" onClick={() => go(page - 1)}>← Atrás</button>}
            {!last ? (
              <button type="button" className="btn btn-primary" onClick={() => go(page + 1)}>Seguir leyendo →</button>
            ) : next ? (
              <Link href={`/cronicas/${next.id}`} className="btn btn-primary">Siguiente: {next.title} →</Link>
            ) : (
              <Link href="/portales" className="btn btn-primary">Volver a la aventura →</Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
