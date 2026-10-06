import "server-only";
import { asKind, publicActivity, solutionOf } from "@/lib/activities";
import { sanitizeLook } from "@/lib/avatar-look";
import { todayBogota } from "@/lib/game/aids";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdminClass, AdminPayment, AdminUser, Module, Payment, PaymentProvider, PaymentStatus, Certificate, DocType, CourseInput, CourseListItem, EditableCourse, EditableQuestion, AidResult, AidUseRow, AnswerKeyRow, CompleteResult, AnswerResult, ClassReport, ClassSummary, FamilyChild, FamilyMessage, FinishResult, LinkedFamily, PowerPayload, PowerResult, AvatarBase, Course, CourseDetail, InventoryRow, MissionPlay, MissionSummary,
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
  price: (r.price_cop as number | null | undefined) ?? null,
  kind: (r.kind as Course["kind"] | undefined) ?? "curso",
  area: (r.area as string | null | undefined) ?? null,
  grade: (r.grade as string | null | undefined) ?? null,
  schoolYear: (r.school_year as number | null | undefined) ?? null,
  accessUntil: (r.access_until as string | null | undefined) ?? null,
  hours: (r.hours as number | null | undefined) ?? null,
  trainerName: (r.trainer_name as string | null | undefined) ?? null,
  trainerTitle: (r.trainer_title as string | null | undefined) ?? null,
  isFree: (r.is_free as boolean | undefined) ?? false,
});
const moduleOf = (r: Row): Module => ({
  id: r.id as string, position: r.position as number, title: r.title as string, summary: (r.summary as string | null) ?? "", guardian: r.guardian as string,
});
const payment = (r: Row): Payment => ({
  reference: r.reference as string, provider: r.provider as PaymentProvider, amount: r.amount_cop as number, status: r.status as PaymentStatus,
  courseSlug: r.course_slug as string, userId: r.user_id as string, payerId: r.payer_id as string, createdAt: r.created_at as string,
});
const certificate = (r: Row): Certificate => ({
  number: r.number as number, code: r.code as string, userId: (r.user_id as string | null) ?? null, courseSlug: r.course_slug as string,
  participantName: r.participant_name as string, docType: r.doc_type as DocType, docNumber: r.doc_number as string,
  courseTitle: r.course_title as string, hours: r.hours as number, trainerName: r.trainer_name as string, trainerTitle: r.trainer_title as string,
  issuerName: r.issuer_name as string, issuerTitle: (r.issuer_title as string | null) ?? null, city: (r.city as string | null) ?? null,
  startedOn: r.started_on as string, finishedOn: r.finished_on as string, issuedAt: r.issued_at as string,
});
const courseRow = (c: CourseInput) => ({
  kind: c.kind, title: c.title, summary: c.summary, element: c.element, guardian: c.guardian,
  area: c.area, grade: c.grade, school_year: c.schoolYear, access_until: c.accessUntil,
  hours: c.hours, trainer_name: c.trainerName, trainer_title: c.trainerTitle, updated_at: new Date().toISOString(),
});
const mission = (r: Row): MissionSummary => ({
  id: r.id as string, courseSlug: r.course_slug as string, position: r.position as number, title: r.title as string,
  intro: r.intro as string, xpReward: r.xp_reward as number, isBoss: r.is_boss as boolean,
  period: (r.period as number | null | undefined) ?? null,
  moduleId: (r.module_id as string | null | undefined) ?? null,
  lessonKind: r.kind === "explicacion" ? "explicacion" : "reto",
  body: (r.body as string | null | undefined) ?? "",
  videoUrl: (r.video_url as string | null | undefined) ?? null,
});

export function createSupabaseRepo(): Repo {
  const db = createAdminClient();
  return {
    async getProfile(userId) {
      const { data, error } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) fail(error, "perfil");
      if (!data) return null;
      const avatar = data.avatar as { base?: string; look?: unknown } | null;
      const base = avatar?.base;
      const p: Profile = {
        // El administrador es un docente con la marca is_admin.
        id: data.id, role: data.is_admin ? "admin" : data.role, displayName: data.display_name,
        avatarBase: (AVATAR_BASES as readonly string[]).includes(base ?? "") ? (base as AvatarBase) : "aria",
        avatarLook: sanitizeLook(avatar?.look),
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
      const [{ data: ms, error: e2 }, { data: mods, error: e3 }] = await Promise.all([
        db.from("missions").select("*").eq("course_slug", slug).order("position"),
        db.from("modules").select("*").eq("course_slug", slug).order("position"),
      ]);
      if (e2) fail(e2, "misiones");
      if (e3) fail(e3, "módulos");
      const detail: CourseDetail = { ...course(c), modules: (mods ?? []).map(moduleOf), missions: (ms ?? []).map(mission) };
      return detail;
    },

    async getProgress(userId) {
      const { data, error } = await db.from("mission_progress").select("mission_id,best_score,attempts,completed_at").eq("user_id", userId);
      if (error) fail(error, "progreso");
      return (data ?? []).map((r): ProgressRow => ({
        missionId: r.mission_id, bestScore: r.best_score, attempts: r.attempts, completed: r.completed_at !== null, completedAt: r.completed_at,
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
      // Las respuestas aceptadas y el orden correcto tampoco viajan: publicActivity los oculta o los mezcla.
      const { data: qs, error: e3 } = await db.from("questions").select("id,position,prompt,options,hint,kind,data").eq("mission_id", missionId).order("position");
      if (e3) fail(e3, "preguntas");
      const questions = (qs ?? []).map((q): PublicQuestion => {
        const kind = asKind(q.kind);
        return { id: q.id, position: q.position, prompt: q.prompt, kind, ...publicActivity(q.id, kind, q.options as string[], (q.data ?? {}) as { right?: string[] }), hasHint: String(q.hint ?? "").trim() !== "" };
      });
      return { mission: mission(m), course: course(c), questions };
    },

    async getAnswerKey(missionId) {
      const { data, error } = await db.from("questions").select("id,correct_index,explanation,kind,options,data").eq("mission_id", missionId).order("position");
      if (error) fail(error, "respuestas");
      return (data ?? []).map((r): AnswerKeyRow => {
        const kind = asKind(r.kind);
        return { id: r.id, kind, correctIndex: r.correct_index, explanation: r.explanation, solution: solutionOf(kind, r.options as string[], (r.data ?? {}) as { right?: string[] }) };
      });
    },

    async getOpenAttempt(userId, missionId) {
      const { data, error } = await db.from("attempts").select("answers").eq("user_id", userId).eq("mission_id", missionId).is("finished_at", null).maybeSingle();
      if (error) fail(error, "intento");
      return data ? (data.answers as number[]) : null;
    },

    async answerActivity(userId, missionId, index, response) {
      const { data, error } = await db.rpc("answer_activity", { p_user: userId, p_mission: missionId, p_index: index, p_response: response });
      if (error) fail(error, "responder");
      const r = data as Record<string, unknown>;
      const out: AnswerResult = {
        index: r.index as number, choice: (r.choice as number | undefined) ?? -1, correct: r.correct as boolean, correctIndex: (r.correct_index as number | undefined) ?? -1,
        explanation: (r.explanation as string | undefined) ?? "", answered: r.answered as number, right: r.right as number, total: r.total as number,
        shielded: r.shielded === true || undefined, bonusXp: (r.bonus_xp as number | undefined) || undefined,
        ...(r.solution !== undefined && r.solution !== null && { solution: r.solution as AnswerResult["solution"] }),
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

    async completeReading(userId, missionId) {
      const { data, error } = await db.rpc("complete_reading", { p_user: userId, p_mission: missionId });
      if (error) fail(error, "completar explicación");
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

    async setAvatar(userId, base, look = {}) {
      const { error } = await db.from("profiles").update({ avatar: { base, look } }).eq("id", userId);
      if (error) fail(error, "avatar");
    },

    async setDisplayName(userId, name) {
      const { error } = await db.from("profiles").update({ display_name: name }).eq("id", userId);
      if (error) fail(error, "nombre");
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
        const pl = (r.payload ?? {}) as PowerPayload & { hint?: string };
        return { itemId: r.item_id, missionId: r.mission_id, questionId: r.question_id, free: r.free, hint: pl.hint ?? undefined, removed: pl.removed, payload: pl };
      });
    },

    async usePower(userId, missionId, index, itemId, dailyCap, minXp) {
      const { data, error } = await db.rpc("use_power", { p_user: userId, p_mission: missionId, p_index: index, p_item: itemId, p_daily_cap: dailyCap, p_min_xp: minXp });
      if (error) fail(error, "poder");
      return data as PowerResult;
    },

    async buyConsumable(userId, itemId, price, maxStock) {
      const { data, error } = await db.rpc("buy_consumable", { p_user: userId, p_item: itemId, p_price: price, p_max: maxStock });
      if (error) fail(error, "compra");
      const r = data as { coins: number; quantity: number };
      return { coins: r.coins, quantity: r.quantity };
    },

    async listTeacherClasses(teacherId) {
      const { data, error } = await db.from("classes").select("id,name,code,created_at,archived_at,course_slug,courses(title),class_members(count)").eq("teacher_id", teacherId).order("created_at");
      if (error) fail(error, "clases");
      return (data ?? []).map((r): ClassSummary => ({
        id: r.id, name: r.name, code: r.code, createdAt: r.created_at, archived: r.archived_at !== null,
        courseSlug: (r.course_slug as string | null) ?? null, courseTitle: (r.courses as unknown as { title: string } | null)?.title ?? null,
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

    async familyCode(studentId, renew = false) {
      const { data, error } = await db.rpc("family_code", { p_student: studentId, p_renew: renew });
      if (error) fail(error, "código de familia");
      return data as string;
    },

    async linkFamily(familyId, code) {
      const { data, error } = await db.rpc("link_family", { p_family: familyId, p_code: code });
      if (error) fail(error, "familia");
      return data as { id: string; name: string };
    },

    async unlinkFamily(actorId, familyId, studentId) {
      const { error } = await db.rpc("unlink_family", { p_actor: actorId, p_family: familyId, p_student: studentId });
      if (error) fail(error, "familia");
    },

    async listStudentFamilies(studentId) {
      const { data, error } = await db.rpc("student_families", { p_student: studentId });
      if (error) fail(error, "familias");
      return (data as LinkedFamily[] | null) ?? [];
    },

    async sendFamilyMessage(familyId, studentId, message) {
      const { data, error } = await db.rpc("send_family_message", { p_family: familyId, p_student: studentId, p_message: message });
      if (error) fail(error, "mensaje");
      return data as { remaining: number };
    },

    async studentMessages(studentId) {
      const { data, error } = await db.rpc("student_messages", { p_student: studentId });
      if (error) fail(error, "mensajes");
      return ((data as { id: string; message: string; created_at: string; from: string; guide: string | null }[] | null) ?? [])
        .map((m): FamilyMessage => ({ id: m.id, message: m.message, createdAt: m.created_at, from: m.from, guide: m.guide }));
    },

    async readFamilyMessages(studentId) {
      const { error } = await db.rpc("read_family_messages", { p_student: studentId });
      if (error) fail(error, "mensajes");
    },

    async familyMessagesLeft(familyId) {
      const { data, error } = await db.rpc("family_messages_left", { p_family: familyId });
      if (error) fail(error, "mensajes");
      return (data as Record<string, number> | null) ?? {};
    },

    async familyOverview(familyId) {
      const { data, error } = await db.rpc("family_overview", { p_family: familyId });
      if (error) fail(error, "familia");
      type Raw = {
        id: string; name: string; avatar: string; look?: unknown; xp: number; streak: number; last_active: string | null; since: string; week_attempts: number;
        courses: { slug: string; title: string; kind: "clase" | "curso"; total: number; lessons: { position: number; title: string; best_score: number; attempts: number; completed: boolean }[] }[];
        classes: { name: string; teacher: string }[];
        certificates: { code: string; course_title: string; hours: number; issued_at: string }[];
        decor?: string[];
      };
      return ((data as Raw[] | null) ?? []).map((c): FamilyChild => ({
        id: c.id, name: c.name, xp: c.xp, streak: c.streak, lastActive: c.last_active, since: c.since, weekAttempts: c.week_attempts,
        avatar: (AVATAR_BASES as readonly string[]).includes(c.avatar) ? (c.avatar as AvatarBase) : "aria",
        avatarLook: sanitizeLook(c.look),
        courses: c.courses.map((k) => ({ ...k, lessons: k.lessons.map((l) => ({ position: l.position, title: l.title, bestScore: l.best_score, attempts: l.attempts, completed: l.completed })) })),
        classes: c.classes,
        certificates: c.certificates.map((x) => ({ code: x.code, courseTitle: x.course_title, hours: x.hours, issuedAt: x.issued_at })),
        decor: c.decor ?? [],
      }));
    },

    async classReport(teacherId, classId) {
      const { data, error } = await db.rpc("class_report", { p_teacher: teacherId, p_class: classId });
      if (error) fail(error, "informe");
      const r = data as {
        class: { id: string; name: string; code: string; created_at: string; archived: boolean };
        students: { id: string; name: string; avatar: string; look?: unknown; xp: number; streak: number; last_active: string | null; joined_at: string;
          progress: { mission_id: string; best_score: number; attempts: number; completed: boolean }[] }[];
        questions: { mission_id: string; position: number; answered: number; right: number }[];
      };
      const out: ClassReport = {
        class: { id: r.class.id, name: r.class.name, code: r.class.code, createdAt: r.class.created_at, archived: r.class.archived },
        students: r.students.map((st) => ({
          id: st.id, name: st.name, xp: st.xp, streak: st.streak, lastActive: st.last_active, joinedAt: st.joined_at,
          avatar: (AVATAR_BASES as readonly string[]).includes(st.avatar) ? (st.avatar as AvatarBase) : "aria",
          avatarLook: sanitizeLook(st.look),
          progress: st.progress.map((p) => ({ missionId: p.mission_id, bestScore: p.best_score, attempts: p.attempts, completed: p.completed })),
        })),
        questions: r.questions.map((q) => ({ missionId: q.mission_id, position: q.position, answered: q.answered, right: q.right })),
      };
      return out;
    },

    async listStudentClasses(studentId) {
      const { data, error } = await db.from("class_members").select("classes(id,name,teacher_id,archived_at,courses(title))").eq("student_id", studentId);
      if (error) fail(error, "clases");
      const classes = (data ?? [])
        .map((r) => r.classes as unknown as { id: string; name: string; teacher_id: string; archived_at: string | null; courses: { title: string } | null } | null)
        .filter((c): c is NonNullable<typeof c> => !!c && c.archived_at === null);
      if (!classes.length) return [];
      const { data: teachers, error: e2 } = await db.from("profiles").select("id,display_name").in("id", [...new Set(classes.map((c) => c.teacher_id))]);
      if (e2) fail(e2, "docentes");
      const names = new Map((teachers ?? []).map((t) => [t.id as string, t.display_name as string]));
      return classes.map((c) => ({ id: c.id, name: c.name, teacherName: names.get(c.teacher_id) ?? "Tu docente", courseTitle: c.courses?.title ?? null }));
    },

    async joinClass(studentId, code) {
      const { data, error } = await db.rpc("join_class", { p_student: studentId, p_code: code });
      if (error) fail(error, "unirse");
      const r = data as { id: string; name: string; course_slug: string | null; course_title: string | null; expires_at: string | null };
      return { id: r.id, name: r.name, courseSlug: r.course_slug ?? null, courseTitle: r.course_title ?? null, expiresAt: r.expires_at ?? null };
    },

    async revokeClassAccess(studentId, classId) {
      const { error } = await db.rpc("revoke_class_access", { p_student: studentId, p_class: classId });
      if (error) fail(error, "acceso de la clase");
    },

    async leaveClass(studentId, classId) {
      const { error } = await db.rpc("leave_class", { p_student: studentId, p_class: classId });
      if (error) fail(error, "salir de la clase");
    },

    async getCourseAccess(userId) {
      const { data: p, error } = await db.from("profiles").select("role,is_admin").eq("id", userId).maybeSingle();
      if (error) fail(error, "acceso");
      if (p && (p.role === "docente" || p.is_admin)) {
        const { data: all, error: e2 } = await db.from("courses").select("slug");
        if (e2) fail(e2, "acceso");
        return new Set((all ?? []).map((c) => c.slug as string));
      }
      const [{ data, error: e3 }, { data: free, error: e4 }] = await Promise.all([
        db.from("course_access").select("course_slug,expires_at").eq("user_id", userId).is("revoked_at", null),
        db.from("courses").select("slug").eq("is_free", true),
      ]);
      if (e3) fail(e3, "acceso");
      if (e4) fail(e4, "acceso");
      const now = Date.now();
      // Los cursos gratis están abiertos para todos (como en public.has_course_access).
      return new Set([
        ...(free ?? []).map((c) => c.slug as string),
        ...(data ?? []).filter((a) => !a.expires_at || new Date(a.expires_at).getTime() > now).map((a) => a.course_slug as string),
      ]);
    },

    async startPayment(payerId, studentId, course, provider) {
      const { data, error } = await db.rpc("start_payment", { p_payer: payerId, p_student: studentId, p_course: course, p_provider: provider });
      if (error) fail(error, "pago");
      const r = data as Row;
      return { reference: r.reference as string, amount: r.amount as number, title: r.title as string, student: r.student as string };
    },

    async settlePayment(u) {
      const { data, error } = await db.rpc("settle_payment", {
        p_reference: u.reference, p_provider: u.provider, p_provider_ref: u.providerRef, p_status: u.status,
        p_amount_cop: u.amount, p_currency: u.currency, p_detail: u.detail,
      });
      if (error) fail(error, "pago");
      const r = data as Row;
      return { status: r.status as PaymentStatus, userId: r.user_id as string, course: r.course as string };
    },

    async getPayment(reference) {
      const { data, error } = await db.from("payments").select("*").eq("reference", reference).maybeSingle();
      if (error) fail(error, "pago");
      return data ? payment(data) : null;
    },

    async listPayments(userId) {
      if (!/^[0-9a-f-]{36}$/i.test(userId)) return [];
      const { data, error } = await db.from("payments").select("*").or(`user_id.eq.${userId},payer_id.eq.${userId}`)
        .order("created_at", { ascending: false }).limit(30);
      if (error) fail(error, "pagos");
      return (data ?? []).map(payment);
    },

    async adminPayments(adminId) {
      const { data, error } = await db.rpc("admin_payments", { p_admin: adminId, p_limit: 100 });
      if (error) fail(error, "pagos");
      return ((data ?? []) as Row[]).map((r): AdminPayment => ({
        reference: r.reference as string, provider: r.provider as PaymentProvider, amount: r.amount as number, status: r.status as PaymentStatus,
        detail: (r.detail as string | null) ?? null, providerRef: (r.provider_ref as string | null) ?? null,
        createdAt: r.created_at as string, approvedAt: (r.approved_at as string | null) ?? null,
        courseTitle: r.course_title as string, student: r.student as string, payer: (r.payer as string | null) ?? null,
      }));
    },

    async adminUsers(adminId, query) {
      const { data, error } = await db.rpc("admin_users", { p_admin: adminId, p_query: query });
      if (error) fail(error, "personas");
      return ((data ?? []) as Record<string, unknown>[]).map((u): AdminUser => ({
        id: u.id as string, email: u.email as string, name: u.name as string, role: u.role as AdminUser["role"], xp: u.xp as number,
        createdAt: u.created_at as string, lastSignInAt: (u.last_sign_in_at as string | null) ?? null,
        access: ((u.access ?? []) as { course: string; source: string; expires_at: string | null }[]).map((a) => ({ course: a.course, source: a.source, expiresAt: a.expires_at })),
      }));
    },

    async adminSetRole(adminId, userId, role) {
      const { error } = await db.rpc("admin_set_role", { p_admin: adminId, p_user: userId, p_role: role });
      if (error) fail(error, "rol");
    },

    async adminSetPassword(adminId, userId, password) {
      const { data: rows, error: e1 } = await db.from("profiles").select("id,role,is_admin").in("id", [adminId, userId]);
      if (e1) fail(e1, "contraseña");
      const admin = rows?.find((r) => r.id === adminId);
      const target = rows?.find((r) => r.id === userId);
      if (!admin?.is_admin) throw new Error("solo_admin");
      if (!target || target.is_admin || (target.role !== "estudiante" && target.role !== "familia")) throw new Error("no_permitido");
      const { error } = await db.auth.admin.updateUserById(userId, { password });
      if (error) fail(error, "contraseña");
    },

    async adminGrantAccess(adminId, userId, course, expiresAt) {
      const { error } = await db.rpc("admin_grant_access", { p_admin: adminId, p_user: userId, p_course: course, p_expires: expiresAt });
      if (error) fail(error, "acceso");
    },

    async adminRevokeAccess(adminId, userId, course) {
      const { error } = await db.rpc("admin_revoke_access", { p_admin: adminId, p_user: userId, p_course: course });
      if (error) fail(error, "acceso");
    },

    async adminSetPrice(adminId, course, price) {
      const { error } = await db.rpc("admin_set_price", { p_admin: adminId, p_course: course, p_price: price });
      if (error) fail(error, "precio");
    },

    async adminDeleteCourse(adminId, slug) {
      const { data, error } = await db.rpc("admin_preparar_eliminar_curso", { p_admin: adminId, p_course: slug });
      if (error) fail(error, "eliminar curso");
      // Los pagos ya quedaron en la copia contable (payments_archive).
      const { error: e1 } = await db.from("payments").delete().eq("course_slug", slug);
      if (e1) fail(e1, "eliminar curso");
      const { error: e2 } = await db.from("courses").delete().eq("slug", slug);
      if (e2) fail(e2, "eliminar curso");
      const r = data as Row;
      return { title: r.title as string, students: r.students as number, payments: r.payments as number, groups: r.groups as number };
    },

    async adminDeleteClass(adminId, classId) {
      const { data, error } = await db.rpc("admin_preparar_eliminar_grupo", { p_admin: adminId, p_class: classId });
      if (error) fail(error, "eliminar grupo");
      const { error: e1 } = await db.from("classes").delete().eq("id", classId);
      if (e1) fail(e1, "eliminar grupo");
      const r = data as Row;
      return { name: r.name as string, members: r.members as number };
    },

    async adminDeleteUser(adminId, userId) {
      const { data, error } = await db.rpc("admin_preparar_eliminar_cuenta", { p_admin: adminId, p_user: userId });
      if (error) fail(error, "eliminar cuenta");
      // Borrar la cuenta de acceso borra en cascada su perfil, su avance, sus grupos y sus vínculos.
      const { error: e1 } = await db.auth.admin.deleteUser(userId);
      if (e1) fail(e1, "eliminar cuenta");
      const r = data as Row;
      return { name: r.name as string, role: r.role as string };
    },

    async adminClasses(adminId) {
      const { data, error } = await db.rpc("admin_classes", { p_admin: adminId });
      if (error) fail(error, "clases");
      return ((data ?? []) as Record<string, unknown>[]).map((c): AdminClass => ({
        id: c.id as string, name: c.name as string, code: c.code as string, archived: c.archived as boolean, teacher: c.teacher as string, members: c.members as number,
        teacherId: c.teacher_id as string, courseSlug: (c.course_slug as string | null) ?? null, courseTitle: (c.course_title as string | null) ?? null,
      }));
    },

    async adminCreateClass(adminId, course, name, teacherId) {
      const { data, error } = await db.rpc("admin_create_class", { p_admin: adminId, p_course: course, p_name: name, p_teacher: teacherId });
      if (error) fail(error, "crear grupo");
      const r = data as { id: string; code: string };
      return { id: r.id, code: r.code };
    },

    async adminAssignTeacher(adminId, classId, teacherId) {
      const { error } = await db.rpc("admin_assign_teacher", { p_admin: adminId, p_class: classId, p_teacher: teacherId });
      if (error) fail(error, "asignar docente");
    },

    async createTeacherAccount(email, name, password) {
      // app_metadata solo lo escribe el servidor: así la base de datos sabe que es una cuenta de docente.
      const { data, error } = await db.auth.admin.createUser({
        email, password, email_confirm: true, app_metadata: { role: "docente" }, user_metadata: { display_name: name },
      });
      if (error) fail(error, "crear docente");
      return { id: data.user.id };
    },

    async createStudentAccount(email, name, password, avatar) {
      // Sin app_metadata.role: la base de datos la crea como estudiante. El consentimiento lo da la institución.
      const { data, error } = await db.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { display_name: name, role: "estudiante", avatar },
      });
      if (error) fail(error, "crear estudiante");
      return { id: data.user.id };
    },

    // ===== Constancias =====
    async getIssuerSettings() {
      const { data, error } = await db.from("platform_settings").select("*").eq("id", true).maybeSingle();
      if (error) fail(error, "configuración");
      return {
        issuerName: data?.issuer_name ?? null, issuerTitle: data?.issuer_title ?? null, issuerDoc: data?.issuer_doc ?? null,
        city: data?.city ?? null, signaturePng: data?.signature_png ?? null,
      };
    },

    async saveIssuerSettings(input) {
      const { error } = await db.from("platform_settings").upsert({
        id: true, issuer_name: input.issuerName, issuer_title: input.issuerTitle, issuer_doc: input.issuerDoc,
        city: input.city, signature_png: input.signaturePng, updated_at: new Date().toISOString(),
      });
      if (error) fail(error, "guardar configuración");
    },

    async issueCertificate(userId, course, name, docType, docNumber) {
      const { data, error } = await db.rpc("issue_certificate", { p_user: userId, p_course: course, p_name: name, p_doc_type: docType, p_doc_number: docNumber });
      if (error) fail(error, "constancia");
      const r = data as { code: string; new: boolean };
      return { code: r.code, isNew: r.new };
    },

    async getCertificate(code) {
      const { data, error } = await db.from("certificates").select("*").eq("code", code).maybeSingle();
      if (error) fail(error, "constancia");
      return data ? certificate(data) : null;
    },

    async listCertificates({ userId, limit = 100 }) {
      let q = db.from("certificates").select("*").order("number", { ascending: false }).limit(limit);
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q;
      if (error) fail(error, "constancias");
      return (data ?? []).map(certificate);
    },

    // ===== Editor de contenido =====
    async listAllCourses() {
      const { data, error } = await db.from("courses").select("*, missions(count)").order("position");
      if (error) fail(error, "portales");
      return (data ?? []).map((r): CourseListItem => ({
        ...course(r), published: r.published as boolean, missionCount: (r.missions as { count: number }[] | null)?.[0]?.count ?? 0,
      }));
    },

    async getCourseForEdit(slug) {
      const { data: c, error } = await db.from("courses").select("*").eq("slug", slug).maybeSingle();
      if (error) fail(error, "portal");
      if (!c) return null;
      const [{ data: ms, error: e2 }, { data: mods, error: e5 }] = await Promise.all([
        db.from("missions").select("*").eq("course_slug", slug).order("position"),
        db.from("modules").select("*").eq("course_slug", slug).order("position"),
      ]);
      if (e2) fail(e2, "lecciones");
      if (e5) fail(e5, "módulos");
      const ids = (ms ?? []).map((m) => m.id as string);
      const [{ data: qs, error: e3 }, { data: prog, error: e4 }] = await Promise.all([
        ids.length ? db.from("questions").select("*").in("mission_id", ids).order("position") : Promise.resolve({ data: [], error: null }),
        ids.length ? db.from("mission_progress").select("mission_id").in("mission_id", ids).limit(1000) : Promise.resolve({ data: [], error: null }),
      ]);
      if (e3) fail(e3, "preguntas");
      if (e4) fail(e4, "avance");
      const withProgress = new Set((prog ?? []).map((p) => p.mission_id as string));
      const out: EditableCourse = {
        ...course(c), published: c.published as boolean, modules: (mods ?? []).map(moduleOf),
        missions: (ms ?? []).map((m) => ({
          ...mission(m), hasProgress: withProgress.has(m.id as string),
          questions: (qs ?? []).filter((q) => q.mission_id === m.id).map((q): EditableQuestion => ({
            id: q.id, position: q.position, prompt: q.prompt, kind: asKind(q.kind), options: q.options as string[], correctIndex: q.correct_index,
            right: ((q.data ?? {}) as { right?: string[] }).right ?? [], hint: q.hint, explanation: q.explanation,
          })),
        })),
      };
      return out;
    },

    async importCourse(slug, plan) {
      const { data: last } = await db.from("courses").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
      const { error } = await db.from("courses").insert({
        slug, ...courseRow(plan.course), price_cop: plan.price, is_free: plan.isFree,
        position: ((last?.position as number | undefined) ?? 0) + 1, published: false,
      });
      if (error) fail(error, "importar curso");
      try {
        const modIds = new Map<number, string>();
        if (plan.modules.length) {
          const { data: mods, error: e1 } = await db.from("modules")
            .insert(plan.modules.map((m, i) => ({ course_slug: slug, position: i + 1, title: m.title, summary: m.summary, guardian: m.guardian })))
            .select("id,position");
          if (e1) fail(e1, "importar módulos");
          for (const r of mods ?? []) modIds.set(plan.modules[(r.position as number) - 1].number, r.id as string);
        }
        const { data: ms, error: e2 } = await db.from("missions").insert(plan.lessons.map((l, i) => ({
          course_slug: slug, position: i + 1, title: l.mission.title, intro: l.mission.intro, xp_reward: l.mission.xpReward, is_boss: l.mission.isBoss,
          period: l.mission.period, module_id: l.moduleNumber === null ? null : modIds.get(l.moduleNumber) ?? null,
          kind: l.mission.lessonKind, body: l.mission.body, video_url: l.mission.videoUrl,
        }))).select("id,position");
        if (e2) fail(e2, "importar lecciones");
        const missionId = new Map((ms ?? []).map((r) => [r.position as number, r.id as string]));
        const rows = plan.lessons.flatMap((l, i) => l.activities.map((q, j) => ({
          mission_id: missionId.get(i + 1), position: j + 1,
          prompt: q.prompt, kind: q.kind, options: q.options, correct_index: q.correctIndex, data: q.data, hint: q.hint, explanation: q.explanation,
        })));
        for (let k = 0; k < rows.length; k += 500) {
          const { error: e3 } = await db.from("questions").insert(rows.slice(k, k + 500));
          if (e3) fail(e3, "importar actividades");
        }
      } catch (e) {
        // Sin avance ni pagos todavía: se puede quitar el borrador completo.
        await db.from("courses").delete().eq("slug", slug);
        throw e;
      }
    },

    async createCourse(slug, input) {
      const { data: last } = await db.from("courses").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
      const { error } = await db.from("courses").insert({ slug, ...courseRow(input), position: ((last?.position as number | undefined) ?? 0) + 1, published: false });
      if (error) fail(error, "crear portal");
    },

    async updateCourse(slug, input) {
      const { error } = await db.from("courses").update(courseRow(input)).eq("slug", slug);
      if (error) fail(error, "guardar portal");
    },

    async setCourseFree(slug, free) {
      const { error } = await db.from("courses").update({ is_free: free, updated_at: new Date().toISOString() }).eq("slug", slug);
      if (error) fail(error, "gratis");
    },

    async createModule(courseSlug, input) {
      const { data: last } = await db.from("modules").select("position").eq("course_slug", courseSlug).order("position", { ascending: false }).limit(1).maybeSingle();
      const { data, error } = await db.from("modules").insert({
        course_slug: courseSlug, position: ((last?.position as number | undefined) ?? 0) + 1, title: input.title, summary: input.summary, guardian: input.guardian,
      }).select("id").single();
      if (error) fail(error, "crear módulo");
      return { id: data.id as string };
    },

    async updateModule(moduleId, input) {
      const { error } = await db.from("modules").update({ title: input.title, summary: input.summary, guardian: input.guardian }).eq("id", moduleId);
      if (error) fail(error, "guardar módulo");
    },

    async deleteModule(moduleId) {
      const { count, error: e1 } = await db.from("missions").select("id", { count: "exact", head: true }).eq("module_id", moduleId);
      if (e1) fail(e1, "módulo");
      if ((count ?? 0) > 0) throw new Error("modulo_con_lecciones");
      const { error } = await db.from("modules").delete().eq("id", moduleId);
      if (error) fail(error, "borrar módulo");
    },

    async moveModule(moduleId, direction) {
      const { data: m } = await db.from("modules").select("id,course_slug,position").eq("id", moduleId).maybeSingle();
      if (!m) throw new Error("modulo_no_encontrado");
      const q = db.from("modules").select("id,position").eq("course_slug", m.course_slug);
      const { data: other } = await (direction < 0 ? q.lt("position", m.position).order("position", { ascending: false }) : q.gt("position", m.position).order("position")).limit(1).maybeSingle();
      if (!other) return;
      await db.from("modules").update({ position: other.position }).eq("id", m.id);
      await db.from("modules").update({ position: m.position }).eq("id", other.id);
      const { error } = await db.rpc("renumber_course", { p_course: m.course_slug });
      if (error) fail(error, "mover módulo");
    },

    async setCoursePublished(slug, published) {
      const { error } = await db.from("courses").update({ published, updated_at: new Date().toISOString() }).eq("slug", slug);
      if (error) fail(error, "publicar");
    },

    async createMission(courseSlug, input) {
      const { data: last } = await db.from("missions").select("position").eq("course_slug", courseSlug).order("position", { ascending: false }).limit(1).maybeSingle();
      const { data, error } = await db.from("missions").insert({
        course_slug: courseSlug, position: ((last?.position as number | undefined) ?? 0) + 1,
        title: input.title, intro: input.intro, xp_reward: input.xpReward, is_boss: input.isBoss, period: input.period, module_id: input.moduleId,
        kind: input.lessonKind, body: input.body, video_url: input.videoUrl,
      }).select("id").single();
      if (error) fail(error, "crear lección");
      // Queda al final de su módulo.
      if (input.moduleId) {
        const { error: e2 } = await db.rpc("renumber_course", { p_course: courseSlug });
        if (e2) fail(e2, "ordenar lecciones");
      }
      return { id: data.id as string };
    },

    async updateMission(missionId, input) {
      const { data: before } = await db.from("missions").select("course_slug,module_id").eq("id", missionId).maybeSingle();
      const { error } = await db.from("missions").update({
        title: input.title, intro: input.intro, xp_reward: input.xpReward, is_boss: input.isBoss, period: input.period, module_id: input.moduleId,
        kind: input.lessonKind, body: input.body, video_url: input.videoUrl,
      }).eq("id", missionId);
      if (error) fail(error, "guardar lección");
      // Si cambió de módulo, se reordena el curso.
      if (before && before.module_id !== input.moduleId) {
        const { error: e2 } = await db.rpc("renumber_course", { p_course: before.course_slug });
        if (e2) fail(e2, "ordenar lecciones");
      }
    },

    async deleteMission(missionId) {
      const { count, error: e1 } = await db.from("mission_progress").select("mission_id", { count: "exact", head: true }).eq("mission_id", missionId);
      if (e1) fail(e1, "lección");
      if ((count ?? 0) > 0) throw new Error("tiene_avance");
      const { error } = await db.from("missions").delete().eq("id", missionId);
      if (error) fail(error, "borrar lección");
    },

    async moveMission(missionId, direction) {
      const { data: m } = await db.from("missions").select("id,course_slug,position,module_id").eq("id", missionId).maybeSingle();
      if (!m) throw new Error("leccion_no_encontrada");
      // Con módulos, una lección solo se mueve dentro de su módulo.
      const base = db.from("missions").select("id,position").eq("course_slug", m.course_slug);
      const q = m.module_id ? base.eq("module_id", m.module_id) : base;
      const { data: other } = await (direction < 0 ? q.lt("position", m.position).order("position", { ascending: false }) : q.gt("position", m.position).order("position")).limit(1).maybeSingle();
      if (!other) return;
      // Intercambio en tres pasos para no chocar con la regla de posiciones únicas.
      await db.from("missions").update({ position: -1 }).eq("id", m.id);
      await db.from("missions").update({ position: m.position }).eq("id", other.id);
      const { error } = await db.from("missions").update({ position: other.position }).eq("id", m.id);
      if (error) fail(error, "mover lección");
    },

    async createQuestion(missionId, input) {
      const { data: last } = await db.from("questions").select("position").eq("mission_id", missionId).order("position", { ascending: false }).limit(1).maybeSingle();
      const { data, error } = await db.from("questions").insert({
        mission_id: missionId, position: ((last?.position as number | undefined) ?? 0) + 1,
        prompt: input.prompt, kind: input.kind, options: input.options, correct_index: input.correctIndex, data: input.data, hint: input.hint, explanation: input.explanation,
      }).select("id").single();
      if (error) fail(error, "crear pregunta");
      return { id: data.id as string };
    },

    async updateQuestion(questionId, input) {
      const { error } = await db.from("questions").update({
        prompt: input.prompt, kind: input.kind, options: input.options, correct_index: input.correctIndex, data: input.data, hint: input.hint, explanation: input.explanation,
      }).eq("id", questionId);
      if (error) fail(error, "guardar pregunta");
    },

    async deleteQuestion(questionId) {
      const { error } = await db.from("questions").delete().eq("id", questionId);
      if (error) fail(error, "borrar pregunta");
    },

    async moveQuestion(questionId, direction) {
      const { data: x } = await db.from("questions").select("id,mission_id,position").eq("id", questionId).maybeSingle();
      if (!x) throw new Error("pregunta_no_encontrada");
      const q = db.from("questions").select("id,position").eq("mission_id", x.mission_id);
      const { data: other } = await (direction < 0 ? q.lt("position", x.position).order("position", { ascending: false }) : q.gt("position", x.position).order("position")).limit(1).maybeSingle();
      if (!other) return;
      await db.from("questions").update({ position: -1 }).eq("id", x.id);
      await db.from("questions").update({ position: x.position }).eq("id", other.id);
      const { error } = await db.from("questions").update({ position: other.position }).eq("id", x.id);
      if (error) fail(error, "mover pregunta");
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
