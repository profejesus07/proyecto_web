import intento from "@/content/portal-del-primer-intento.json";
import primer from "@/content/primer-portal.json";
import { todayBogota } from "@/lib/game/aids";
import { rankForXp } from "@/lib/game/ranks";
import type { AvatarLook } from "@/lib/avatar-look";
import type {
  AdminUser, AidUseRow, AnswerKeyRow, Certificate, IssuerSettings, CourseInput, EditableCourse, AnswerResult, ClassReport, ClassStudent, FamilyChild, FinishResult, AvatarBase, CompleteResult, Course, CourseDetail, InventoryRow, MissionPlay, MissionSummary,
  Profile, ProgressRow, Repo,
} from "./types";

/**
 * Repositorio en memoria SOLO para la vista previa local (UMBRAL_PREVIEW=1).
 * Replica de forma sencilla las reglas de supabase/migrations/0003_game_functions.sql;
 * las reglas reales están probadas contra esa base de datos en tests/game.test.ts.
 */
export const PREVIEW_USER_ID = "00000000-0000-0000-0000-00000000aaaa";
/** Docente de prueba (en la vista previa se entra como docente con la cookie «umbral-vista=docente»). */
export const PREVIEW_TEACHER_ID = "00000000-0000-0000-0000-00000000bbbb";
const TEACHER: Profile = {
  id: PREVIEW_TEACHER_ID, role: "docente", displayName: "Profe de prueba", avatarBase: "leo", avatarLook: {}, xp: 0, coins: 0, gems: 0, streak: 0, introSeen: true, chroniclesRead: [],
};

/** Administrador de prueba (cookie «umbral-vista=admin»). */
export const PREVIEW_ADMIN_ID = "00000000-0000-0000-0000-00000000cccc";
const ADMIN: Profile = { ...TEACHER, id: PREVIEW_ADMIN_ID, role: "admin", displayName: "Admin de prueba" };
/** Familia de prueba (cookie «umbral-vista=familia»). */
export const PREVIEW_FAMILY_ID = "00000000-0000-0000-0000-00000000dddd";
const FAMILY: Profile = { ...TEACHER, id: PREVIEW_FAMILY_ID, role: "familia", displayName: "Familia de prueba", avatarBase: "nuri" };
const STAFF = new Set([PREVIEW_TEACHER_ID, PREVIEW_ADMIN_ID]);

interface PreviewClass { id: string; name: string; code: string; teacherId: string; archived: boolean; createdAt: string; courseSlug: string | null }

// Estudiantes de ejemplo que se suman a cada clase de la vista previa, para que el informe no salga vacío.
const done = (id: string, bestScore: number, attempts = 1): ProgressRow => ({ missionId: id, bestScore, attempts, completed: bestScore >= 70 });
const DEMO_STUDENTS: ClassStudent[] = [
  { id: "demo-1", name: "Valentina (demo)", avatar: "nuri", avatarLook: { hair: 8, style: 9, top: 6 }, xp: 340, streak: 4, lastActive: null, joinedAt: "", progress: [done("m1", 100), done("m2", 100), done("m3", 75, 2), done("m4", 83)] },
  { id: "demo-2", name: "Samuel (demo)", avatar: "tomas", avatarLook: { style: 2, hair: 3 }, xp: 120, streak: 1, lastActive: null, joinedAt: "", progress: [done("m1", 75), done("m2", 75, 3), done("m3", 50, 2)] },
  { id: "demo-3", name: "Mariana (demo)", avatar: "aria", avatarLook: {}, xp: 0, streak: 0, lastActive: null, joinedAt: "", progress: [] },
];
// Aciertos de ejemplo por pregunta: [misión, posición, respondidas, acertadas].
const DEMO_QUESTIONS: [string, number, number, number][] = [
  ["m1", 1, 3, 3], ["m1", 2, 3, 2], ["m1", 3, 3, 3], ["m1", 4, 3, 2],
  ["m2", 1, 5, 2], ["m2", 2, 5, 4], ["m2", 3, 5, 5], ["m2", 4, 5, 3],
  ["m3", 1, 4, 1], ["m3", 2, 4, 3], ["m3", 3, 4, 4], ["m3", 4, 4, 2],
];

interface State {
  profile: Profile;
  progress: Map<string, ProgressRow>;
  bosses: Set<string>;
  inventory: InventoryRow[];
  consumables: Map<string, number>;
  attempts: Map<string, number[]>;
  aidUses: (AidUseRow & { day: string })[];
  classes: PreviewClass[];
  members: { classId: string; studentId: string; joinedAt: string }[];
  /** Cursos con acceso completo del estudiante de prueba (el primero viene «pagado» para poder probarlo entero). */
  access: Set<string>;
  /** Cursos cuyo acceso llegó por el código de un grupo: curso → grupo. */
  viaClass: Map<string, string>;
  settings: IssuerSettings;
  certificates: Certificate[];
  prices: Map<string, number | null>;
  extraTeachers: AdminUser[];
  familyCode: string | null;
  /** La familia de prueba está vinculada al estudiante de prueba desde esta fecha. */
  familySince: string | null;
  familyMessages: { id: string; message: string; createdAt: string; read: boolean }[];
  /** Aspecto guardado por el docente, el admin y la familia de prueba (su Maestro o Guardián). */
  adultLooks: Record<string, AvatarLook>;
}

const g = globalThis as unknown as { __umbralPreview?: State };

function state(): State {
  if (!g.__umbralPreview) {
    g.__umbralPreview = {
      profile: { id: PREVIEW_USER_ID, role: "estudiante", displayName: "Despertado", avatarBase: "aria", avatarLook: {}, xp: 0, coins: 40, gems: 0, streak: 1, introSeen: false, chroniclesRead: [] },
      progress: new Map(),
      bosses: new Set(),
      inventory: [],
      consumables: new Map(),
      attempts: new Map(),
      aidUses: [],
      classes: [],
      members: [],
      access: new Set(["primer-portal"]),
      viaClass: new Map(),
      settings: { issuerName: null, issuerTitle: null, issuerDoc: null, city: null, signaturePng: null },
      certificates: [],
      prices: new Map([["primer-portal", 20000], ["portal-del-primer-intento", 25000]]),
      extraTeachers: [],
      familyCode: null,
      familySince: null,
      familyMessages: [],
      adultLooks: {},
    };
  }
  return g.__umbralPreview;
}

type Seed = typeof primer;
// Ids de la vista previa: el primer portal usa m1..m4 y los siguientes c2m1.., c3m1..
const SEEDS: { seed: Seed; prefix: string }[] = [{ seed: primer, prefix: "m" }, { seed: intento as Seed, prefix: "c2m" }];
interface QRow { id: string; prompt: string; options: string[]; correct_index: number; hint: string; explanation: string }
/** Contenido editable de la vista previa (empieza con los cursos de ejemplo). */
interface Content { courses: (Course & { published: boolean })[]; missions: MissionSummary[]; questions: Map<string, QRow[]>; seq: number }
const gc = globalThis as unknown as { __umbralContent?: Content };
function C(): Content {
  if (!gc.__umbralContent) {
    const blank = { kind: "curso" as const, area: null, grade: null, schoolYear: null, accessUntil: null, hours: null, trainerName: null, trainerTitle: null };
    const questions = new Map<string, QRow[]>();
    const missions: MissionSummary[] = SEEDS.flatMap(({ seed, prefix }) => seed.missions.map((m) => {
      const id = `${prefix}${m.position}`;
      questions.set(id, m.questions.map((q, i) => ({ id: `${id}q${i + 1}`, ...q })));
      return { id, courseSlug: seed.course.slug, position: m.position, title: m.title, intro: m.intro, xpReward: m.xp_reward, isBoss: m.is_boss, period: null };
    }));
    gc.__umbralContent = {
      courses: SEEDS.map(({ seed }) => ({ ...(seed.course as Omit<Course, "price" | keyof typeof blank>), ...blank, price: null, published: true })),
      missions, questions, seq: 1,
    };
  }
  return gc.__umbralContent;
}
const questions = (id: string) => C().questions.get(id) ?? [];
const courseOf = (slug: string) => C().courses.find((c) => c.slug === slug)!;
const plain = (c: Course & { published: boolean }): Course => {
  const out: Course & { published?: boolean } = { ...c };
  delete out.published;
  return out;
};
const withPrice = (c: Course & { published?: boolean }): Course => ({ ...plain({ published: true, ...c }), price: state().prices.get(c.slug) ?? null });
function hasAccess(userId: string, slug: string): boolean {
  const s = state();
  return STAFF.has(userId) || s.profile.role === "docente" || s.profile.role === "admin" || s.access.has(slug);
}
/** Misma regla que public.mission_is_locked: misiones en orden dentro del curso; la primera gratis, el resto con acceso. */
function isLocked(s: State, m: MissionSummary, userId: string): boolean {
  if (C().missions.some((p) => p.courseSlug === m.courseSlug && p.position < m.position && !s.progress.get(p.id)?.completed)) return true;
  if (m.position > 1 && !hasAccess(userId, m.courseSlug)) throw new Error("requiere_suscripcion");
  return false;
}

function previewCode(): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => abc[Math.floor(Math.random() * abc.length)]).join("");
}

/** Misma lógica que public.complete_mission (0003/0006). */
function complete(_u: string, id: string, score: number, passMark: number, items: string[]): CompleteResult {
  const s = state();
  const m = C().missions.find((x) => x.id === id);
  if (!m) throw new Error("mision_no_encontrada");
  if (isLocked(s, m, _u)) throw new Error("mision_bloqueada");
  const passed = score >= passMark;
  const prev = s.progress.get(id);
  const first = passed && !prev?.completed;
  s.progress.set(id, { missionId: id, bestScore: Math.max(prev?.bestScore ?? 0, score), attempts: (prev?.attempts ?? 0) + 1, completed: passed || !!prev?.completed });
  const xpGain = first ? m.xpReward : 0;
  const coinsGain = first ? 10 + (score === 100 ? 10 : 0) + (m.isBoss ? 100 : 0) : 0;
  const gemsGain = first && m.isBoss ? 5 : 0;
  const granted: string[] = [];
  if (first) {
    if (m.isBoss) s.bosses.add(m.courseSlug);
    for (const it of items) if (!s.inventory.some((i) => i.itemId === it)) { s.inventory.push({ itemId: it, source: "logro", acquiredAt: new Date().toISOString() }); granted.push(it); }
  }
  s.profile = { ...s.profile, xp: s.profile.xp + xpGain, coins: s.profile.coins + coinsGain, gems: s.profile.gems + gemsGain };
  const courseDone = C().missions.filter((x) => x.courseSlug === m.courseSlug).every((x) => s.progress.get(x.id)?.completed);
  return { passed, first, score, xpGain, coinsGain, gemsGain, xp: s.profile.xp, coins: s.profile.coins, gems: s.profile.gems, streak: s.profile.streak, bossDefeated: first && m.isBoss, courseDone, granted };
}

export function createMemoryRepo(): Repo {
  return {
    async getProfile(id) {
      const adult = id === PREVIEW_TEACHER_ID ? TEACHER : id === PREVIEW_ADMIN_ID ? ADMIN : id === PREVIEW_FAMILY_ID ? FAMILY : null;
      return adult ? { ...adult, avatarLook: state().adultLooks[id] ?? adult.avatarLook } : { ...state().profile };
    },
    async listCourses() { return C().courses.filter((c) => c.published).map(withPrice); },
    async getCourse(slug): Promise<CourseDetail | null> {
      const c = C().courses.find((x) => x.slug === slug && x.published);
      return c ? { ...withPrice(c), missions: C().missions.filter((m) => m.courseSlug === slug).sort((a, b) => a.position - b.position) } : null;
    },
    async getProgress() { return [...state().progress.values()]; },
    async getBossDefeats() { return [...state().bosses]; },
    async getInventory() { return [...state().inventory]; },
    async getMissionPlay(id): Promise<MissionPlay | null> {
      const mission = C().missions.find((m) => m.id === id);
      if (!mission) return null;
      if (!courseOf(mission.courseSlug).published) return null;
      return { mission, course: withPrice(courseOf(mission.courseSlug)), questions: questions(id).map((q, i) => ({ id: q.id, position: i + 1, prompt: q.prompt, options: q.options, hasHint: q.hint.trim() !== "" })) };
    },
    async getAnswerKey(id): Promise<AnswerKeyRow[]> {
      return questions(id).map((q) => ({ id: q.id, correctIndex: q.correct_index, explanation: q.explanation }));
    },
    async getOpenAttempt(_u, id) {
      const a = state().attempts.get(id);
      return a ? [...a] : null;
    },
    async answerQuestion(_u, id, index, choice): Promise<AnswerResult> {
      const s = state();
      const m = C().missions.find((x) => x.id === id);
      if (!m) throw new Error("mision_no_encontrada");
      if (isLocked(s, m, _u)) throw new Error("mision_bloqueada");
      const qs = questions(id);
      if (!Number.isInteger(index) || index < 0 || index >= qs.length) throw new Error("pregunta_invalida");
      if (!Number.isInteger(choice) || choice < 0 || choice >= qs[index].options.length) throw new Error("respuesta_invalida");
      let a = s.attempts.get(id);
      if (!a || a.length !== qs.length) s.attempts.set(id, (a = Array(qs.length).fill(-1)));
      if (a[index] === -1) a[index] = choice;
      const q = qs[index];
      return {
        index, choice: a[index], correct: a[index] === q.correct_index, correctIndex: q.correct_index, explanation: q.explanation,
        answered: a.filter((x) => x >= 0).length, right: a.filter((x, i) => x === qs[i].correct_index).length, total: qs.length,
      };
    },
    async finishAttempt(u, id, passMark, items): Promise<FinishResult> {
      const s = state();
      const a = s.attempts.get(id);
      if (!a) throw new Error("sin_intento");
      const qs = questions(id);
      if (a.length !== qs.length || a.includes(-1)) throw new Error("respuestas_incompletas");
      const score = Math.round((100 * a.filter((x, i) => x === qs[i].correct_index).length) / qs.length);
      s.attempts.delete(id);
      return { ...complete(u, id, score, passMark, items), answers: a };
    },
    async purchaseItem(_u, itemId, price) {
      const s = state();
      if (s.inventory.some((i) => i.itemId === itemId)) throw new Error("ya_lo_tienes");
      if (s.profile.coins < price) throw new Error("monedas_insuficientes");
      s.profile = { ...s.profile, coins: s.profile.coins - price };
      s.inventory.push({ itemId, source: "tienda", acquiredAt: new Date().toISOString() });
      return { coins: s.profile.coins };
    },
    async setAvatar(userId, base: AvatarBase, look = {}) {
      if (userId === PREVIEW_TEACHER_ID || userId === PREVIEW_ADMIN_ID || userId === PREVIEW_FAMILY_ID) state().adultLooks[userId] = look;
      else state().profile = { ...state().profile, avatarBase: base, avatarLook: look };
    },
    async setDisplayName(_u, name: string) { state().profile = { ...state().profile, displayName: name }; },
    async listTeacherClasses(teacherId) {
      const s = state();
      return s.classes.filter((c) => c.teacherId === teacherId).map((c) => ({
        id: c.id, name: c.name, code: c.code, archived: c.archived, createdAt: c.createdAt, members: s.members.filter((m) => m.classId === c.id).length,
        courseSlug: c.courseSlug, courseTitle: c.courseSlug ? C().courses.find((x) => x.slug === c.courseSlug)?.title ?? null : null,
      }));
    },
    async createClass(teacherId, name) {
      if (!STAFF.has(teacherId)) throw new Error("solo_docentes");
      const n = name.trim();
      if (n.length < 2 || n.length > 60) throw new Error("nombre_invalido");
      const s = state();
      const c: PreviewClass = { id: `clase-${s.classes.length + 1}`, name: n, code: previewCode(), teacherId, archived: false, createdAt: new Date().toISOString(), courseSlug: null };
      s.classes.push(c);
      for (const d of DEMO_STUDENTS) s.members.push({ classId: c.id, studentId: d.id, joinedAt: c.createdAt });
      return { id: c.id, name: c.name, code: c.code };
    },
    async manageClass(teacherId, classId, action, arg) {
      const s = state();
      const c = s.classes.find((x) => x.id === classId && x.teacherId === teacherId);
      if (!c) throw new Error("clase_no_encontrada");
      if (action === "nuevo_codigo") c.code = previewCode();
      else if (action === "archivar") c.archived = true;
      else if (action === "renombrar") {
        const n = (arg ?? "").trim();
        if (n.length < 2 || n.length > 60) throw new Error("nombre_invalido");
        c.name = n;
      } else if (action === "quitar") s.members = s.members.filter((m) => !(m.classId === classId && m.studentId === arg));
    },
    async classReport(teacherId, classId): Promise<ClassReport> {
      const s = state();
      const c = s.classes.find((x) => x.id === classId && (x.teacherId === teacherId || teacherId === PREVIEW_ADMIN_ID));
      if (!c) throw new Error("clase_no_encontrada");
      const students = s.members.filter((m) => m.classId === classId).flatMap((m): ClassStudent[] => {
        if (m.studentId === PREVIEW_USER_ID) {
          const p = s.profile;
          return [{ id: p.id, name: p.displayName, avatar: p.avatarBase, avatarLook: p.avatarLook, xp: p.xp, streak: p.streak, lastActive: todayBogota(), joinedAt: m.joinedAt, progress: [...s.progress.values()] }];
        }
        const d = DEMO_STUDENTS.find((x) => x.id === m.studentId);
        return d ? [{ ...d, joinedAt: m.joinedAt }] : [];
      }).sort((a, b) => a.name.localeCompare(b.name, "es"));
      return {
        class: { id: c.id, name: c.name, code: c.code, createdAt: c.createdAt, archived: c.archived },
        students,
        questions: DEMO_QUESTIONS.map(([missionId, position, answered, right]) => ({ missionId, position, answered, right })),
      };
    },
    async listStudentClasses(studentId) {
      const s = state();
      return s.members.filter((m) => m.studentId === studentId).flatMap((m) => {
        const c = s.classes.find((x) => x.id === m.classId && !x.archived);
        return c ? [{ id: c.id, name: c.name, teacherName: TEACHER.displayName, courseTitle: c.courseSlug ? C().courses.find((x) => x.slug === c.courseSlug)?.title ?? null : null }] : [];
      });
    },
    async joinClass(studentId, code) {
      if (studentId !== PREVIEW_USER_ID) throw new Error("solo_estudiantes");
      const s = state();
      const norm = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const c = s.classes.find((x) => x.code === norm && !x.archived);
      if (!c) throw new Error("codigo_invalido");
      if (!s.members.some((m) => m.classId === c.id && m.studentId === studentId)) s.members.push({ classId: c.id, studentId, joinedAt: new Date().toISOString() });
      const course = c.courseSlug ? C().courses.find((x) => x.slug === c.courseSlug) : undefined;
      if (course && (!s.access.has(course.slug) || s.viaClass.has(course.slug))) {
        s.access.add(course.slug);
        s.viaClass.set(course.slug, c.id);
      }
      return { id: c.id, name: c.name, courseSlug: course?.slug ?? null, courseTitle: course?.title ?? null, expiresAt: course?.accessUntil ? `${course.accessUntil}T23:59:59-05:00` : null };
    },
    async revokeClassAccess(_studentId, classId) {
      const s = state();
      for (const [course, cls] of s.viaClass) if (cls === classId) { s.access.delete(course); s.viaClass.delete(course); }
    },
    async leaveClass(studentId, classId) {
      const s = state();
      s.members = s.members.filter((m) => !(m.classId === classId && m.studentId === studentId));
    },
    async familyCode(studentId, renew = false) {
      if (studentId !== PREVIEW_USER_ID || state().profile.role !== "estudiante") throw new Error("solo_estudiantes");
      const s = state();
      if (!s.familyCode || renew) s.familyCode = previewCode() + previewCode().slice(0, 2);
      return s.familyCode;
    },
    async linkFamily(familyId, code) {
      if (familyId !== PREVIEW_FAMILY_ID) throw new Error("solo_familias");
      const s = state();
      const norm = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!s.familyCode || norm !== s.familyCode) throw new Error("codigo_invalido");
      s.familySince = new Date().toISOString();
      return { id: s.profile.id, name: s.profile.displayName };
    },
    async unlinkFamily(actorId, familyId, studentId) {
      if (actorId !== familyId && actorId !== studentId) throw new Error("no_autorizado");
      if (familyId === PREVIEW_FAMILY_ID && studentId === PREVIEW_USER_ID) state().familySince = null;
    },
    async listStudentFamilies(studentId) {
      const s = state();
      return studentId === PREVIEW_USER_ID && s.familySince ? [{ id: PREVIEW_FAMILY_ID, name: FAMILY.displayName, since: s.familySince }] : [];
    },
    async sendFamilyMessage(familyId, studentId, message) {
      const s = state();
      if (familyId !== PREVIEW_FAMILY_ID || studentId !== PREVIEW_USER_ID || !s.familySince) throw new Error("no_vinculado");
      if (!/^[a-z_]{2,30}$/.test(message)) throw new Error("mensaje_invalido");
      const today = s.familyMessages.filter((m) => todayBogota(new Date(m.createdAt)) === todayBogota()).length;
      if (today >= 5) throw new Error("demasiados_mensajes");
      s.familyMessages.push({ id: `msg-${s.familyMessages.length + 1}`, message, createdAt: new Date().toISOString(), read: false });
      return { remaining: 4 - today };
    },
    async studentMessages(studentId) {
      const s = state();
      if (studentId !== PREVIEW_USER_ID || !s.familySince) return [];
      return s.familyMessages.filter((m) => !m.read).slice(-5).reverse()
        .map((m) => ({ id: m.id, message: m.message, createdAt: m.createdAt, from: FAMILY.displayName, guide: s.adultLooks[PREVIEW_FAMILY_ID]?.guide ?? null }));
    },
    async readFamilyMessages(studentId) {
      if (studentId === PREVIEW_USER_ID) for (const m of state().familyMessages) m.read = true;
    },
    async familyMessagesLeft(familyId): Promise<Record<string, number>> {
      const s = state();
      if (familyId !== PREVIEW_FAMILY_ID || !s.familySince) return {};
      const today = s.familyMessages.filter((m) => todayBogota(new Date(m.createdAt)) === todayBogota()).length;
      return { [PREVIEW_USER_ID]: 5 - today };
    },
    async familyOverview(familyId): Promise<FamilyChild[]> {
      if (familyId !== PREVIEW_FAMILY_ID) throw new Error("solo_familias");
      const s = state();
      if (!s.familySince) return [];
      const p = s.profile;
      const rows = [...s.progress.entries()].flatMap(([id, pr]) => {
        const m = C().missions.find((x) => x.id === id);
        return m ? [{ m, pr }] : [];
      });
      const courses = C().courses.filter((c) => c.published && rows.some((r) => r.m.courseSlug === c.slug)).map((c) => ({
        slug: c.slug, title: c.title, kind: c.kind, total: C().missions.filter((m) => m.courseSlug === c.slug).length,
        lessons: rows.filter((r) => r.m.courseSlug === c.slug).sort((a, b) => a.m.position - b.m.position)
          .map(({ m, pr }) => ({ position: m.position, title: m.title, bestScore: pr.bestScore, attempts: pr.attempts, completed: pr.completed })),
      }));
      const classes = s.members.filter((m) => m.studentId === p.id).flatMap((m) => {
        const c = s.classes.find((x) => x.id === m.classId && !x.archived);
        return c ? [{ name: c.name, teacher: TEACHER.displayName }] : [];
      });
      return [{
        id: p.id, name: p.displayName, avatar: p.avatarBase, avatarLook: p.avatarLook, xp: p.xp, streak: p.streak,
        lastActive: rows.length ? todayBogota() : null, since: s.familySince, weekAttempts: rows.reduce((n, r) => n + r.pr.attempts, 0),
        courses, classes,
        certificates: s.certificates.map((c) => ({ code: c.code, courseTitle: c.courseTitle, hours: c.hours, issuedAt: c.issuedAt })),
      }];
    },
    async getCourseAccess(userId) {
      return new Set(C().courses.filter((c) => hasAccess(userId, c.slug)).map((c) => c.slug));
    },
    async adminUsers(adminId, query) {
      if (adminId !== PREVIEW_ADMIN_ID) throw new Error("solo_admin");
      const s = state();
      const p = s.profile;
      const all: AdminUser[] = [
        { id: p.id, email: "estudiante@vista-previa.co", name: p.displayName, role: p.role, xp: p.xp, createdAt: "2026-10-01T00:00:00Z", lastSignInAt: null,
          access: [...s.access].map((course) => ({ course, source: "admin", expiresAt: null })) },
        { id: PREVIEW_TEACHER_ID, email: "docente@vista-previa.co", name: TEACHER.displayName, role: "docente", xp: 0, createdAt: "2026-09-30T00:00:00Z", lastSignInAt: null, access: [] },
        { id: PREVIEW_ADMIN_ID, email: "admin@vista-previa.co", name: ADMIN.displayName, role: "admin", xp: 0, createdAt: "2026-09-29T00:00:00Z", lastSignInAt: null, access: [] },
        ...s.extraTeachers,
      ];
      const q = query.trim().toLowerCase();
      return q ? all.filter((u) => u.email.includes(q) || u.name.toLowerCase().includes(q)) : all;
    },
    async adminSetRole(adminId, userId, role) {
      if (adminId !== PREVIEW_ADMIN_ID) throw new Error("solo_admin");
      if (userId === PREVIEW_USER_ID) state().profile = { ...state().profile, role };
      else throw new Error("no_permitido");
    },
    async adminGrantAccess(adminId, userId, course) {
      if (adminId !== PREVIEW_ADMIN_ID) throw new Error("solo_admin");
      if (userId === PREVIEW_USER_ID) state().access.add(course);
    },
    async adminRevokeAccess(adminId, userId, course) {
      if (adminId !== PREVIEW_ADMIN_ID) throw new Error("solo_admin");
      if (userId === PREVIEW_USER_ID) state().access.delete(course);
    },
    async adminSetPrice(adminId, course, price) {
      if (adminId !== PREVIEW_ADMIN_ID) throw new Error("solo_admin");
      state().prices.set(course, price);
    },
    async adminClasses(adminId) {
      if (adminId !== PREVIEW_ADMIN_ID) throw new Error("solo_admin");
      const s = state();
      return s.classes.map((c) => ({
        id: c.id, name: c.name, code: c.code, archived: c.archived, members: s.members.filter((m) => m.classId === c.id).length,
        teacher: c.teacherId === PREVIEW_ADMIN_ID ? ADMIN.displayName : TEACHER.displayName, teacherId: c.teacherId,
        courseSlug: c.courseSlug, courseTitle: c.courseSlug ? C().courses.find((x) => x.slug === c.courseSlug)?.title ?? null : null,
      }));
    },
    async adminCreateClass(adminId, course, name, teacherId) {
      if (adminId !== PREVIEW_ADMIN_ID) throw new Error("solo_admin");
      if (!C().courses.some((c) => c.slug === course && c.kind === "clase")) throw new Error("curso_no_encontrado");
      if (!STAFF.has(teacherId)) throw new Error("solo_docentes");
      const s = state();
      const c: PreviewClass = { id: `clase-${s.classes.length + 1}`, name: name.trim(), code: previewCode(), teacherId, archived: false, createdAt: new Date().toISOString(), courseSlug: course };
      s.classes.push(c);
      return { id: c.id, code: c.code };
    },
    async adminAssignTeacher(adminId, classId, teacherId) {
      if (adminId !== PREVIEW_ADMIN_ID) throw new Error("solo_admin");
      const c = state().classes.find((x) => x.id === classId);
      if (!c) throw new Error("clase_no_encontrada");
      c.teacherId = teacherId;
    },
    async createTeacherAccount(email, name) {
      const s = state();
      if (s.extraTeachers.some((t) => t.email === email)) throw new Error("already been registered");
      const id = `docente-${s.extraTeachers.length + 1}`;
      s.extraTeachers.push({ id, email, name, role: "docente", xp: 0, createdAt: new Date().toISOString(), lastSignInAt: null, access: [] });
      return { id };
    },
    // ===== Constancias =====
    async getIssuerSettings() { return { ...state().settings }; },
    async saveIssuerSettings(input) { state().settings = { ...input }; },
    async issueCertificate(userId, course, name, docType, docNumber) {
      const s = state();
      const prev = s.certificates.find((c) => c.userId === userId && c.courseSlug === course);
      if (prev) return { code: prev.code, isNew: false };
      const c = C().courses.find((x) => x.slug === course && x.kind === "curso" && x.published);
      if (!c) throw new Error("curso_no_encontrado");
      if (!c.hours || !c.trainerName || !c.trainerTitle) throw new Error("curso_incompleto");
      const ms = C().missions.filter((m) => m.courseSlug === course);
      if (!ms.length || ms.some((m) => !s.progress.get(m.id)?.completed)) throw new Error("curso_sin_terminar");
      if (!s.settings.issuerName || !s.settings.signaturePng) throw new Error("falta_configuracion");
      const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const part = () => Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join("");
      const today = todayBogota();
      const cert: Certificate = {
        number: s.certificates.length + 1, code: `UMB-${part()}-${part()}`, userId, courseSlug: course,
        participantName: name.trim().replace(/\s+/g, " "), docType, docNumber: docNumber.trim().toUpperCase(),
        courseTitle: c.title, hours: c.hours, trainerName: c.trainerName, trainerTitle: c.trainerTitle,
        issuerName: s.settings.issuerName, issuerTitle: s.settings.issuerTitle, city: s.settings.city,
        startedOn: today, finishedOn: today, issuedAt: new Date().toISOString(),
      };
      s.certificates.push(cert);
      return { code: cert.code, isNew: true };
    },
    async getCertificate(code) { return state().certificates.find((c) => c.code === code) ?? null; },
    async listCertificates({ userId, limit = 100 }) {
      return state().certificates.filter((c) => !userId || c.userId === userId).slice().reverse().slice(0, limit);
    },
    // ===== Editor de contenido =====
    async listAllCourses() {
      return C().courses.map((c) => ({ ...withPrice(c), published: c.published, missionCount: C().missions.filter((m) => m.courseSlug === c.slug).length }));
    },
    async getCourseForEdit(slug): Promise<EditableCourse | null> {
      const c = C().courses.find((x) => x.slug === slug);
      if (!c) return null;
      const s = state();
      return {
        ...withPrice(c), published: c.published,
        missions: C().missions.filter((m) => m.courseSlug === slug).sort((a, b) => a.position - b.position).map((m) => ({
          ...m, hasProgress: s.progress.has(m.id),
          questions: questions(m.id).map((q, i) => ({ id: q.id, position: i + 1, prompt: q.prompt, options: q.options, correctIndex: q.correct_index, hint: q.hint, explanation: q.explanation })),
        })),
      };
    },
    async createCourse(slug, input: CourseInput) {
      const c = C();
      c.courses.push({ ...input, slug, position: c.courses.length + 1, price: null, published: false });
    },
    async updateCourse(slug, input) {
      const c = C().courses.find((x) => x.slug === slug);
      if (c) Object.assign(c, input);
    },
    async setCoursePublished(slug, published) {
      const c = C().courses.find((x) => x.slug === slug);
      if (c) c.published = published;
    },
    async createMission(courseSlug, input) {
      const c = C();
      const id = `x${c.seq++}`;
      const pos = Math.max(0, ...c.missions.filter((m) => m.courseSlug === courseSlug).map((m) => m.position)) + 1;
      c.missions.push({ id, courseSlug, position: pos, ...input });
      c.questions.set(id, []);
      return { id };
    },
    async updateMission(missionId, input) {
      const m = C().missions.find((x) => x.id === missionId);
      if (m) Object.assign(m, input);
    },
    async deleteMission(missionId) {
      if (state().progress.has(missionId)) throw new Error("tiene_avance");
      const c = C();
      c.missions = c.missions.filter((m) => m.id !== missionId);
      c.questions.delete(missionId);
    },
    async moveMission(missionId, direction) {
      const c = C();
      const m = c.missions.find((x) => x.id === missionId);
      if (!m) return;
      const sibs = c.missions.filter((x) => x.courseSlug === m.courseSlug).sort((a, b) => a.position - b.position);
      const other = sibs[sibs.indexOf(m) + direction];
      if (other) [m.position, other.position] = [other.position, m.position];
    },
    async createQuestion(missionId, input) {
      const c = C();
      const id = `${missionId}q${c.seq++}`;
      c.questions.set(missionId, [...questions(missionId), { id, prompt: input.prompt, options: input.options, correct_index: input.correctIndex, hint: input.hint, explanation: input.explanation }]);
      return { id };
    },
    async updateQuestion(questionId, input) {
      for (const qs of C().questions.values()) {
        const q = qs.find((x) => x.id === questionId);
        if (q) Object.assign(q, { prompt: input.prompt, options: input.options, correct_index: input.correctIndex, hint: input.hint, explanation: input.explanation });
      }
    },
    async deleteQuestion(questionId) {
      for (const [k, qs] of C().questions) C().questions.set(k, qs.filter((x) => x.id !== questionId));
    },
    async moveQuestion(questionId, direction) {
      for (const qs of C().questions.values()) {
        const i = qs.findIndex((x) => x.id === questionId);
        if (i >= 0 && qs[i + direction]) [qs[i], qs[i + direction]] = [qs[i + direction], qs[i]];
      }
    },
    async markIntroSeen() { state().profile = { ...state().profile, introSeen: true }; },
    async markChapterRead(_u, id) {
      const p = state().profile;
      if (!p.chroniclesRead.includes(id)) state().profile = { ...p, chroniclesRead: [...p.chroniclesRead, id] };
    },
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
      const missionId = [...C().questions.entries()].find(([, qs]) => qs.some((x) => x.id === questionId))?.[0] ?? "";
      const m = C().missions.find((x) => x.id === missionId);
      const q = questions(missionId).find((x) => x.id === questionId);
      if (!m || !q) throw new Error("pregunta_no_encontrada");
      if (isLocked(s, m, _u)) throw new Error("mision_bloqueada");
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
