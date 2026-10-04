import "server-only";
import { sanitizeLook } from "@/lib/avatar-look";
import { todayBogota } from "@/lib/game/aids";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdminClass, AdminUser, Certificate, DocType, CourseInput, CourseListItem, EditableCourse, EditableQuestion, AidResult, AidUseRow, AnswerKeyRow, AnswerResult, ClassReport, ClassSummary, FamilyChild, FamilyMessage, FinishResult, LinkedFamily, AvatarBase, Course, CourseDetail, InventoryRow, MissionPlay, MissionSummary,
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
      const { data: ms, error: e2 } = await db.from("missions").select("*").eq("course_slug", slug).order("position");
      if (e2) fail(e2, "misiones");
      const detail: CourseDetail = { ...course(c), missions: (ms ?? []).map(mission) };
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
      const { data, error: e3 } = await db.from("course_access").select("course_slug,expires_at").eq("user_id", userId).is("revoked_at", null);
      if (e3) fail(e3, "acceso");
      const now = Date.now();
      return new Set((data ?? []).filter((a) => !a.expires_at || new Date(a.expires_at).getTime() > now).map((a) => a.course_slug as string));
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
      const { data: ms, error: e2 } = await db.from("missions").select("*").eq("course_slug", slug).order("position");
      if (e2) fail(e2, "lecciones");
      const ids = (ms ?? []).map((m) => m.id as string);
      const [{ data: qs, error: e3 }, { data: prog, error: e4 }] = await Promise.all([
        ids.length ? db.from("questions").select("*").in("mission_id", ids).order("position") : Promise.resolve({ data: [], error: null }),
        ids.length ? db.from("mission_progress").select("mission_id").in("mission_id", ids).limit(1000) : Promise.resolve({ data: [], error: null }),
      ]);
      if (e3) fail(e3, "preguntas");
      if (e4) fail(e4, "avance");
      const withProgress = new Set((prog ?? []).map((p) => p.mission_id as string));
      const out: EditableCourse = {
        ...course(c), published: c.published as boolean,
        missions: (ms ?? []).map((m) => ({
          ...mission(m), hasProgress: withProgress.has(m.id as string),
          questions: (qs ?? []).filter((q) => q.mission_id === m.id).map((q): EditableQuestion => ({
            id: q.id, position: q.position, prompt: q.prompt, options: q.options as string[], correctIndex: q.correct_index, hint: q.hint, explanation: q.explanation,
          })),
        })),
      };
      return out;
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

    async setCoursePublished(slug, published) {
      const { error } = await db.from("courses").update({ published, updated_at: new Date().toISOString() }).eq("slug", slug);
      if (error) fail(error, "publicar");
    },

    async createMission(courseSlug, input) {
      const { data: last } = await db.from("missions").select("position").eq("course_slug", courseSlug).order("position", { ascending: false }).limit(1).maybeSingle();
      const { data, error } = await db.from("missions").insert({
        course_slug: courseSlug, position: ((last?.position as number | undefined) ?? 0) + 1,
        title: input.title, intro: input.intro, xp_reward: input.xpReward, is_boss: input.isBoss, period: input.period,
      }).select("id").single();
      if (error) fail(error, "crear lección");
      return { id: data.id as string };
    },

    async updateMission(missionId, input) {
      const { error } = await db.from("missions").update({ title: input.title, intro: input.intro, xp_reward: input.xpReward, is_boss: input.isBoss, period: input.period }).eq("id", missionId);
      if (error) fail(error, "guardar lección");
    },

    async deleteMission(missionId) {
      const { count, error: e1 } = await db.from("mission_progress").select("mission_id", { count: "exact", head: true }).eq("mission_id", missionId);
      if (e1) fail(e1, "lección");
      if ((count ?? 0) > 0) throw new Error("tiene_avance");
      const { error } = await db.from("missions").delete().eq("id", missionId);
      if (error) fail(error, "borrar lección");
    },

    async moveMission(missionId, direction) {
      const { data: m } = await db.from("missions").select("id,course_slug,position").eq("id", missionId).maybeSingle();
      if (!m) throw new Error("leccion_no_encontrada");
      const q = db.from("missions").select("id,position").eq("course_slug", m.course_slug);
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
        prompt: input.prompt, options: input.options, correct_index: input.correctIndex, hint: input.hint, explanation: input.explanation,
      }).select("id").single();
      if (error) fail(error, "crear pregunta");
      return { id: data.id as string };
    },

    async updateQuestion(questionId, input) {
      const { error } = await db.from("questions").update({
        prompt: input.prompt, options: input.options, correct_index: input.correctIndex, hint: input.hint, explanation: input.explanation,
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
