"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { activateAidAction, submitMissionAction, type SubmitOutcome } from "@/app/actions/game";
import { Sprite, asset } from "@/components/sprite";
import { RANKS } from "@/lib/game/ranks";

export interface QuizProps {
  missionId: string;
  title: string;
  intro: string;
  isBoss: boolean;
  xpReward: number;
  courseSlug: string;
  courseTitle: string;
  guardian: { slug: string; name: string };
  questions: { id: string; prompt: string; options: string[]; hasHint: boolean }[];
  nextMissionId: string | null;
  aids: {
    pista: { stock: number; usedToday: number; cap: number; freeAvailable: boolean };
    fifty: { stock: number; usedToday: number; cap: number; unlocked: boolean; minRank: string };
  };
  /** Lo que ya se reveló hoy en esta misión, por id de pregunta. */
  revealed: Record<string, { hint?: string; removed?: number[] }>;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function ScoreRing({ score, passed }: { score: number; passed: boolean }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-36 place-items-center" role="img" aria-label={`${score} por ciento de aciertos`}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={passed ? "#4ade80" : "#ffc83d"} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
      </svg>
      <span className="font-display text-4xl font-extrabold">{score}<span className="text-xl">%</span></span>
    </div>
  );
}

export function Quiz(p: QuizProps) {
  const total = p.questions.length;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => Array(total).fill(-1));
  const [revealed, setRevealed] = useState(p.revealed);
  const [pista, setPista] = useState(p.aids.pista);
  const [fifty, setFifty] = useState(p.aids.fifty);
  const [aidMsg, setAidMsg] = useState<string | null>(null);
  const [aidPending, startAid] = useTransition();
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const q = p.questions[idx];
  const chosen = answers[idx];
  const shown = revealed[q.id] ?? {};
  const removed = shown.removed ?? [];
  const last = idx === total - 1;
  const answered = answers.filter((a) => a >= 0).length;

  function choose(i: number) {
    setAnswers((a) => a.map((v, k) => (k === idx ? i : v)));
  }
  function go(to: number) {
    setIdx(to);
    setAidMsg(null);
    requestAnimationFrame(() => headingRef.current?.focus());
  }
  function send() {
    startTransition(async () => {
      const res = await submitMissionAction(p.missionId, answers);
      setOutcome(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  function retry() {
    setOutcome(null);
    setAnswers(Array(total).fill(-1));
    setAidMsg(null);
    setIdx(0);
  }
  function askAid(kind: "pista" | "5050") {
    const at = idx;
    const qid = q.id;
    setAidMsg(null);
    startAid(async () => {
      const r = await activateAidAction(qid, kind);
      if (!r.ok) {
        setAidMsg(r.error);
        return;
      }
      setRevealed((all) => ({ ...all, [qid]: { ...all[qid], ...(r.hint !== undefined && { hint: r.hint }), ...(r.removed && { removed: r.removed }) } }));
      if (kind === "pista") {
        setPista((s) => ({ ...s, stock: r.left, usedToday: s.usedToday + (r.charged ? 1 : 0), freeAvailable: r.free ? false : s.freeAvailable }));
      } else {
        setFifty((s) => ({ ...s, stock: r.left, usedToday: s.usedToday + (r.charged ? 1 : 0) }));
        // Si había elegido una opción descartada, se libera.
        if (r.removed) setAnswers((a) => a.map((v, k) => (k === at && r.removed!.includes(v) ? -1 : v)));
      }
    });
  }

  const pistaCapped = pista.usedToday >= pista.cap;
  const pistaReady = pista.freeAvailable || (pista.stock > 0 && !pistaCapped);
  const fiftyCapped = fifty.usedToday >= fifty.cap;
  const fiftyReady = fifty.unlocked && fifty.stock > 0 && !fiftyCapped;
  const needShop = (q.hasHint && !shown.hint && !pista.freeAvailable && pista.stock === 0) || (fifty.unlocked && removed.length === 0 && fifty.stock === 0);

  // ===== Resultado =====
  if (outcome?.ok) {
    const { result, review, newRanks, items } = outcome;
    const win = result.passed;
    const bossWin = p.isBoss && win;
    return (
      <div className="space-y-6" aria-live="polite">
        <section className="panel panel-glow relative isolate overflow-hidden rounded-3xl text-center">
          <Sprite src={asset.scene("arena", bossWin ? "victoria" : "calma")} alt="" decorative className="absolute inset-0 -z-10 size-full object-cover opacity-70" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg/60 to-bg/90" />
          <div className="flex flex-col items-center gap-4 px-6 py-10">
            <p className="eyebrow">{p.isBoss ? "Prueba del Guardián" : "Misión"}</p>
            <h1 className="text-4xl sm:text-5xl">
              {bossWin ? `¡Purificaste a ${p.guardian.name}!` : win ? "¡Misión superada!" : p.isBoss ? "Hora de reagruparse" : "Casi lo logras"}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <ScoreRing score={result.score} passed={win} />
              {p.isBoss ? (
                <Sprite src={asset.boss(p.guardian.slug, bossWin ? "purificado" : "reposo")} alt={bossWin ? `${p.guardian.name} purificado, en forma de luz` : p.guardian.name} className="h-40 w-auto" />
              ) : (
                <Sprite src={asset.kuro(win ? "celebrar" : "animar")} alt={win ? "Kuro celebra contigo" : "Kuro te anima"} className="h-36 w-auto" />
              )}
            </div>
            <p className="max-w-lg text-lg text-muted">
              {bossWin
                ? "Venciste al obstáculo con lo que aprendiste. Tu recompensa ya está en tu perfil."
                : win
                  ? result.first ? "Aprobaste con éxito. ¡Mira lo que ganaste!" : "Volviste a superarla. Repetir te ayuda a recordar, aunque ya no da más XP."
                  : `Necesitas ${outcome.passMark}% para superarla. Repasa las explicaciones de abajo y vuelve a intentarlo: equivocarse es parte de aprender.`}
            </p>

            {result.first && (
              <ul className="flex flex-wrap justify-center gap-2" aria-label="Recompensas">
                {result.xpGain > 0 && <li className="chip !border-violet/60 !bg-violet/20 text-base">✨ +{result.xpGain} XP</li>}
                {result.coinsGain > 0 && <li className="chip !border-gold/60 !bg-gold/15 text-base">🪙 +{result.coinsGain}</li>}
                {result.gemsGain > 0 && <li className="chip !border-cyan/60 !bg-cyan/15 text-base">💎 +{result.gemsGain}</li>}
              </ul>
            )}
            {newRanks.length > 0 && (
              <p className="rounded-xl border border-gold/60 bg-gold/15 px-5 py-3 text-lg font-bold text-[#ffe3a0]">
                🎉 ¡Subiste al rango {newRanks[newRanks.length - 1]} · {RANKS.find((r) => r.key === newRanks[newRanks.length - 1])?.name}!
              </p>
            )}
            {items.length > 0 && (
              <div className="w-full space-y-3 pt-2">
                <p className="font-display text-xl font-bold">Nuevos objetos</p>
                <ul className="flex flex-wrap justify-center gap-3">
                  {items.map((it) => (
                    <li key={it.id} className="panel flex w-32 flex-col items-center gap-1 p-3" style={{ borderColor: `${it.color}88` }}>
                      <Sprite src={it.image} alt={it.alt} className="size-20" />
                      <span className="text-sm font-bold leading-tight">{it.name}</span>
                      <span className="text-[0.7rem] font-bold uppercase tracking-wider" style={{ color: it.color }}>{it.rarity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {win && p.nextMissionId && <Link href={`/mision/${p.nextMissionId}`} className="btn btn-primary btn-lg">Siguiente misión</Link>}
              {!win && <button type="button" onClick={retry} className="btn btn-primary btn-lg">Intentarlo de nuevo</button>}
              <Link href={`/portales/${p.courseSlug}`} className="btn btn-secondary btn-lg">Volver al portal</Link>
            </div>
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="repaso">
          <h2 id="repaso" className="text-2xl">Repaso de tus respuestas</h2>
          <ol className="space-y-3">
            {p.questions.map((qq, i) => {
              const r = review[i];
              return (
                <li key={qq.id} className={`panel space-y-2 p-5 ${r.correct ? "!border-green/50" : "!border-coral/50"}`}>
                  <p className="flex gap-3 font-bold"><span aria-hidden="true">{r.correct ? "✅" : "❌"}</span><span><span className="sr-only">{r.correct ? "Correcta. " : "Incorrecta. "}</span>{qq.prompt}</span></p>
                  {!r.correct && <p className="pl-9 text-sm text-muted">Tu respuesta: {r.chosen >= 0 ? qq.options[r.chosen] : "sin responder"}</p>}
                  <p className="pl-9 text-sm"><span className="text-green">Respuesta correcta: </span><strong>{qq.options[r.correctIndex]}</strong></p>
                  <p className="pl-9 text-sm text-muted">💡 {r.explanation}</p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    );
  }

  // ===== Preguntas =====
  return (
    <div className="space-y-6">
      <header className={`panel flex items-center gap-4 p-4 sm:p-5 ${p.isBoss ? "panel-glow" : ""}`}>
        {p.isBoss ? (
          <Sprite src={asset.boss(p.guardian.slug)} alt={p.guardian.name} className="h-24 w-auto shrink-0 sm:h-28" />
        ) : (
          <Sprite src={asset.kuro("pensar")} alt="Kuro piensa contigo" className="h-20 w-auto shrink-0" />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <p className="eyebrow">{p.isBoss ? `Prueba de ${p.guardian.name}` : p.courseTitle}</p>
          <h1 className="text-2xl leading-tight sm:text-3xl">{p.title}</h1>
          <p className="text-sm text-muted">{p.intro}</p>
        </div>
      </header>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Pregunta {idx + 1} de {total}</span>
          <span className="text-muted">{answered} respondida{answered === 1 ? "" : "s"}</span>
        </div>
        <ol className="flex gap-1.5" aria-label="Progreso">
          {p.questions.map((qq, i) => (
            <li key={qq.id} className="flex-1">
              <button type="button" onClick={() => go(i)} aria-label={`Ir a la pregunta ${i + 1}${answers[i] >= 0 ? ", respondida" : ""}`} aria-current={i === idx ? "step" : undefined}
                className={`block h-2.5 w-full rounded-full transition ${i === idx ? "bg-cyan" : answers[i] >= 0 ? "bg-violet" : "bg-white/15 hover:bg-white/25"}`} />
            </li>
          ))}
        </ol>
      </div>

      <fieldset className="panel space-y-5 p-5 sm:p-7" disabled={pending}>
        <legend className="sr-only">Pregunta {idx + 1}</legend>
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl leading-snug outline-none sm:text-3xl">{q.prompt}</h2>
        <div className="grid gap-3" role="radiogroup" aria-label="Opciones">
          {q.options.map((opt, i) => {
            const out = removed.includes(i);
            return (
              <label key={i} className={out ? "cursor-not-allowed" : "cursor-pointer"} data-descartada={out || undefined}>
                <input type="radio" name={`q-${q.id}`} value={i} checked={chosen === i} onChange={() => choose(i)} disabled={out} className="peer sr-only" />
                <span className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-lg transition peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan ${out ? "border-dashed border-line/60 bg-bg/20 opacity-45" : "border-line bg-bg/40 peer-checked:border-cyan peer-checked:bg-cyan/10 hover:border-[#5a52b8]"}`}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 font-display font-extrabold" aria-hidden="true">{out ? "✕" : LETTERS[i]}</span>
                  <span className={`font-medium ${out ? "line-through" : ""}`}>{opt}</span>
                  {out && <span className="sr-only"> (descartada por el 50/50)</span>}
                </span>
              </label>
            );
          })}
        </div>

        {shown.hint && (
          <p role="note" className="rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-[#ffe3a0]">💡 {shown.hint}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4" role="group" aria-label="Ayudas">
          <span className="mr-1 text-sm font-bold text-muted">Ayudas:</span>
          {q.hasHint && !shown.hint && (
            <button type="button" onClick={() => askAid("pista")} disabled={!pistaReady || aidPending || pending} className="btn btn-ghost btn-sm"
              title={pista.freeAvailable ? "La primera pista de cada misión es gratis cada día" : pistaCapped ? "Llegaste al máximo de pistas de hoy" : undefined}>
              💡 Pista · {pista.freeAvailable ? <strong className="text-gold">gratis</strong> : pistaCapped ? "tope de hoy" : `tienes ${pista.stock}`}
            </button>
          )}
          {removed.length > 0 ? (
            <span className="chip text-sm text-muted">🔮 50/50 usado</span>
          ) : !fifty.unlocked ? (
            <span className="chip text-sm text-muted" title={`El 50/50 se desbloquea en el rango ${fifty.minRank}`}>🔒 50/50 · rango {fifty.minRank}</span>
          ) : (
            <button type="button" onClick={() => askAid("5050")} disabled={!fiftyReady || aidPending || pending} className="btn btn-ghost btn-sm"
              title={fiftyCapped ? "Llegaste al máximo de 50/50 de hoy" : "Quita la mitad de las respuestas incorrectas"}>
              🔮 50/50 · {fiftyCapped ? "tope de hoy" : `tienes ${fifty.stock}`}
            </button>
          )}
          {aidPending && <span className="text-sm text-muted">Usando ayuda…</span>}
          {needShop && <Link href="/tienda?c=ayuda" className="text-sm font-semibold text-cyan underline-offset-4 hover:underline">Conseguir más en la tienda</Link>}
        </div>
        <p aria-live="polite" className="min-h-0 text-sm font-medium text-[#ffb3b3] empty:hidden">{aidMsg}</p>
      </fieldset>

      {outcome && !outcome.ok && (
        <p role="alert" className="rounded-xl border border-coral/50 bg-coral/10 px-4 py-3 font-medium text-[#ffb3b3]">{outcome.error}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button type="button" className="btn btn-ghost" onClick={() => go(idx - 1)} disabled={idx === 0 || pending}>← Anterior</button>
        {last ? (
          <button type="button" className="btn btn-primary btn-lg" onClick={send} disabled={answered < total || pending}>
            {pending ? "Calificando…" : answered < total ? `Faltan ${total - answered} por responder` : p.isBoss ? "¡Enfrentar al Guardián!" : "Terminar misión"}
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-lg" onClick={() => go(idx + 1)} disabled={chosen < 0 || pending}>Siguiente →</button>
        )}
      </div>
    </div>
  );
}
