import "server-only";
import { todayBogota } from "@/lib/game/aids";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AidResult, AidUseRow, AnswerKeyRow, AnswerResult, ClassReport, ClassSummary, FinishResult, AvatarBase, Course, CourseDetail, InventoryRow, MissionPlay, MissionSummary,
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
        introSeen: data.intro_seen_at != null, chroniclesRead: (data.chronicles_read as string[] | null) ?? [],
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

    async getOpenAttempt(userId, missionId) {
      const { data, error } = await db.from("attempts").select("answers").eq("user_id", userId).eq("mission_id", missionId).is("finished_at", null).maybeSingle();
      if (error) fail(error, "intento");
      return data ? (data.answers as number[]) : null;
    },

    async answerQuestion(userId, missionId, index, choice) {
      const { data, error } = await db.rpc("answer_question", { p_user: userId, p_mission: missionId, p_index: index, p_choice: choice });
      if (error) fail(error, "responder");
      const r = data as Record<string, unknown>;
      const out: AnswerResult = {
        index: r.index as number, choice: r.choice as number, correct: r.correct as boolean, correctIndex: r.correct_index as number,
        explanation: r.explanation as string, answered: r.answered as number, right: r.right as number, total: r.total as number,
      };
      return out;
    },

    async finishAttempt(userId, missionId, passMark, items) {
      const { data, error } = await db.rpc("finish_attempt", { p_user: userId, p_mission: missionId, p_pass_mark: passMark, p_items_on_first: items });
      if (error) fail(error, "completar misión");
      const r = data as Record<string, unknown>;
      const out: FinishResult = {
        passed: r.passed as boolean, first: r.first as boolean, score: r.score as number,
        xpGain: r.xp_gain as number, coinsGain: r.coins_gain as number, gemsGain: r.gems_gain as number,
        xp: r.xp as number, coins: r.coins as number, gems: r.gems as number, streak: r.streak as number,
        bossDefeated: r.boss_defeated as boolean, courseDone: r.course_done as boolean, granted: (r.granted as string[]) ?? [],
        answers: (r.answers as number[]) ?? [],
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

    async markIntroSeen(userId) {
      const { error } = await db.from("profiles").update({ intro_seen_at: new Date().toISOString() }).eq("id", userId).is("intro_seen_at", null);
      if (error) fail(error, "bienvenida");
    },

    async markChapterRead(userId, chapterId) {
      const { data, error } = await db.from("profiles").select("chronicles_read").eq("id", userId).maybeSingle();
      if (error) fail(error, "crónicas");
      const read = (data?.chronicles_read as string[] | null) ?? [];
      if (read.includes(chapterId)) return;
      const { error: e2 } = await db.from("profiles").update({ chronicles_read: [...read, chapterId] }).eq("id", userId);
      if (e2) fail(e2, "crónicas");
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

    async listTeacherClasses(teacherId) {
      const { data, error } = await db.from("classes").select("id,name,code,created_at,archived_at,class_members(count)").eq("teacher_id", teacherId).order("created_at");
      if (error) fail(error, "clases");
      return (data ?? []).map((r): ClassSummary => ({
        id: r.id, name: r.name, code: r.code, createdAt: r.created_at, archived: r.archived_at !== null,
        members: (r.class_members as { count: number }[] | null)?.[0]?.count ?? 0,
      }));
    },

    async createClass(teacherId, name) {
      const { data, error } = await db.rpc("create_class", { p_teacher: teacherId, p_name: name });
      if (error) fail(error, "crear clase");
      return data as { id: string; name: string; code: string };
    },

    async manageClass(teacherId, classId, action, arg) {
      const { error } = await db.rpc("manage_class", { p_teacher: teacherId, p_class: classId, p_action: action, p_arg: arg ?? null });
      if (error) fail(error, "clase");
    },

    async classReport(teacherId, classId) {
      const { data, error } = await db.rpc("class_report", { p_teacher: teacherId, p_class: classId });
      if (error) fail(error, "informe");
      const r = data as {
        class: { id: string; name: string; code: string; created_at: string; archived: boolean };
        students: { id: string; name: string; avatar: string; xp: number; streak: number; last_active: string | null; joined_at: string;
          progress: { mission_id: string; best_score: number; attempts: number; completed: boolean }[] }[];
        questions: { mission_id: string; position: number; answered: number; right: number }[];
      };
      const out: ClassReport = {
        class: { id: r.class.id, name: r.class.name, code: r.class.code, createdAt: r.class.created_at, archived: r.class.archived },
        students: r.students.map((st) => ({
          id: st.id, name: st.name, xp: st.xp, streak: st.streak, lastActive: st.last_active, joinedAt: st.joined_at,
          avatar: (AVATAR_BASES as readonly string[]).includes(st.avatar) ? (st.avatar as AvatarBase) : "aria",
          progress: st.progress.map((p) => ({ missionId: p.mission_id, bestScore: p.best_score, attempts: p.attempts, completed: p.completed })),
        })),
        questions: r.questions.map((q) => ({ missionId: q.mission_id, position: q.position, answered: q.answered, right: q.right })),
      };
      return out;
    },

    async listStudentClasses(studentId) {
      const { data, error } = await db.from("class_members").select("classes(id,name,teacher_id,archived_at)").eq("student_id", studentId);
      if (error) fail(error, "clases");
      const classes = (data ?? [])
        .map((r) => r.classes as unknown as { id: string; name: string; teacher_id: string; archived_at: string | null } | null)
        .filter((c): c is NonNullable<typeof c> => !!c && c.archived_at === null);
      if (!classes.length) return [];
      const { data: teachers, error: e2 } = await db.from("profiles").select("id,display_name").in("id", [...new Set(classes.map((c) => c.teacher_id))]);
      if (e2) fail(e2, "docentes");
      const names = new Map((teachers ?? []).map((t) => [t.id as string, t.display_name as string]));
      return classes.map((c) => ({ id: c.id, name: c.name, teacherName: names.get(c.teacher_id) ?? "Tu docente" }));
    },

    async joinClass(studentId, code) {
      const { data, error } = await db.rpc("join_class", { p_student: studentId, p_code: code });
      if (error) fail(error, "unirse");
      return data as { id: string; name: string };
    },

    async leaveClass(studentId, classId) {
      const { error } = await db.rpc("leave_class", { p_student: studentId, p_class: classId });
      if (error) fail(error, "salir de la clase");
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
