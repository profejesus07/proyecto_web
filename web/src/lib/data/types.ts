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
}

export interface MissionSummary {
  id: string;
  courseSlug: string;
  position: number;
  title: string;
  intro: string;
  xpReward: number;
  isBoss: boolean;
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
  members: number;
  archived: boolean;
  createdAt: string;
}

export interface StudentClass {
  id: string;
  name: string;
  teacherName: string;
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
  members: number;
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
  setAvatar(userId: string, base: AvatarBase): Promise<void>;
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
  joinClass(studentId: string, code: string): Promise<{ id: string; name: string }>;
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
  /** Crea una cuenta de docente ya confirmada, con una contraseña temporal. */
  createTeacherAccount(email: string, name: string, password: string): Promise<{ id: string }>;
}
