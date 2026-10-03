import seed from "@/content/primer-portal.json";
import { todayBogota } from "@/lib/game/aids";
import { rankForXp } from "@/lib/game/ranks";
import type {
  AidUseRow, AnswerKeyRow, AvatarBase, CompleteResult, Course, CourseDetail, InventoryRow, MissionPlay, MissionSummary,
  Profile, ProgressRow, Repo,
} from "./types";

/**
 * Repositorio en memoria SOLO para la vista previa local (UMBRAL_PREVIEW=1).
 * Replica de forma sencilla las reglas de supabase/migrations/0003_game_functions.sql;
 * las reglas reales están probadas contra esa base de datos en tests/game.test.ts.
 */
export const PREVIEW_USER_ID = "00000000-0000-0000-0000-00000000aaaa";

interface State {
  profile: Profile;
  progress: Map<string, ProgressRow>;
  bosses: Set<string>;
  inventory: InventoryRow[];
  consumables: Map<string, number>;
  aidUses: (AidUseRow & { day: string })[];
}

const g = globalThis as unknown as { __umbralPreview?: State };

function state(): State {
  if (!g.__umbralPreview) {
    g.__umbralPreview = {
      profile: { id: PREVIEW_USER_ID, role: "estudiante", displayName: "Despertado", avatarBase: "aria", xp: 0, coins: 40, gems: 0, streak: 1 },
      progress: new Map(),
      bosses: new Set(),
      inventory: [],
      consumables: new Map(),
      aidUses: [],
    };
  }
  return g.__umbralPreview;
}

const courseRow: Course = { ...(seed.course as Course) };
const missions: MissionSummary[] = seed.missions.map((m) => ({
  id: `m${m.position}`, courseSlug: seed.course.slug, position: m.position, title: m.title, intro: m.intro, xpReward: m.xp_reward, isBoss: m.is_boss,
}));
const questions = (id: string) => seed.missions.find((m) => `m${m.position}` === id)?.questions ?? [];

export function createMemoryRepo(): Repo {
  return {
    async getProfile() { return { ...state().profile }; },
    async listCourses() { return [courseRow]; },
    async getCourse(slug): Promise<CourseDetail | null> { return slug === courseRow.slug ? { ...courseRow, missions } : null; },
    async getProgress() { return [...state().progress.values()]; },
    async getBossDefeats() { return [...state().bosses]; },
    async getInventory() { return [...state().inventory]; },
    async getMissionPlay(id): Promise<MissionPlay | null> {
      const mission = missions.find((m) => m.id === id);
      if (!mission) return null;
      return { mission, course: courseRow, questions: questions(id).map((q, i) => ({ id: `${id}q${i + 1}`, position: i + 1, prompt: q.prompt, options: q.options, hasHint: q.hint.trim() !== "" })) };
    },
    async getAnswerKey(id): Promise<AnswerKeyRow[]> {
      return questions(id).map((q, i) => ({ id: `${id}q${i + 1}`, correctIndex: q.correct_index, explanation: q.explanation }));
    },
    async completeMission(_u, id, score, passMark, items): Promise<CompleteResult> {
      const s = state();
      const m = missions.find((x) => x.id === id);
      if (!m) throw new Error("mision_no_encontrada");
      const blocked = missions.some((p) => p.position < m.position && !s.progress.get(p.id)?.completed);
      if (blocked) throw new Error("mision_bloqueada");
      const passed = score >= passMark;
      const prev = s.progress.get(id);
      const first = passed && !prev?.completed;
      s.progress.set(id, { missionId: id, bestScore: Math.max(prev?.bestScore ?? 0, score), attempts: (prev?.attempts ?? 0) + 1, completed: passed || !!prev?.completed });
      const xpGain = first ? m.xpReward : 0;
      const coinsGain = first ? 10 + (score === 100 ? 10 : 0) + (m.isBoss ? 100 : 0) : 0;
      const gemsGain = first && m.isBoss ? 5 : 0;
      const granted: string[] = [];
      if (first) {
        if (m.isBoss) s.bosses.add(courseRow.slug);
        for (const it of items) if (!s.inventory.some((i) => i.itemId === it)) { s.inventory.push({ itemId: it, source: "logro", acquiredAt: new Date().toISOString() }); granted.push(it); }
      }
      s.profile = { ...s.profile, xp: s.profile.xp + xpGain, coins: s.profile.coins + coinsGain, gems: s.profile.gems + gemsGain };
      const courseDone = missions.every((x) => s.progress.get(x.id)?.completed);
      return { passed, first, score, xpGain, coinsGain, gemsGain, xp: s.profile.xp, coins: s.profile.coins, gems: s.profile.gems, streak: s.profile.streak, bossDefeated: first && m.isBoss, courseDone, granted };
    },
    async purchaseItem(_u, itemId, price) {
      const s = state();
      if (s.inventory.some((i) => i.itemId === itemId)) throw new Error("ya_lo_tienes");
      if (s.profile.coins < price) throw new Error("monedas_insuficientes");
      s.profile = { ...s.profile, coins: s.profile.coins - price };
      s.inventory.push({ itemId, source: "tienda", acquiredAt: new Date().toISOString() });
      return { coins: s.profile.coins };
    },
    async setAvatar(_u, base: AvatarBase) { state().profile = { ...state().profile, avatarBase: base }; },
    async getConsumables() { return Object.fromEntries(state().consumables); },
    async getAidUsesToday() {
      const day = todayBogota();
      return state().aidUses.filter((u) => u.day === day).map((u): AidUseRow => ({ itemId: u.itemId, missionId: u.missionId, questionId: u.questionId, free: u.free, hint: u.hint, removed: u.removed }));
    },
    async buyConsumable(_u, itemId, price, maxStock) {
      const s = state();
      const have = s.consumables.get(itemId) ?? 0;
      if (have >= maxStock) throw new Error("reserva_llena");
      if (s.profile.coins < price) throw new Error("monedas_insuficientes");
      s.profile = { ...s.profile, coins: s.profile.coins - price };
      s.consumables.set(itemId, have + 1);
      return { coins: s.profile.coins, quantity: have + 1 };
    },
    async useAid(_u, questionId, itemId, dailyCap, minXp) {
      const s = state();
      const day = todayBogota();
      const missionId = questionId.replace(/q\d+$/, "");
      const m = missions.find((x) => x.id === missionId);
      const qi = Number(questionId.slice(missionId.length + 1)) - 1;
      const q = questions(missionId)[qi];
      if (!m || !q) throw new Error("pregunta_no_encontrada");
      if (missions.some((p) => p.position < m.position && !s.progress.get(p.id)?.completed)) throw new Error("mision_bloqueada");
      const left = () => s.consumables.get(itemId) ?? 0;
      const prev = s.aidUses.find((u) => u.day === day && u.itemId === itemId && u.questionId === questionId);
      if (prev) return { hint: prev.hint, removed: prev.removed, free: prev.free, charged: false, left: left() };
      if (s.profile.xp < minXp) throw new Error("rango_insuficiente");
      const isHint = itemId === "obj_ayuda_pista";
      const free = isHint && !s.aidUses.some((u) => u.day === day && u.itemId === itemId && u.missionId === missionId && u.free);
      if (!free) {
        if (s.aidUses.filter((u) => u.day === day && u.itemId === itemId && !u.free).length >= dailyCap) throw new Error("tope_diario");
        if (left() < 1) throw new Error("sin_unidades");
        s.consumables.set(itemId, left() - 1);
      }
      const wrong = q.options.map((_, i) => i).filter((i) => i !== q.correct_index).sort(() => Math.random() - 0.5);
      const removed = isHint ? undefined : wrong.slice(0, Math.min(Math.ceil(wrong.length / 2), wrong.length - 1)).sort((a, b) => a - b);
      const use = { itemId, missionId, questionId, free, hint: isHint ? q.hint : undefined, removed, day };
      s.aidUses.push(use);
      return { hint: use.hint, removed, free, charged: !free, left: left() };
    },
  };
}

/** Utilidad de la vista previa: rango actual del perfil de ejemplo. */
export const previewRank = () => rankForXp(state().profile.xp);
