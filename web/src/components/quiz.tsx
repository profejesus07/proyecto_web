"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { preload } from "react-dom";
import { activateAidAction, answerQuestionAction, submitMissionAction, activatePowerAction, type SubmitOutcome } from "@/app/actions/game";
import { SpeechBubble } from "@/components/dialogue";
import { SceneTheme, SpeakButton } from "@/components/sound";
import { guardianBySlug } from "@/content/guardians";
import { sfx } from "@/lib/audio/music";
import { speak } from "@/lib/audio/voices";
import { Sprite, asset } from "@/components/sprite";
import { beatDuration, enemyFor, foeAnim, kuroAnim, sceneFor, type BeatKind } from "@/lib/game/battle";
import { PASS_MARK } from "@/lib/game/grading";
import { duel, kaelScore } from "@/lib/game/kael";
import { POWERS, stemOf, type PowerKind } from "@/lib/game/powers";
import { RANKS } from "@/lib/game/ranks";
import { isChoiceKind, type ActivityKind, type ActivityResponse, type Solution } from "@/lib/activities";

export interface AnsweredQuestion {
  choice: number;
  correct: boolean;
  correctIndex: number;
  explanation: string;
  /** Solución de las actividades que no son de opciones. */
  solution?: Solution;
  /** Lo que respondió (solo en esta sesión, para mostrárselo). */
  response?: ActivityResponse;
}

/** Solución de una actividad que no es de opciones, para el repaso y la retroalimentación. */
function SolutionView({ kind, solution }: { kind: ActivityKind; solution?: Solution }) {
  if (solution === undefined) return null;
  if (kind === "completar") return <p className="text-sm"><span className="text-green">Respuesta correcta: </span><strong>{String(solution)}</strong></p>;
  if (kind === "ordenar" && Array.isArray(solution)) {
    return (
      <div className="text-sm"><span className="text-green">Orden correcto:</span>
        <ol className="mt-1 list-decimal space-y-0.5 pl-6">{solution.map((x) => <li key={x}>{x}</li>)}</ol>
      </div>
    );
  }
  if (kind === "relacionar" && typeof solution === "object" && !Array.isArray(solution)) {
    return (
      <div className="text-sm"><span className="text-green">Parejas correctas:</span>
        <ul className="mt-1 space-y-0.5 pl-6">{solution.left.map((l, i) => <li key={l}><strong>{l}</strong> → {solution.right[i]}</li>)}</ul>
      </div>
    );
  }
  return null;
}

/** Respuesta del estudiante en ordenar/relacionar/completar, en texto. */
function responseText(kind: ActivityKind, r: ActivityResponse | undefined, left: string[]): string | null {
  if (r === undefined) return null;
  if (kind === "completar") return String(r);
  if (kind === "ordenar" && Array.isArray(r)) return r.join(" → ");
  if (kind === "relacionar" && Array.isArray(r)) return r.map((x, i) => `${left[i]} → ${x || "—"}`).join(" · ");
  return null;
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
  questions: { id: string; prompt: string; kind: ActivityKind; options: string[]; right?: string[]; hasHint: boolean }[];
  nextMissionId: string | null;
  /** Si la siguiente misión necesita suscripción: a dónde ir para desbloquear el curso. */
  subscribe: { href: string; price: string } | null;
  /** En un curso corto: dónde solicitar la constancia al terminarlo. */
  certificateHref: string | null;
  aids: {
    pista: { stock: number; usedToday: number; cap: number; freeAvailable: boolean };
    fifty: { stock: number; usedToday: number; cap: number; unlocked: boolean; minRank: string };
  };
  /** Lo que ya se reveló hoy en esta misión, por id de pregunta. */
  revealed: Record<string, { hint?: string; removed?: number[] }>;
  /** Respuestas ya dadas en el intento abierto (para continuar donde quedó). */
  resume: (AnsweredQuestion | null)[];
  /** Poderes del estudiante: unidades (o 1 si es de rango S y lo tiene), usos de hoy y si su rango alcanza. */
  powers: { kind: PowerKind; have: number; usedToday: number; cap: number; unlocked: boolean }[];
  /** Lo que los poderes ya hicieron hoy en esta misión, por id de pregunta. */
  powerState: Record<string, QuizPowerState>;
  /** Pistas recuperadas con el Pulso de Memoria, por id de pregunta. */
  memory: Record<string, string>;
  kuroStage: "cachorro" | "joven" | "majestuoso";
}

export interface QuizPowerState {
  rayo?: { stems: string[]; lead: string | null };
  kuro?: { hint: string | null; removed: number[] };
  sombra?: number;
  escudo?: boolean;
  lluvia?: boolean;
}

/** Kuro dice la pista con su voz (si el navegador sabe hablar y las voces están activadas). */
function kuroSays(text: string) {
  void speak(text, "Kuro", "kuro-pista");
}

/** Confeti de victoria (piezas fijas para que no cambie entre renders). */
function Confetti() {
  const colors = ["#2ee6d6", "#8a5cff", "#ffc83d", "#ff6b6b", "#4ade80"];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <i key={i} style={{
          left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 9) * 0.08}s`,
          ["--dx" as string]: `${((i * 53) % 120) - 60}px`, ["--rot" as string]: `${(i * 97) % 720}deg`,
        }} />
      ))}
    </div>
  );
}

/** Pregunta con las palabras del Rayo de Claridad resaltadas. */
function Highlighted({ text, stems }: { text: string; stems: string[] }) {
  if (!stems.length) return <>{text}</>;
  const set = new Set(stems);
  return (
    <>
      {text.split(/(\s+)/).map((w, i) => (set.has(stemOf(w)) && stemOf(w).length >= 4
        ? <mark key={i} className="rounded bg-cyan/25 px-0.5 text-inherit">{w}</mark>
        : <span key={i}>{w}</span>))}
    </>
  );
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
        <circle cx="60" cy="60" r={r} fill="none" stroke={passed ? "var(--green)" : "var(--warn)"} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
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
  // Respuesta en curso de las actividades que no son de opciones (por id de pregunta).
  const [text, setText] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<Record<string, string[]>>({});
  const [pairs, setPairs] = useState<Record<string, string[]>>({});
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
  const [powers, setPowers] = useState(p.powers);
  const [pstate, setPstate] = useState(p.powerState);
  const [memory, setMemory] = useState(p.memory);
  const [powerMsg, setPowerMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [fx, setFx] = useState<{ src: string; n: number } | null>(null);
  const [bonus, setBonus] = useState<number | null>(null);
  const [aidPending, startAid] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stageRef = useRef<HTMLElement>(null);

  const q = p.questions[idx];
  const res = results[idx];
  const choiceKind = isChoiceKind(q.kind);
  const curOrder = order[q.id] ?? q.options;
  const curPairs = pairs[q.id] ?? q.options.map(() => "");
  const curText = text[q.id] ?? "";
  const ready = choiceKind ? selected >= 0 : q.kind === "completar" ? curText.trim() !== "" : q.kind === "ordenar" ? true : curPairs.every(Boolean);
  const response: ActivityResponse = choiceKind ? selected : q.kind === "completar" ? curText.trim() : q.kind === "ordenar" ? curOrder : curPairs;
  const answeredCount = results.filter(Boolean).length;
  const rightCount = results.filter((r) => r?.correct).length;
  const wrongCount = results.filter((r) => r && !r.correct).length;
  const shown = revealed[q.id] ?? {};
  const ps = pstate[q.id] ?? {};
  const removed = [...new Set([...(shown.removed ?? []), ...(ps.kuro?.removed ?? [])])];
  const hintText = shown.hint ?? ps.kuro?.hint ?? memory[q.id];

  // ----- Escena -----
  const enemy = enemyFor(idx, total);
  const prev = idx > 0 ? results[idx - 1] : null;
  const foe = foeAnim({ boss: p.isBoss, kind: beat.kind, phase, fury: !!prev && !prev.correct, firstEnter: idx === 0 && beat.n === 0, enemy });
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

  // El efecto del poder se ve un momento sobre la escena.
  useEffect(() => {
    if (!fx) return;
    const t = setTimeout(() => setFx(null), 1800);
    return () => clearTimeout(t);
  }, [fx]);

  // Precarga las animaciones que vienen para que no parpadeen.
  if (p.isBoss) for (const a of ["golpe", "furia-golpe", "transicion-furia", "furia-reposo", "reposo"]) preload(asset.boss(p.guardian.slug, a), { as: "image" });
  else for (const a of ["reposo", "recibir-golpe", "derrota", "burla", `especial-${enemy.special}`]) preload(asset.enemy(enemy.slug, a), { as: "image" });
  for (const a of ["celebrar", "animar"] as const) preload(asset.kuro(a, p.kuroStage), { as: "image" });

  function play(kind: BeatKind) {
    setBeat((b) => ({ kind, n: b.n + 1 }));
    setPhase(0);
  }

  function answer() {
    if (!ready || res) return;
    const at = idx;
    const sent = response;
    setError(null);
    startTransition(async () => {
      const r = await answerQuestionAction(p.missionId, at, sent);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      if (r.shielded) {
        sfx("poder");
        // El Escudo de Calma paró el error: la respuesta no quedó fija; se puede volver a intentar.
        setPstate((all) => ({ ...all, [p.questions[at].id]: { ...all[p.questions[at].id], escudo: false } }));
        setFx({ src: POWERS.escudo.fx, n: Date.now() });
        setPowerMsg({ ok: true, text: "🛡️ ¡El Escudo de Calma te protegió! Esa no era: piénsalo otra vez." });
        setSelected(-1);
        play("miss");
        return;
      }
      if (r.bonusXp) {
        setBonus(r.bonusXp);
        setFx({ src: POWERS.lluvia.fx, n: Date.now() });
      }
      setPstate((all) => ({ ...all, [p.questions[at].id]: { ...all[p.questions[at].id], lluvia: false } }));
      setResults((all) => all.map((x, i) => (i === at ? { choice: r.choice, correct: r.correct, correctIndex: r.correctIndex, explanation: r.explanation, solution: r.solution, response: sent } : x)));
      play(r.correct ? "hit" : "miss");
      sfx(r.correct ? "acierto" : "error");
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
    setPowerMsg(null);
    setBonus(null);
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
      if (r.ok) {
        setOutcome(r);
        if (r.newRanks.length) sfx("rango");
        else if (r.result.passed) sfx("victoria");
      }
      else setError(r.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function retry() {
    setOutcome(null);
    setResults(p.questions.map(() => null));
    setSelected(-1);
    setText({});
    setOrder({});
    setPairs({});
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

  function activatePower(kind: PowerKind) {
    const at = idx;
    const qid = q.id;
    setPowerMsg(null);
    startAid(async () => {
      const r = await activatePowerAction(p.missionId, at, kind);
      if (!r.ok) {
        setPowerMsg({ ok: false, text: r.error });
        return;
      }
      const rule = POWERS[kind];
      sfx("poder");
      setFx({ src: rule.fx, n: Date.now() });
      if (r.charged) setPowers((all) => all.map((x) => (x.kind === kind ? { ...x, have: rule.permanent ? x.have : r.left, usedToday: x.usedToday + 1 } : x)));
      const patch = (st: QuizPowerState) => setPstate((all) => ({ ...all, [qid]: { ...all[qid], ...st } }));
      switch (kind) {
        case "rayo":
          patch({ rayo: { stems: r.stems ?? [], lead: r.lead ?? null } });
          setPowerMsg({ ok: true, text: r.stems?.length ? "⚡ El Rayo de Claridad ilumina las palabras clave de la pregunta." : `⚡ El Rayo de Claridad te susurra: «${r.lead ?? ""}»` });
          break;
        case "escudo":
          patch({ escudo: true });
          setPowerMsg({ ok: true, text: "🛡️ Escudo de Calma activo: si fallas esta pregunta, podrás intentarlo otra vez." });
          break;
        case "lluvia":
          patch({ lluvia: true });
          setPowerMsg({ ok: true, text: "🌠 Lluvia de Estrellas lista: si aciertas, ganas 15 XP extra." });
          break;
        case "kuro":
          patch({ kuro: { hint: r.hint ?? null, removed: r.removed ?? [] } });
          if (r.removed?.includes(selected)) setSelected(-1);
          if (r.hint) kuroSays(r.hint);
          setPowerMsg({ ok: true, text: r.removed?.length ? "🐾 ¡Kuro acude a tu llamada! Te dice la pista y descarta una opción." : "🐾 ¡Kuro acude a tu llamada y te dice la pista!" });
          break;
        case "pulso":
          setMemory((m) => ({ ...m, ...(r.hints ?? {}) }));
          setPowerMsg({ ok: true, text: `💫 El Pulso de Memoria recupera ${Object.keys(r.hints ?? {}).length} ${Object.keys(r.hints ?? {}).length === 1 ? "pista" : "pistas"} que ya habías visto.` });
          break;
        case "sombra":
          if (r.choice !== undefined) patch({ sombra: r.choice });
          setPowerMsg({ ok: true, text: "👤 Tu Sombra Dorada recuerda la respuesta que elegiste la última vez." });
          break;
        case "aura":
          setPowerMsg(null);
          next();
          setPowerMsg({ ok: true, text: "🌀 Aura de Concentración: esa pregunta te espera al final. Piénsala con calma." });
          break;
        case "aliento":
          setResults((all) => all.map((x, i) => (i === at ? null : x)));
          setSelected(-1);
          setPowerMsg({ ok: true, text: "💖 ¡Segundo Aliento! Puedes responder esta pregunta otra vez." });
          play("enter");
          break;
      }
    });
  }

  const powerOf = (kind: PowerKind) => powers.find((x) => x.kind === kind);
  const canUse = (kind: PowerKind) => {
    const x = powerOf(kind);
    return !!x && x.unlocked && x.have > 0 && x.usedToday < x.cap;
  };
  const otherOpen = results.some((r, i) => !r && i !== idx);
  // Poderes que se ofrecen antes de responder (el Segundo Aliento aparece al fallar).
  const prePowers = powers.filter((x) => x.kind !== "aliento" && x.have > 0 && x.unlocked
    && !(x.kind === "rayo" && (!q.hasHint || ps.rayo)) && !(x.kind === "escudo" && ps.escudo) && !(x.kind === "lluvia" && ps.lluvia)
    && !(x.kind === "kuro" && ps.kuro) && !(x.kind === "sombra" && (ps.sombra !== undefined || !isChoiceKind(q.kind))) && !(x.kind === "aura" && !otherOpen)
    && !(x.kind === "pulso" && Object.keys(memory).length > 0));

  const pistaCapped = pista.usedToday >= pista.cap;
  const pistaReady = pista.freeAvailable || (pista.stock > 0 && !pistaCapped);
  const fiftyCapped = fifty.usedToday >= fifty.cap;
  const fiftyReady = fifty.unlocked && fifty.stock > 0 && !fiftyCapped;
  const needShop = (q.hasHint && !shown.hint && !pista.freeAvailable && pista.stock === 0) || (q.kind === "opcion" && fifty.unlocked && removed.length === 0 && fifty.stock === 0);

  // ===== Resultado =====
  if (outcome?.ok) {
    const { result, review, newRanks, items } = outcome;
    const win = result.passed;
    const duelOutcome = duel(result.score, p.missionId);
    const bossWin = p.isBoss && win;
    return (
      <div className="space-y-6" aria-live="polite">
        <section className="panel panel-glow relative isolate overflow-hidden rounded-3xl text-center">
          {win && <Confetti />}
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

            {bossWin && guardianBySlug(p.guardian.slug) && (
              <div className="w-full max-w-xl text-left">
                <SpeechBubble name={p.guardian.name} src={asset.boss(p.guardian.slug, "purificado")} alt={`${p.guardian.name} purificado`} tone="gold" auto>
                  {guardianBySlug(p.guardian.slug)!.thanks}
                </SpeechBubble>
              </div>
            )}
            <div className="w-full max-w-xl text-left">
              <SpeechBubble name="Kael" src={`/assets/personajes/kael/kael-${duelOutcome === "gana" ? "derrota" : duelOutcome === "empata" ? "dar-la-mano" : "retar"}.svg`} alt="Kael, tu rival" tone="coral">
                {duelOutcome === "gana"
                  ? `¡Me ganaste! Tu ${result.score}% supera mi ${kaelScore(p.missionId)}%. Buen duelo.`
                  : duelOutcome === "empata"
                    ? `Empate: los dos sacamos ${result.score}%. Choca esos cinco.`
                    : `Esta vez gané yo: ${kaelScore(p.missionId)}% contra tu ${result.score}%. ¡Te espero en la revancha!`}
              </SpeechBubble>
            </div>

            {result.first && (
              <ul className="pop flex flex-wrap justify-center gap-2" aria-label="Recompensas">
                {result.xpGain > 0 && <li className="chip !border-violet/60 !bg-violet/20 text-base">✨ +{result.xpGain} XP</li>}
                {result.coinsGain > 0 && <li className="chip !border-gold/60 !bg-gold/15 text-base">🪙 +{result.coinsGain}</li>}
                {result.gemsGain > 0 && <li className="chip !border-cyan/60 !bg-cyan/15 text-base">💎 +{result.gemsGain}</li>}
              </ul>
            )}
            {newRanks.length > 0 && (
              <p className="rounded-xl border border-gold/60 bg-gold/15 px-5 py-3 text-lg font-bold text-warn">
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
            {win && p.subscribe && (
              <p className="max-w-lg rounded-xl border border-cyan/50 bg-cyan/10 px-5 py-3 text-text">
                ¡Superaste la lección gratis! Para seguir con las demás misiones y enfrentar a {p.guardian.name}, suscríbete al curso ({p.subscribe.price}).
              </p>
            )}
            {result.courseDone && p.certificateHref && (
              <Link href={p.certificateHref} className="btn btn-primary btn-lg">🎓 Solicitar mi constancia de asistencia</Link>
            )}
            {outcome.chronicles.length > 0 && (
              <div className="w-full max-w-xl pt-2 text-left">
                <SpeechBubble name="Archivista Eon" src={asset.eon("cronica")} alt="El Archivista Eon con su libro" tone="violet">
                  {outcome.chronicles.length === 1 ? "¡Se abrió un capítulo nuevo de las Crónicas!" : "¡Se abrieron capítulos nuevos de las Crónicas!"}
                  <span className="mt-2 flex flex-wrap gap-2">
                    {outcome.chronicles.map((c) => (
                      <Link key={c.id} href={`/cronicas/${c.id}`} className="btn btn-secondary btn-sm">📜 {c.title}</Link>
                    ))}
                  </span>
                </SpeechBubble>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {win && p.nextMissionId && !p.subscribe && <Link href={`/mision/${p.nextMissionId}`} className="btn btn-primary btn-lg">Siguiente misión</Link>}
              {win && p.subscribe && <Link href={p.subscribe.href} className="btn btn-primary btn-lg">🔑 Desbloquear el curso</Link>}
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
                  {isChoiceKind(qq.kind) ? (
                    <>
                      {!r.correct && <p className="pl-9 text-sm text-muted">Tu respuesta: {r.chosen >= 0 ? qq.options[r.chosen] : "sin responder"}</p>}
                      <p className="pl-9 text-sm"><span className="text-green">Respuesta correcta: </span><strong>{qq.options[r.correctIndex]}</strong></p>
                    </>
                  ) : (
                    <div className="pl-9">
                      {!r.correct && responseText(qq.kind, results[i]?.response, qq.options) && <p className="text-sm text-muted">Tu respuesta: {responseText(qq.kind, results[i]?.response, qq.options)}</p>}
                      <SolutionView kind={qq.kind} solution={r.solution} />
                    </div>
                  )}
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
  const g = guardianBySlug(p.guardian.slug);
  return (
    <div className="space-y-5">
      {p.isBoss && <SceneTheme theme="jefe" />}
      <header className="space-y-1">
        <p className="eyebrow">{p.isBoss ? `Prueba de ${p.guardian.name}` : p.courseTitle}</p>
        <h1 className="text-2xl leading-tight sm:text-3xl">{p.title}</h1>
      </header>

      {answeredCount === 0 && (
        <SpeechBubble name="Maestra Sora" src={asset.sora(p.isBoss ? "alerta" : "hablar")} alt="La Maestra Sora" tone={p.isBoss ? "coral" : "cyan"} auto={!p.isBoss}>
          <p>{p.intro}</p>
          <p className="mt-1.5 text-sm text-muted">
            {p.isBoss
              ? `Necesitas ${needed} aciertos de ${total} para purificarlo. Si te equivocas, no pasa nada: Kuro te explica y sigues.`
              : `${total} enemigos custodian esta sala. Elige tu respuesta y pulsa «Responder»; si fallas, Kuro te cuenta por qué.`}
          </p>
        </SpeechBubble>
      )}
      {answeredCount === 0 && p.isBoss && g && (
        <SpeechBubble name={g.name} src={asset.boss(g.slug, "reposo")} alt={g.name} tone="coral" auto>
          {g.taunt}
        </SpeechBubble>
      )}
      {answeredCount === 0 && (
        <SpeechBubble name="Kael" src="/assets/personajes/kael/kael-retar.svg" alt="Kael, tu rival" tone="coral" className="max-w-xl">
          Yo saqué <strong>{kaelScore(p.missionId)}%</strong> en esta misión. ¿Me superas?
        </SpeechBubble>
      )}

      {/* Escena: Kuro a la izquierda, el enemigo o el Guardián a la derecha. */}
      <section ref={stageRef} key={`stage-${beat.kind === "miss" ? beat.n : "x"}`} aria-label={p.isBoss ? `Batalla contra ${p.guardian.name}` : "Mazmorra"}
        className={`panel relative scroll-mt-20 isolate aspect-[4/3] overflow-hidden rounded-3xl sm:aspect-[16/9] ${beat.kind === "miss" && beat.n > 0 ? "shake" : ""}`}>
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
                <div className="h-full rounded-full bg-coral transition-[width] duration-700 ease-out" style={{ width: `${hp * 100}%` }} />
              </div>
            </div>
          ) : (
            <span className="rounded-full bg-bg/75 px-3 py-1 text-xs font-bold backdrop-blur-sm sm:text-sm">{enemy.name} · {idx + 1} de {total}</span>
          )}
          <span className="hidden shrink-0 rounded-full bg-bg/75 px-3 py-1 text-xs font-bold backdrop-blur-sm sm:inline sm:text-sm">✔ {rightCount} · ✕ {wrongCount}</span>
        </div>

        <Sprite key={kuroSrc} src={kuroSrc} alt={res ? (res.correct ? "Kuro celebra" : "Kuro te anima") : "Kuro piensa contigo"} className="absolute bottom-[3%] left-[6%] h-[34%] w-auto sm:left-[18%]" />
        <Sprite key={`${foeSrc}-${beat.n}`} src={foeSrc} alt={p.isBoss ? p.guardian.name : enemy.name}
          className={`absolute bottom-[4%] w-auto ${beat.kind === "hit" && phase === 0 ? "hit-flash" : ""} ${p.isBoss ? "right-[2%] h-[66%] sm:right-[12%]" : "right-[8%] h-[40%] sm:right-[22%]"}`} />
        {res && beat.kind === "hit" && (
          <span key={`xp-${beat.n}`} aria-hidden="true" className="float-up absolute right-[22%] top-[28%] font-display text-2xl font-extrabold text-gold drop-shadow">
            {p.isBoss ? "¡Golpe!" : "+1"}
          </span>
        )}
        {fx && <Sprite key={fx.n} src={fx.src} alt="" decorative priority className="pointer-events-none absolute inset-0 m-auto h-full w-auto animate-[fadein_.2s_ease-out]" />}
        {(ps.escudo || ps.lluvia) && !res && (
          <span className="absolute bottom-3 left-3 flex gap-1.5">
            {ps.escudo && <span className="rounded-full bg-bg/80 px-2.5 py-1 text-xs font-bold text-cyan backdrop-blur-sm">🛡️ Escudo activo</span>}
            {ps.lluvia && <span className="rounded-full bg-bg/80 px-2.5 py-1 text-xs font-bold text-cyan backdrop-blur-sm">🌠 Lluvia activa</span>}
          </span>
        )}
      </section>

      {res && (
        <div id="feedback" data-bubble tabIndex={-1} role="status" className={`pop space-y-3 rounded-2xl border px-5 py-4 outline-none ${res.correct ? "border-green/50 bg-green/10" : "border-warn/50 bg-warn/10"}`}>
          <div className="flex justify-end">
            <SpeakButton name="Kuro" auto key={`${q.id}-${res.correct}`}
              text={`${res.correct ? CHEERS[idx % CHEERS.length] : "No era esa, pero tranquilo."}\n${res.explanation}`} />
          </div>
          <p className="font-display text-xl font-bold">
            {res.correct
              ? p.isBoss ? `${CHEERS[idx % CHEERS.length]} ${p.guardian.name} pierde fuerza.` : `${CHEERS[idx % CHEERS.length]} El ${enemy.name} se desvanece en luz.`
              : p.isBoss ? `¡Uy! ${p.guardian.name} se crece un momento. Kuro te explica:` : "¡Uy, no era esa! Kuro te explica:"}
          </p>
          <p className={res.correct ? "text-muted" : "text-warn"}>💡 {res.explanation}</p>
          {!choiceKind && !res.correct && <SolutionView kind={q.kind} solution={res.solution} />}
          {bonus && res.correct && <p className="font-bold text-gold">🌠 ¡La Lluvia de Estrellas te da +{bonus} XP!</p>}
          {!res.correct && canUse("aliento") && (
            <button type="button" onClick={() => activatePower("aliento")} disabled={aidPending || pending} className="btn btn-secondary btn-sm">
              {POWERS.aliento.icon} Segundo Aliento · responder otra vez
            </button>
          )}
          {powerMsg && <p className={`text-sm font-medium ${powerMsg.ok ? "text-cyan" : "text-err"}`}>{powerMsg.text}</p>}
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
        {/* La pregunta se lee, no es un título: Lexend (fluidez lectora), no Unbounded. */}
        <h2 ref={headingRef} tabIndex={-1} className="font-sans text-2xl font-semibold leading-snug tracking-normal outline-none sm:text-3xl">
          {!res && ps.rayo ? <Highlighted text={q.prompt} stems={ps.rayo.stems} /> : q.prompt}
        </h2>
        {!choiceKind ? (
          <ActivityInput kind={q.kind} qid={q.id} options={q.options} right={q.right ?? []} answered={res}
            text={curText} onText={(v) => setText((all) => ({ ...all, [q.id]: v }))}
            order={curOrder} onOrder={(v) => setOrder((all) => ({ ...all, [q.id]: v }))}
            pairs={curPairs} onPairs={(v) => setPairs((all) => ({ ...all, [q.id]: v }))} onSubmit={answer} />
        ) : (
        <div className="grid gap-3" role="radiogroup" aria-label="Opciones">
          {q.options.map((opt, i) => {
            const out = !res && removed.includes(i);
            const shadow = !res && ps.sombra === i;
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
                    : "border-line bg-bg/40 peer-checked:border-cyan peer-checked:bg-cyan/10 hover:border-line-fuerte";
            return (
              <label key={i} className={res || out ? "cursor-default" : "cursor-pointer"} data-descartada={out || undefined} data-correcta={isRight || undefined}>
                <input type="radio" name={`q-${q.id}`} value={i} checked={(res ? res.choice : selected) === i} onChange={() => setSelected(i)} disabled={!!res || out} className="peer sr-only" />
                <span className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-lg transition peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan ${tone}`}>
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg font-display font-extrabold ${isRight ? "bg-green text-ink" : isWrongPick ? "bg-coral text-ink" : "bg-white/10"}`} aria-hidden="true">
                    {isRight ? "✓" : isWrongPick ? "✕" : out ? "✕" : LETTERS[i]}
                  </span>
                  <span className={`font-medium ${out ? "line-through" : ""}`}>{opt}</span>
                  {shadow && <span className="ml-auto shrink-0 rounded-md bg-cyan/15 px-2 py-0.5 text-xs font-bold text-cyan">👤 Tu sombra eligió esta</span>}
                  {out && <span className="sr-only"> (descartada por el 50/50)</span>}
                  {isRight && <span className="sr-only"> (respuesta correcta)</span>}
                  {isWrongPick && <span className="sr-only"> (tu respuesta)</span>}
                </span>
              </label>
            );
          })}
        </div>
        )}

        {!res && (
          <>
            {hintText && <p role="note" className="rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-3 text-text">{ps.kuro?.hint && !shown.hint ? "🐾" : memory[q.id] && !shown.hint ? "💫" : "💡"} {hintText}</p>}
            {ps.rayo?.lead && <p role="note" className="rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-3 text-sm">⚡ Fíjate en esto: «{ps.rayo.lead}»</p>}
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4" role="group" aria-label="Ayudas">
              <span className="mr-1 text-sm font-bold text-muted">Ayudas:</span>
              {q.hasHint && !hintText && (
                <button type="button" onClick={() => askAid("pista")} disabled={!pistaReady || aidPending || pending} className="btn btn-ghost btn-sm"
                  title={pista.freeAvailable ? "La primera pista de cada misión es gratis cada día" : pistaCapped ? "Llegaste al máximo de pistas de hoy" : undefined}>
                  💡 Pista · {pista.freeAvailable ? <strong className="text-cyan">gratis</strong> : pistaCapped ? "tope de hoy" : `tienes ${pista.stock}`}
                </button>
              )}
              {q.kind !== "opcion" ? null : removed.length > 0 ? (
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
            <p aria-live="polite" className="text-sm font-medium text-err empty:hidden">{aidMsg}</p>
            {prePowers.length > 0 && (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Poderes">
                <span className="mr-1 text-sm font-bold text-muted">Poderes:</span>
                {prePowers.map((x) => {
                  const rule = POWERS[x.kind];
                  const capped = x.usedToday >= x.cap;
                  return (
                    <button key={x.kind} type="button" onClick={() => activatePower(x.kind)} disabled={capped || aidPending || pending} title={rule.effect}
                      className="btn btn-ghost btn-sm !border-violet/50">
                      {rule.icon} {rule.name}{rule.permanent ? "" : ` · ${x.have}`}{capped ? " · tope de hoy" : ""}
                    </button>
                  );
                })}
              </div>
            )}
            <p aria-live="polite" className={`text-sm font-medium empty:hidden ${powerMsg?.ok ? "text-cyan" : "text-err"}`}>{powerMsg?.text}</p>
          </>
        )}
      </fieldset>

      {error && <p role="alert" className="rounded-xl border border-coral/50 bg-coral/10 px-4 py-3 font-medium text-err">{error}</p>}

      {!res && (
        <div className="flex items-center justify-end gap-3">
          <button type="button" className="btn btn-primary btn-lg" onClick={answer} disabled={!ready || pending}>
            {pending ? "Revisando…" : !ready ? (q.kind === "completar" ? "Escribe tu respuesta" : q.kind === "relacionar" ? "Completa las parejas" : "Elige una respuesta") : p.isBoss ? "¡Lanzar ataque!" : "Responder"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Entrada de las actividades que no son de opciones: completar, ordenar y relacionar. */
function ActivityInput(p: {
  kind: ActivityKind; qid: string; options: string[]; right: string[]; answered: AnsweredQuestion | null;
  text: string; onText: (v: string) => void; order: string[]; onOrder: (v: string[]) => void; pairs: string[]; onPairs: (v: string[]) => void; onSubmit: () => void;
}) {
  const done = !!p.answered;
  const tone = done ? (p.answered!.correct ? "border-green bg-green/10" : "border-coral bg-coral/10") : "border-line bg-bg/40";
  if (p.kind === "completar") {
    const id = `resp-${p.qid}`;
    const shown = done ? String(p.answered!.response ?? "") : p.text;
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="label">Tu respuesta</label>
        <input id={id} value={shown} onChange={(e) => p.onText(e.target.value)} disabled={done} maxLength={200} autoComplete="off"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); p.onSubmit(); } }}
          className={`input !rounded-2xl border-2 !p-4 text-lg ${tone}`} placeholder="Escribe aquí" />
        <p className="hint">No importan las mayúsculas ni las tildes.</p>
      </div>
    );
  }
  if (p.kind === "ordenar") {
    const list = done && Array.isArray(p.answered!.response) ? (p.answered!.response as string[]) : p.order;
    const move = (i: number, d: -1 | 1) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      p.onOrder(next);
    };
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">Ordena los pasos con las flechas, del primero al último.</p>
        <ol className="space-y-2" aria-label="Pasos para ordenar">
          {list.map((x, i) => (
            <li key={x} className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-lg ${tone}`}>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 font-display font-extrabold" aria-hidden="true">{i + 1}</span>
              <span className="flex-1 font-medium">{x}</span>
              {!done && (
                <span className="flex gap-1">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Subir «${x}»`}>↑</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label={`Bajar «${x}»`}>↓</button>
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  }
  // relacionar
  const chosen = done && Array.isArray(p.answered!.response) ? (p.answered!.response as string[]) : p.pairs;
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">Elige la pareja de cada elemento.</p>
      <ul className="space-y-2">
        {p.options.map((l, i) => {
          const id = `par-${p.qid}-${i}`;
          return (
            <li key={l} className={`grid items-center gap-2 rounded-2xl border-2 p-3 sm:grid-cols-[1fr_auto_1fr] ${tone}`}>
              <label htmlFor={id} className="text-lg font-medium">{l}</label>
              <span aria-hidden="true" className="hidden text-muted sm:block">→</span>
              <select id={id} value={chosen[i] ?? ""} disabled={done} className="input"
                onChange={(e) => p.onPairs(p.pairs.map((x, k) => (k === i ? e.target.value : x)))}>
                <option value="">Elige…</option>
                {p.right.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
