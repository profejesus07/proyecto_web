"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { preload } from "react-dom";
import { activateAidAction, answerQuestionAction, submitMissionAction, type SubmitOutcome } from "@/app/actions/game";
import { Sprite, asset } from "@/components/sprite";
import { beatDuration, enemyFor, foeAnim, kuroAnim, sceneFor, type BeatKind } from "@/lib/game/battle";
import { PASS_MARK } from "@/lib/game/grading";
import { RANKS } from "@/lib/game/ranks";

export interface AnsweredQuestion {
  choice: number;
  correct: boolean;
  correctIndex: number;
  explanation: string;
}

export interface QuizProps {
  missionId: string;
  title: string;
  intro: string;
  isBoss: boolean;
  xpReward: number;
  courseSlug: string;
  courseTitle: string;
  element: string;
  guardian: { slug: string; name: string };
  questions: { id: string; prompt: string; options: string[]; hasHint: boolean }[];
  nextMissionId: string | null;
  aids: {
    pista: { stock: number; usedToday: number; cap: number; freeAvailable: boolean };
    fifty: { stock: number; usedToday: number; cap: number; unlocked: boolean; minRank: string };
  };
  /** Lo que ya se reveló hoy en esta misión, por id de pregunta. */
  revealed: Record<string, { hint?: string; removed?: number[] }>;
  /** Respuestas ya dadas en el intento abierto (para continuar donde quedó). */
  resume: (AnsweredQuestion | null)[];
  kuroStage: "cachorro" | "joven" | "majestuoso";
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const CHEERS = ["¡Golpe certero!", "¡Así se hace!", "¡Bien pensado!", "¡Directo al blanco!", "¡Brillante!", "¡Imparable!"];

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
  const firstOpen = () => {
    const i = p.resume.findIndex((r) => !r);
    return i === -1 ? total - 1 : i;
  };
  const [idx, setIdx] = useState(firstOpen);
  const [results, setResults] = useState<(AnsweredQuestion | null)[]>(() => p.questions.map((_, i) => p.resume[i] ?? null));
  const [selected, setSelected] = useState(-1);
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Si se vuelve a una pregunta ya respondida (continuar intento), la escena queda en su estado final.
  const [beat, setBeat] = useState<{ kind: BeatKind; n: number }>(() => {
    const r = p.resume[firstOpen()];
    return { kind: r ? (r.correct ? "hit" : "miss") : "enter", n: 0 };
  });
  const [phase, setPhase] = useState(() => (p.resume[firstOpen()] ? 1 : 0));
  const [revealed, setRevealed] = useState(p.revealed);
  const [pista, setPista] = useState(p.aids.pista);
  const [fifty, setFifty] = useState(p.aids.fifty);
  const [aidMsg, setAidMsg] = useState<string | null>(null);
  const [aidPending, startAid] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stageRef = useRef<HTMLElement>(null);

  const q = p.questions[idx];
  const res = results[idx];
  const answeredCount = results.filter(Boolean).length;
  const rightCount = results.filter((r) => r?.correct).length;
  const wrongCount = results.filter((r) => r && !r.correct).length;
  const shown = revealed[q.id] ?? {};
  const removed = shown.removed ?? [];

  // ----- Escena -----
  const enemy = enemyFor(idx, total);
  const prev = idx > 0 ? results[idx - 1] : null;
  const foe = foeAnim({ boss: p.isBoss, kind: beat.kind, phase, fury: !!prev && !prev.correct, firstEnter: idx === 0 && beat.n === 0 });
  const foeSrc = p.isBoss ? asset.boss(p.guardian.slug, foe) : asset.enemy(enemy.slug, foe);
  const kuroSrc = asset.kuro(kuroAnim(res), p.kuroStage);
  const scene = sceneFor(p.isBoss, p.element);
  const needed = Math.ceil((total * PASS_MARK) / 100);
  const hp = p.isBoss ? Math.max(0, needed - rightCount) / needed : 0;
  const stillPossible = total - wrongCount >= needed;

  // Avanza la animación (aparecer → reposo, golpe → derrota, etc.).
  useEffect(() => {
    const ms = beatDuration({ boss: p.isBoss, kind: beat.kind, firstEnter: idx === 0 && beat.n === 0 });
    if (!ms) return;
    const t = setTimeout(() => setPhase(1), ms);
    return () => clearTimeout(t);
  }, [beat, idx, p.isBoss]);

  // Precarga las animaciones que vienen para que no parpadeen.
  if (p.isBoss) for (const a of ["golpe", "furia-golpe", "transicion-furia", "furia-reposo", "reposo"]) preload(asset.boss(p.guardian.slug, a), { as: "image" });
  else for (const a of ["reposo", "recibir-golpe", "derrota", "burla"]) preload(asset.enemy(enemy.slug, a), { as: "image" });
  for (const a of ["celebrar", "animar"] as const) preload(asset.kuro(a, p.kuroStage), { as: "image" });

  function play(kind: BeatKind) {
    setBeat((b) => ({ kind, n: b.n + 1 }));
    setPhase(0);
  }

  function answer() {
    if (selected < 0 || res) return;
    const at = idx;
    setError(null);
    startTransition(async () => {
      const r = await answerQuestionAction(p.missionId, at, selected);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setResults((all) => all.map((x, i) => (i === at ? { choice: r.choice, correct: r.correct, correctIndex: r.correctIndex, explanation: r.explanation } : x)));
      play(r.correct ? "hit" : "miss");
      // Lleva la vista a la escena para ver la reacción; la explicación queda justo debajo.
      requestAnimationFrame(() => {
        stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        document.getElementById("feedback")?.focus({ preventScroll: true });
      });
    });
  }

  function next() {
    const to = results.findIndex((r, i) => !r && i > idx);
    const target = to === -1 ? results.findIndex((r) => !r) : to;
    if (target === -1) return;
    setIdx(target);
    setSelected(-1);
    setAidMsg(null);
    play("enter");
    requestAnimationFrame(() => {
      stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      headingRef.current?.focus({ preventScroll: true });
    });
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      const r = await submitMissionAction(p.missionId);
      if (r.ok) setOutcome(r);
      else setError(r.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function retry() {
    setOutcome(null);
    setResults(p.questions.map(() => null));
    setSelected(-1);
    setAidMsg(null);
    setIdx(0);
    setBeat({ kind: "enter", n: 0 });
    setPhase(0);
  }

  function askAid(kind: "pista" | "5050") {
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
        if (r.removed?.includes(selected)) setSelected(-1);
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

  // ===== Misión en curso =====
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <p className="eyebrow">{p.isBoss ? `Prueba de ${p.guardian.name}` : p.courseTitle}</p>
        <h1 className="text-2xl leading-tight sm:text-3xl">{p.title}</h1>
        {answeredCount === 0 && <p className="text-sm text-muted">{p.intro}</p>}
      </header>

      {/* Escena: Kuro a la izquierda, el enemigo o el Guardián a la derecha. */}
      <section ref={stageRef} aria-label={p.isBoss ? `Batalla contra ${p.guardian.name}` : "Mazmorra"} className="panel relative scroll-mt-20 isolate aspect-[4/3] overflow-hidden rounded-3xl sm:aspect-[16/9]">
        <Sprite src={asset.scene(scene.name, scene.state)} alt="" decorative priority className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-bg/70 to-transparent" />

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3 sm:inset-x-5 sm:top-4">
          {p.isBoss ? (
            <div className="w-full max-w-sm rounded-2xl bg-bg/75 px-4 py-2.5 backdrop-blur-sm">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold sm:text-sm">
                <span>Vida de {p.guardian.name}</span>
                <span className="text-muted">{hp === 0 ? "¡Listo para purificarlo!" : `Faltan ${Math.max(0, needed - rightCount)} aciertos`}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={`Vida de ${p.guardian.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hp * 100)}>
                <div className="h-full rounded-full bg-gradient-to-r from-coral to-gold transition-[width] duration-700 ease-out" style={{ width: `${hp * 100}%` }} />
              </div>
            </div>
          ) : (
            <span className="rounded-full bg-bg/75 px-3 py-1 text-xs font-bold backdrop-blur-sm sm:text-sm">{enemy.name} · {idx + 1} de {total}</span>
          )}
          <span className="hidden shrink-0 rounded-full bg-bg/75 px-3 py-1 text-xs font-bold backdrop-blur-sm sm:inline sm:text-sm">✔ {rightCount} · ✕ {wrongCount}</span>
        </div>

        <Sprite key={kuroSrc} src={kuroSrc} alt={res ? (res.correct ? "Kuro celebra" : "Kuro te anima") : "Kuro piensa contigo"} className="absolute bottom-[3%] left-[6%] h-[34%] w-auto sm:left-[18%]" />
        <Sprite key={`${foeSrc}-${beat.n}`} src={foeSrc} alt={p.isBoss ? p.guardian.name : enemy.name}
          className={`absolute bottom-[4%] w-auto ${p.isBoss ? "right-[2%] h-[66%] sm:right-[12%]" : "right-[8%] h-[40%] sm:right-[22%]"}`} />
      </section>

      {res && (
        <div id="feedback" tabIndex={-1} role="status" className={`space-y-3 rounded-2xl border px-5 py-4 outline-none ${res.correct ? "border-green/50 bg-green/10" : "border-gold/50 bg-gold/10"}`}>
          <p className="font-display text-xl font-bold">
            {res.correct
              ? p.isBoss ? `${CHEERS[idx % CHEERS.length]} ${p.guardian.name} pierde fuerza.` : `${CHEERS[idx % CHEERS.length]} El ${enemy.name} se desvanece en luz.`
              : p.isBoss ? `¡Uy! ${p.guardian.name} se crece un momento. Kuro te explica:` : "¡Uy, no era esa! Kuro te explica:"}
          </p>
          <p className={res.correct ? "text-muted" : "text-[#ffe3a0]"}>💡 {res.explanation}</p>
          {p.isBoss && !res.correct && !stillPossible && (
            <p className="text-sm text-muted">Esta vez no alcanzarás el {PASS_MARK}%, pero termina la prueba: cada respuesta te prepara para la revancha.</p>
          )}
          <div className="flex justify-end">
            {answeredCount < total ? (
              <button type="button" className="btn btn-primary btn-lg" onClick={next} disabled={pending}>
                {p.isBoss ? "Siguiente ataque →" : "Siguiente enemigo →"}
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-lg" onClick={finish} disabled={pending}>
                {pending ? "Calificando…" : p.isBoss ? "¡Purificar al Guardián!" : "Terminar misión"}
              </button>
            )}
          </div>
        </div>
      )}

      <ol className="flex gap-1.5" aria-label="Progreso">
        {results.map((r, i) => (
          <li key={i} className={`h-2.5 flex-1 rounded-full transition ${i === idx ? "ring-2 ring-cyan ring-offset-2 ring-offset-bg" : ""} ${r ? (r.correct ? "bg-green" : "bg-coral") : i === idx ? "bg-cyan" : "bg-white/15"}`}>
            <span className="sr-only">Pregunta {i + 1}: {r ? (r.correct ? "acertada" : "fallada") : i === idx ? "actual" : "pendiente"}</span>
          </li>
        ))}
      </ol>

      <fieldset className="panel space-y-5 p-5 sm:p-7" disabled={pending}>
        <legend className="text-sm font-semibold text-muted">Pregunta {idx + 1} de {total}</legend>
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl leading-snug outline-none sm:text-3xl">{q.prompt}</h2>
        <div className="grid gap-3" role="radiogroup" aria-label="Opciones">
          {q.options.map((opt, i) => {
            const out = !res && removed.includes(i);
            const isRight = res && i === res.correctIndex;
            const isWrongPick = res && i === res.choice && !res.correct;
            const tone = isRight
              ? "border-green bg-green/15"
              : isWrongPick
                ? "border-coral bg-coral/15"
                : res
                  ? "border-line bg-bg/30 opacity-60"
                  : out
                    ? "border-dashed border-line/60 bg-bg/20 opacity-45"
                    : "border-line bg-bg/40 peer-checked:border-cyan peer-checked:bg-cyan/10 hover:border-[#5a52b8]";
            return (
              <label key={i} className={res || out ? "cursor-default" : "cursor-pointer"} data-descartada={out || undefined} data-correcta={isRight || undefined}>
                <input type="radio" name={`q-${q.id}`} value={i} checked={(res ? res.choice : selected) === i} onChange={() => setSelected(i)} disabled={!!res || out} className="peer sr-only" />
                <span className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-lg transition peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan ${tone}`}>
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg font-display font-extrabold ${isRight ? "bg-green text-ink" : isWrongPick ? "bg-coral text-ink" : "bg-white/10"}`} aria-hidden="true">
                    {isRight ? "✓" : isWrongPick ? "✕" : out ? "✕" : LETTERS[i]}
                  </span>
                  <span className={`font-medium ${out ? "line-through" : ""}`}>{opt}</span>
                  {out && <span className="sr-only"> (descartada por el 50/50)</span>}
                  {isRight && <span className="sr-only"> (respuesta correcta)</span>}
                  {isWrongPick && <span className="sr-only"> (tu respuesta)</span>}
                </span>
              </label>
            );
          })}
        </div>

        {!res && (
          <>
            {shown.hint && <p role="note" className="rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-[#ffe3a0]">💡 {shown.hint}</p>}
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
            <p aria-live="polite" className="text-sm font-medium text-[#ffb3b3] empty:hidden">{aidMsg}</p>
          </>
        )}
      </fieldset>

      {error && <p role="alert" className="rounded-xl border border-coral/50 bg-coral/10 px-4 py-3 font-medium text-[#ffb3b3]">{error}</p>}

      {!res && (
        <div className="flex items-center justify-end gap-3">
          <button type="button" className="btn btn-primary btn-lg" onClick={answer} disabled={selected < 0 || pending}>
            {pending ? "Revisando…" : selected < 0 ? "Elige una respuesta" : p.isBoss ? "¡Lanzar ataque!" : "Responder"}
          </button>
        </div>
      )}
    </div>
  );
}
