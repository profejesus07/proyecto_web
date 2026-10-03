import seed from "@/content/primer-portal.json";
import { rankForXp } from "@/lib/game/ranks";
import type {
  AnswerKeyRow, AvatarBase, CompleteResult, Course, CourseDetail, InventoryRow, MissionPlay, MissionSummary,
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
}

const g = globalThis as unknown as { __umbralPreview?: State };

function state(): State {
  if (!g.__umbralPreview) {
    g.__umbralPreview = {
      profile: { id: PREVIEW_USER_ID, role: "estudiante", displayName: "Despertado", avatarBase: "aria", xp: 0, coins: 40, gems: 0, streak: 1 },
      progress: new Map(),
      bosses: new Set(),
      inventory: [],
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
      return { mission, course: courseRow, questions: questions(id).map((q, i) => ({ id: `${id}q${i + 1}`, position: i + 1, prompt: q.prompt, options: q.options, hint: q.hint })) };
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
  };
}

/** Utilidad de la vista previa: rango actual del perfil de ejemplo. */
export const previewRank = () => rankForXp(state().profile.xp);
