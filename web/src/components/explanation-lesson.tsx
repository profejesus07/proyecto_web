"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeReadingAction, type ReadingOutcome } from "@/app/actions/game";
import { SpeechBubble } from "@/components/dialogue";
import { SceneTheme, SpeakButton } from "@/components/sound";
import { Sprite, asset } from "@/components/sprite";
import { inlineParts, parseBody, plainBody, videoEmbedUrl } from "@/lib/lessons";
import { EN_TEXTO, Icon } from "@/components/icons";

function Inline({ text }: { text: string }) {
  return <>{inlineParts(text).map((p, i) => (p.bold ? <strong key={i} className="text-text">{p.text}</strong> : <span key={i}>{p.text}</span>))}</>;
}

/** Lección de explicación: se lee (o se escucha) y luego se continúa a practicar. */
export function ExplanationLesson({ missionId, title, intro, body, videoUrl, courseTitle, courseSlug, xpReward, done, nextMissionId, subscribe }: {
  missionId: string; title: string; intro: string; body: string; videoUrl: string | null;
  courseTitle: string; courseSlug: string; xpReward: number; done: boolean;
  nextMissionId: string | null; subscribe: { href: string; price: string } | null;
}) {
  const [pending, start] = useTransition();
  const [outcome, setOutcome] = useState<ReadingOutcome | null>(null);
  const embed = videoEmbedUrl(videoUrl);
  const finished = done || outcome?.ok;
  const next = nextMissionId ? (subscribe ? { href: subscribe.href, label: `Desbloquear el curso (${subscribe.price})` } : { href: `/mision/${nextMissionId}`, label: "Ir a practicar →" }) : { href: `/portales/${courseSlug}`, label: "Volver al portal" };

  return (
    <article className="space-y-6" aria-labelledby="exp-t">
      <SceneTheme theme="cronicas" />
      <header className="panel relative isolate overflow-hidden rounded-3xl p-6 sm:p-8">
        <Sprite src={asset.scene("cronicas", "calma")} alt="" decorative priority className="absolute inset-0 -z-10 size-full object-cover opacity-30" />
        <p className="text-sm font-bold uppercase tracking-wider text-cyan"><Icon name="book" className={EN_TEXTO} /> Explicación · {courseTitle}</p>
        <h1 id="exp-t" className="mt-2 text-3xl sm:text-4xl">{title}</h1>
      </header>

      {intro && (
        <SpeechBubble name="Maestra Sora" src={asset.sora("hablar")} alt="Sora, tu guía" auto>{intro}</SpeechBubble>
      )}

      <section className="panel space-y-4 p-6 sm:p-8" aria-label="Contenido de la explicación">
        <div className="flex justify-end"><SpeakButton name="Archivista Eon" text={`${title}\n${plainBody(body)}`} /></div>
        <div className="space-y-4 text-lg leading-relaxed text-text/90">
          {parseBody(body).map((b, i) => {
            if (b.type === "h") return <h2 key={i} className="pt-2 text-2xl text-cyan"><Inline text={b.text} /></h2>;
            if (b.type === "p") return <p key={i}><Inline text={b.text} /></p>;
            const List = b.type === "ul" ? "ul" : "ol";
            return (
              <List key={i} className={`space-y-1.5 pl-6 ${b.type === "ul" ? "list-disc" : "list-decimal"} marker:text-cyan`}>
                {b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}
              </List>
            );
          })}
        </div>
        {embed && (
          <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-black">
            <iframe src={embed} title={`Video: ${title}`} className="size-full" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
          </div>
        )}
      </section>

      <div className="panel flex flex-wrap items-center justify-between gap-4 p-5" role="status">
        {finished ? (
          <>
            <div className="flex items-center gap-3">
              <Sprite src={asset.kuro("celebrar")} alt="" decorative className="h-16 w-auto" />
              <div>
                <p className="font-display text-xl font-bold">¡Explicación completada!</p>
                {outcome?.ok && outcome.result.first && <p className="text-sm text-gold">+{outcome.result.xpGain} XP · +{outcome.result.coinsGain} monedas</p>}
                {outcome?.ok && outcome.newRanks.length > 0 && <p className="text-sm font-bold text-ok">¡Subiste a rango {outcome.newRanks.at(-1)}!</p>}
              </div>
            </div>
            <Link href={next.href} className="btn btn-primary">{next.label}</Link>
          </>
        ) : (
          <>
            <p className="text-muted">Cuando la hayas leído, continúa para practicar lo que aprendiste. <span className="text-gold">+{xpReward} XP</span></p>
            <button type="button" className="btn btn-primary" disabled={pending}
              onClick={() => start(async () => setOutcome(await completeReadingAction(missionId)))}>
              {pending ? "Guardando…" : "¡Entendido! Continuar"}
            </button>
          </>
        )}
        {outcome && !outcome.ok && <p role="alert" className="w-full text-sm text-err">{outcome.error}</p>}
      </div>
    </article>
  );
}
