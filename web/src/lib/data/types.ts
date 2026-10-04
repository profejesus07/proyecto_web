import type { AvatarLook } from "@/lib/avatar-look";

export type Role = "estudiante" | "docente" | "familia" | "admin";
export type AvatarBase = "aria" | "leo" | "tomas" | "nuri";
export const AVATAR_BASES: readonly AvatarBase[] = ["aria", "leo", "tomas", "nuri"];
export const AVATAR_NAMES: Record<AvatarBase, string> = { aria: "Aria", leo: "Leo", tomas: "Tomás", nuri: "Nuri" };

export type Element = "luz" | "sombra" | "fuego" | "agua" | "naturaleza" | "eter";

export interface Profile {
  id: string;
  role: Role;
  displayName: string;
  avatarBase: AvatarBase;
  /** Colores y atuendo elegidos en el Vestidor. */
  avatarLook: AvatarLook;
  xp: number;
  coins: number;
  gems: number;
  streak: number;
  /** Ya vio la bienvenida de Sora. */
  introSeen: boolean;
  /** Capítulos de las Crónicas ya leídos. */
  chroniclesRead: string[];
}

export interface Course {
  slug: string;
  title: string;
  summary: string;
  element: Element;
  guardian: string;
  position: number;
  /** Precio en pesos colombianos (null = aún sin precio). */
  price: number | null;
  /** «clase»: por área y periodos, acceso anual. «curso»: curso corto de educación informal. */
  kind: CourseKind;
  area: string | null;
  grade: string | null;
  schoolYear: number | null;
  /** Último día de acceso de una clase (AAAA-MM-DD). */
  accessUntil: string | null;
  /** Intensidad horaria de un curso corto (menos de 160). */
  hours: number | null;
  trainerName: string | null;
  trainerTitle: string | null;
}

export type CourseKind = "clase" | "curso";

export interface MissionSummary {
  id: string;
  courseSlug: string;
  position: number;
  title: string;
  intro: string;
  xpReward: number;
  isBoss: boolean;
  /** Periodo académico (1 a 4) en una clase. */
  period: number | null;
}

export interface CourseDetail extends Course {
  missions: MissionSummary[];
}

export interface PublicQuestion {
  id: string;
  position: number;
  prompt: string;
  options: string[];
  /** Solo dice si existe pista; el texto se entrega al usar la ayuda «Pista». */
  hasHint: boolean;
}

export interface MissionPlay {
  mission: MissionSummary;
  course: Course;
  questions: PublicQuestion[];
}

export interface AnswerKeyRow {
  id: string;
  correctIndex: number;
  explanation: string;
}

export interface ProgressRow {
  missionId: string;
  bestScore: number;
  attempts: number;
  completed: boolean;
}

export interface CompleteResult {
  passed: boolean;
  first: boolean;
  score: number;
  xpGain: number;
  coinsGain: number;
  gemsGain: number;
  xp: number;
  coins: number;
  gems: number;
  streak: number;
  bossDefeated: boolean;
  courseDone: boolean;
  granted: string[];
}

/** Resultado de responder una pregunta: el servidor la revisa al momento y la respuesta queda fija. */
export interface AnswerResult {
  index: number;
  choice: number;
  correct: boolean;
  correctIndex: number;
  explanation: string;
  answered: number;
  right: number;
  total: number;
}

export interface FinishResult extends CompleteResult {
  /** Respuestas guardadas del intento, en orden. */
  answers: number[];
}

export interface InventoryRow {
  itemId: string;
  source: string;
  acquiredAt: string;
}

/** Ayuda usada hoy (en cualquier misión). */
export interface AidUseRow {
  itemId: string;
  missionId: string;
  questionId: string;
  free: boolean;
  hint?: string;
  removed?: number[];
}

export interface AidResult {
  hint?: string;
  removed?: number[];
  free: boolean;
  charged: boolean;
  left: number;
}

export interface ClassSummary {
  id: string;
  name: string;
  code: string;
  /** Clase (forma 1) a la que da acceso el código; null = grupo propio del docente. */
  courseSlug: string | null;
  courseTitle: string | null;
  members: number;
  archived: boolean;
  createdAt: string;
}

export interface StudentClass {
  id: string;
  name: string;
  teacherName: string;
  courseTitle: string | null;
}

export interface JoinResult {
  id: string;
  name: string;
  courseSlug: string | null;
  courseTitle: string | null;
  expiresAt: string | null;
}

export interface ClassStudent {
  id: string;
  name: string;
  avatar: AvatarBase;
  xp: number;
  streak: number;
  lastActive: string | null;
  joinedAt: string;
  progress: ProgressRow[];
}

export interface ClassReport {
  class: { id: string; name: string; code: string; createdAt: string; archived: boolean };
  students: ClassStudent[];
  /** Aciertos por pregunta en intentos terminados de los estudiantes de la clase. */
  questions: { missionId: string; position: number; answered: number; right: number }[];
}

// ===== Editor de contenido =====
export interface EditableQuestion {
  id: string;
  position: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
}

export interface EditableMission extends MissionSummary {
  questions: EditableQuestion[];
  /** Hay estudiantes con avance: no se puede borrar. */
  hasProgress: boolean;
}

export interface EditableCourse extends Course {
  published: boolean;
  missions: EditableMission[];
}

export interface CourseListItem extends Course {
  published: boolean;
  missionCount: number;
}

export type CourseInput = Omit<Course, "slug" | "position" | "price">;
export type MissionInput = { title: string; intro: string; xpReward: number; isBoss: boolean; period: number | null };
export type QuestionInput = { prompt: string; options: string[]; correctIndex: number; hint: string; explanation: string };

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  xp: number;
  createdAt: string;
  lastSignInAt: string | null;
  access: { course: string; source: string; expiresAt: string | null }[];
}

export interface AdminClass {
  id: string;
  name: string;
  code: string;
  archived: boolean;
  teacher: string;
  teacherId: string;
  courseSlug: string | null;
  courseTitle: string | null;
  members: number;
}

// ===== Constancias de asistencia =====
export type DocType = "CC" | "TI" | "CE" | "PPT" | "PA";

export interface IssuerSettings {
  issuerName: string | null;
  issuerTitle: string | null;
  issuerDoc: string | null;
  city: string | null;
  signaturePng: string | null;
}

export interface Certificate {
  number: number;
  code: string;
  userId: string | null;
  courseSlug: string;
  participantName: string;
  docType: DocType;
  docNumber: string;
  courseTitle: string;
  hours: number;
  trainerName: string;
  trainerTitle: string;
  issuerName: string;
  issuerTitle: string | null;
  city: string | null;
  startedOn: string;
  finishedOn: string;
  issuedAt: string;
}

export type ClassAction = "nuevo_codigo" | "renombrar" | "archivar" | "quitar";

/** Todo lo que el servidor necesita de la base de datos. Una implementación real (Supabase) y otra en memoria (vista previa). */
export interface Repo {
  getProfile(userId: string): Promise<Profile | null>;
  listCourses(): Promise<Course[]>;
  getCourse(slug: string): Promise<CourseDetail | null>;
  getProgress(userId: string): Promise<ProgressRow[]>;
  getBossDefeats(userId: string): Promise<string[]>;
  getInventory(userId: string): Promise<InventoryRow[]>;
  getMissionPlay(missionId: string): Promise<MissionPlay | null>;
  getAnswerKey(missionId: string): Promise<AnswerKeyRow[]>;
  /** Respuestas del intento abierto (-1 = sin responder), o null si no hay. */
  getOpenAttempt(userId: string, missionId: string): Promise<number[] | null>;
  answerQuestion(userId: string, missionId: string, index: number, choice: number): Promise<AnswerResult>;
  /** Cierra el intento: la nota sale de las respuestas guardadas. */
  finishAttempt(userId: string, missionId: string, passMark: number, items: string[]): Promise<FinishResult>;
  purchaseItem(userId: string, itemId: string, price: number): Promise<{ coins: number }>;
  setAvatar(userId: string, base: AvatarBase, look?: AvatarLook): Promise<void>;
  setDisplayName(userId: string, name: string): Promise<void>;
  markIntroSeen(userId: string): Promise<void>;
  markChapterRead(userId: string, chapterId: string): Promise<void>;
  /** Unidades de cada ayuda consumible: { item_id: cantidad }. */
  getConsumables(userId: string): Promise<Record<string, number>>;
  /** Ayudas usadas hoy (fecha de Colombia). */
  getAidUsesToday(userId: string): Promise<AidUseRow[]>;
  buyConsumable(userId: string, itemId: string, price: number, maxStock: number): Promise<{ coins: number; quantity: number }>;
  useAid(userId: string, questionId: string, itemId: string, dailyCap: number, minXp: number): Promise<AidResult>;
  // Clases (Maestro del Gremio)
  listTeacherClasses(teacherId: string): Promise<ClassSummary[]>;
  createClass(teacherId: string, name: string): Promise<{ id: string; name: string; code: string }>;
  manageClass(teacherId: string, classId: string, action: ClassAction, arg?: string): Promise<void>;
  classReport(teacherId: string, classId: string): Promise<ClassReport>;
  listStudentClasses(studentId: string): Promise<StudentClass[]>;
  joinClass(studentId: string, code: string): Promise<JoinResult>;
  /** Revoca el acceso a la clase que dio este grupo (al salir o ser retirado). */
  revokeClassAccess(studentId: string, classId: string): Promise<void>;
  leaveClass(studentId: string, classId: string): Promise<void>;
  // Suscripciones
  /** Cursos con acceso completo (docentes y admin: todos). */
  getCourseAccess(userId: string): Promise<Set<string>>;
  // Administración (cada función comprueba en la base de datos que quien llama es admin)
  adminUsers(adminId: string, query: string): Promise<AdminUser[]>;
  adminSetRole(adminId: string, userId: string, role: "estudiante" | "familia" | "docente"): Promise<void>;
  adminGrantAccess(adminId: string, userId: string, course: string, expiresAt: string | null): Promise<void>;
  adminRevokeAccess(adminId: string, userId: string, course: string): Promise<void>;
  adminSetPrice(adminId: string, course: string, price: number | null): Promise<void>;
  adminClasses(adminId: string): Promise<AdminClass[]>;
  /** Grupo ligado a una clase: su código da acceso hasta el fin del año lectivo. */
  adminCreateClass(adminId: string, course: string, name: string, teacherId: string): Promise<{ id: string; code: string }>;
  adminAssignTeacher(adminId: string, classId: string, teacherId: string): Promise<void>;
  /** Crea una cuenta de docente ya confirmada, con una contraseña temporal. */
  createTeacherAccount(email: string, name: string, password: string): Promise<{ id: string }>;
  // Constancias
  getIssuerSettings(): Promise<IssuerSettings>;
  saveIssuerSettings(input: IssuerSettings): Promise<void>;
  issueCertificate(userId: string, course: string, name: string, docType: DocType, docNumber: string): Promise<{ code: string; isNew: boolean }>;
  getCertificate(code: string): Promise<Certificate | null>;
  listCertificates(filter: { userId?: string; limit?: number }): Promise<Certificate[]>;
  // Editor de contenido (solo lo usa el servidor después de comprobar que quien llama es admin)
  listAllCourses(): Promise<CourseListItem[]>;
  getCourseForEdit(slug: string): Promise<EditableCourse | null>;
  createCourse(slug: string, input: CourseInput): Promise<void>;
  updateCourse(slug: string, input: CourseInput): Promise<void>;
  setCoursePublished(slug: string, published: boolean): Promise<void>;
  createMission(courseSlug: string, input: MissionInput): Promise<{ id: string }>;
  updateMission(missionId: string, input: MissionInput): Promise<void>;
  deleteMission(missionId: string): Promise<void>;
  moveMission(missionId: string, direction: -1 | 1): Promise<void>;
  createQuestion(missionId: string, input: QuestionInput): Promise<{ id: string }>;
  updateQuestion(questionId: string, input: QuestionInput): Promise<void>;
  deleteQuestion(questionId: string): Promise<void>;
  moveQuestion(questionId: string, direction: -1 | 1): Promise<void>;
}
