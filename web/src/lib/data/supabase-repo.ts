import "server-only";
import { todayBogota } from "@/lib/game/aids";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AidResult, AidUseRow, AnswerKeyRow, AvatarBase, CompleteResult, Course, CourseDetail, InventoryRow, MissionPlay, MissionSummary,
  Profile, ProgressRow, PublicQuestion, Repo,
} from "./types";
import { AVATAR_BASES } from "./types";

type Row = Record<string, unknown>;

function fail(error: { message: string } | null, what: string): never {
  throw new Error(`${what}: ${error?.message ?? "error desconocido"}`);
}

const course = (r: Row): Course => ({
  slug: r.slug as string, title: r.title as string, summary: r.summary as string,
  element: r.element as Course["element"], guardian: r.guardian as string, position: r.position as number,
});
const mission = (r: Row): MissionSummary => ({
  id: r.id as string, courseSlug: r.course_slug as string, position: r.position as number, title: r.title as string,
  intro: r.intro as string, xpReward: r.xp_reward as number, isBoss: r.is_boss as boolean,
});

export function createSupabaseRepo(): Repo {
  const db = createAdminClient();
  return {
    async getProfile(userId) {
      const { data, error } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) fail(error, "perfil");
      if (!data) return null;
      const base = (data.avatar as { base?: string } | null)?.base;
      const p: Profile = {
        id: data.id, role: data.role, displayName: data.display_name,
        avatarBase: (AVATAR_BASES as readonly string[]).includes(base ?? "") ? (base as AvatarBase) : "aria",
        xp: data.xp, coins: data.coins, gems: data.gems, streak: data.streak,
      };
      return p;
    },

    async listCourses() {
      const { data, error } = await db.from("courses").select("*").eq("published", true).order("position");
      if (error) fail(error, "cursos");
      return (data ?? []).map(course);
    },

    async getCourse(slug) {
      const { data: c, error } = await db.from("courses").select("*").eq("slug", slug).eq("published", true).maybeSingle();
      if (error) fail(error, "curso");
      if (!c) return null;
      const { data: ms, error: e2 } = await db.from("missions").select("*").eq("course_slug", slug).order("position");
      if (e2) fail(e2, "misiones");
      const detail: CourseDetail = { ...course(c), missions: (ms ?? []).map(mission) };
      return detail;
    },

    async getProgress(userId) {
      const { data, error } = await db.from("mission_progress").select("mission_id,best_score,attempts,completed_at").eq("user_id", userId);
      if (error) fail(error, "progreso");
      return (data ?? []).map((r): ProgressRow => ({
        missionId: r.mission_id, bestScore: r.best_score, attempts: r.attempts, completed: r.completed_at !== null,
      }));
    },

    async getBossDefeats(userId) {
      const { data, error } = await db.from("boss_defeats").select("course_slug").eq("user_id", userId);
      if (error) fail(error, "jefes");
      return (data ?? []).map((r) => r.course_slug as string);
    },

    async getInventory(userId) {
      const { data, error } = await db.from("inventory").select("item_id,source,acquired_at").eq("user_id", userId).order("acquired_at", { ascending: false });
      if (error) fail(error, "inventario");
      return (data ?? []).map((r): InventoryRow => ({ itemId: r.item_id, source: r.source, acquiredAt: r.acquired_at }));
    },

    async getMissionPlay(missionId): Promise<MissionPlay | null> {
      const { data: m, error } = await db.from("missions").select("*").eq("id", missionId).maybeSingle();
      if (error) fail(error, "misión");
      if (!m) return null;
      const { data: c, error: e2 } = await db.from("courses").select("*").eq("slug", m.course_slug).eq("published", true).maybeSingle();
      if (e2) fail(e2, "curso");
      if (!c) return null;
      // Nunca se selecciona correct_index ni explanation aquí, y la pista solo se usa para saber si existe:
      // esos datos no viajan al navegador.
      const { data: qs, error: e3 } = await db.from("questions").select("id,position,prompt,options,hint").eq("mission_id", missionId).order("position");
      if (e3) fail(e3, "preguntas");
      const questions = (qs ?? []).map((q): PublicQuestion => ({
        id: q.id, position: q.position, prompt: q.prompt, options: q.options as string[], hasHint: String(q.hint ?? "").trim() !== "",
      }));
      return { mission: mission(m), course: course(c), questions };
    },

    async getAnswerKey(missionId) {
      const { data, error } = await db.from("questions").select("id,correct_index,explanation").eq("mission_id", missionId).order("position");
      if (error) fail(error, "respuestas");
      return (data ?? []).map((r): AnswerKeyRow => ({ id: r.id, correctIndex: r.correct_index, explanation: r.explanation }));
    },

    async completeMission(userId, missionId, score, passMark, items) {
      const { data, error } = await db.rpc("complete_mission", {
        p_user: userId, p_mission: missionId, p_score: score, p_pass_mark: passMark, p_items_on_first: items,
      });
      if (error) fail(error, "completar misión");
      const r = data as Record<string, unknown>;
      const out: CompleteResult = {
        passed: r.passed as boolean, first: r.first as boolean, score: r.score as number,
        xpGain: r.xp_gain as number, coinsGain: r.coins_gain as number, gemsGain: r.gems_gain as number,
        xp: r.xp as number, coins: r.coins as number, gems: r.gems as number, streak: r.streak as number,
        bossDefeated: r.boss_defeated as boolean, courseDone: r.course_done as boolean, granted: (r.granted as string[]) ?? [],
      };
      return out;
    },

    async purchaseItem(userId, itemId, price) {
      const { data, error } = await db.rpc("purchase_item", { p_user: userId, p_item: itemId, p_price: price });
      if (error) fail(error, "compra");
      return { coins: (data as { coins: number }).coins };
    },

    async setAvatar(userId, base) {
      const { error } = await db.from("profiles").update({ avatar: { base } }).eq("id", userId);
      if (error) fail(error, "avatar");
    },

    async getConsumables(userId) {
      const { data, error } = await db.from("consumables").select("item_id,quantity").eq("user_id", userId);
      if (error) fail(error, "ayudas");
      return Object.fromEntries((data ?? []).map((r) => [r.item_id as string, r.quantity as number]));
    },

    async getAidUsesToday(userId) {
      const { data, error } = await db.from("aid_uses").select("item_id,mission_id,question_id,free,payload").eq("user_id", userId).eq("used_on", todayBogota());
      if (error) fail(error, "ayudas usadas");
      return (data ?? []).map((r): AidUseRow => {
        const pl = (r.payload ?? {}) as { hint?: string; removed?: number[] };
        return { itemId: r.item_id, missionId: r.mission_id, questionId: r.question_id, free: r.free, hint: pl.hint, removed: pl.removed };
      });
    },

    async buyConsumable(userId, itemId, price, maxStock) {
      const { data, error } = await db.rpc("buy_consumable", { p_user: userId, p_item: itemId, p_price: price, p_max: maxStock });
      if (error) fail(error, "compra");
      const r = data as { coins: number; quantity: number };
      return { coins: r.coins, quantity: r.quantity };
    },

    async useAid(userId, questionId, itemId, dailyCap, minXp) {
      const { data, error } = await db.rpc("use_aid", { p_user: userId, p_question: questionId, p_item: itemId, p_daily_cap: dailyCap, p_min_xp: minXp });
      if (error) fail(error, "ayuda");
      const r = data as Record<string, unknown>;
      const out: AidResult = {
        hint: r.hint as string | undefined, removed: r.removed as number[] | undefined,
        free: r.free as boolean, charged: r.charged as boolean, left: r.left as number,
      };
      return out;
    },
  };
}
