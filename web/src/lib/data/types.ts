import type { ActivityKind, ActivityResponse, Solution } from "@/lib/activities";
import type { AvatarLook } from "@/lib/avatar-look";
import type { ImportPlan } from "@/lib/excel-import";

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
  /** Intensidad horaria: un curso corto, menos de 160; una clase, horas en el año (hasta 2000). */
  hours: number | null;
  trainerName: string | null;
  trainerTitle: string | null;
  /** El curso completo es gratis para todos. */
  isFree: boolean;
}

/** Módulo de un curso corto: agrupa lecciones y tiene su propio Guardián (el jefe de su última lección). */
export interface Module {
  id: string;
  position: number;
  title: string;
  summary: string;
  guardian: string;
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
  /** Módulo de un curso corto. */
  moduleId: string | null;
  /** «reto»: actividades. «explicacion»: texto (y video) para leer antes de practicar. */
  lessonKind: LessonKind;
  /** Texto de la explicación (párrafos, listas con «- » y **negrita**). */
  body: string;
  /** Video opcional de la explicación (YouTube o Vimeo). */
  videoUrl: string | null;
}

export type LessonKind = "reto" | "explicacion";

export interface CourseDetail extends Course {
  modules: Module[];
  missions: MissionSummary[];
}

export interface PublicQuestion {
  id: string;
  position: number;
  prompt: string;
  kind: ActivityKind;
  /** Opciones (selección), pasos desordenados (ordenar) o columna izquierda (relacionar). Vacío en «completar». */
  options: string[];
  /** Columna derecha desordenada (relacionar). */
  right?: string[];
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
  kind: ActivityKind;
  correctIndex: number;
  explanation: string;
  /** Solución que se muestra en el repaso (actividades que no son de opciones). */
  solution?: Solution;
}

export interface ProgressRow {
  missionId: string;
  bestScore: number;
  attempts: number;
  completed: boolean;
  /** Cuándo se aprobó por primera vez (si se conoce). */
  completedAt?: string | null;
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
  /** El Escudo de Calma paró el error: la respuesta no quedó fija (choice/correctIndex = -1). */
  shielded?: boolean;
  /** XP extra de la Lluvia de Estrellas. */
  bonusXp?: number;
  /** Solución (actividades que no son de opciones). */
  solution?: Solution;
}

/** Lo que devuelve (y guarda) un poder al usarse. */
export interface PowerPayload {
  stems?: string[];
  lead?: string | null;
  spent?: boolean;
  bonus?: number;
  hint?: string | null;
  removed?: number[];
  hints?: Record<string, string>;
  choice?: number;
  reset?: boolean;
}
export interface PowerResult extends PowerPayload { charged: boolean; left: number }

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
  /** Lo que guardó un poder (ver PowerPayload). */
  payload?: PowerPayload;
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

/** Familia vinculada a un estudiante (lo que ve el estudiante). */
export interface LinkedFamily { id: string; name: string; since: string }

/** Mensaje de apoyo de la familia (clave de content/elenco FAMILY_MESSAGES). */
export interface FamilyMessage { id: string; message: string; createdAt: string; from: string; guide: string | null }

/** Lo que ve una familia de cada hijo o hija vinculado (solo lectura). */
export interface FamilyChild {
  id: string;
  name: string;
  avatar: AvatarBase;
  avatarLook: AvatarLook;
  xp: number;
  streak: number;
  lastActive: string | null;
  since: string;
  /** Misiones terminadas en los últimos 7 días. */
  weekAttempts: number;
  courses: { slug: string; title: string; kind: "clase" | "curso"; total: number; lessons: { position: number; title: string; bestScore: number; attempts: number; completed: boolean }[] }[];
  classes: { name: string; teacher: string }[];
  certificates: { code: string; courseTitle: string; hours: number; issuedAt: string }[];
  /** Decoración que le regaló a la Terraza del Hogar (ids obj_decoracion_*). */
  decor: string[];
}

export interface ClassStudent {
  id: string;
  name: string;
  avatar: AvatarBase;
  avatarLook: AvatarLook;
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
  kind: ActivityKind;
  options: string[];
  correctIndex: number;
  /** Columna derecha (relacionar). */
  right: string[];
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
  modules: Module[];
  missions: EditableMission[];
}

export interface CourseListItem extends Course {
  published: boolean;
  missionCount: number;
}

export type CourseInput = Omit<Course, "slug" | "position" | "price" | "isFree">;
export type MissionInput = { title: string; intro: string; xpReward: number; isBoss: boolean; period: number | null; moduleId: string | null; lessonKind: LessonKind; body: string; videoUrl: string | null };
export type QuestionInput = { prompt: string; kind: ActivityKind; options: string[]; correctIndex: number; data: { right?: string[] }; hint: string; explanation: string };
export type ModuleInput = { title: string; summary: string; guardian: string };

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

export type PaymentProvider = "wompi" | "mercadopago";
export const PAYMENT_PROVIDERS: readonly PaymentProvider[] = ["wompi", "mercadopago"];
export type PaymentStatus = "pendiente" | "aprobado" | "rechazado" | "anulado" | "error";

/** Un pago recién creado: la referencia viaja a la pasarela y el valor sale de la base de datos. */
export interface PaymentStart { reference: string; amount: number; title: string; student: string }

export interface Payment {
  reference: string;
  provider: PaymentProvider;
  amount: number;
  status: PaymentStatus;
  courseSlug: string;
  /** Quien recibe el curso. */
  userId: string;
  /** Quien paga (el mismo estudiante o su familia). */
  payerId: string;
  createdAt: string;
}

/** Lo que dijo la pasarela, ya verificado por el servidor. */
export interface PaymentUpdate {
  reference: string;
  provider: PaymentProvider;
  providerRef: string | null;
  status: PaymentStatus;
  amount: number | null;
  currency: string | null;
  detail: string | null;
}

export interface AdminPayment {
  reference: string;
  provider: PaymentProvider;
  amount: number;
  status: PaymentStatus;
  detail: string | null;
  providerRef: string | null;
  createdAt: string;
  approvedAt: string | null;
  courseTitle: string;
  student: string;
  /** Familia que pagó (null si pagó el mismo estudiante). */
  payer: string | null;
}

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
  /** Responde una actividad de cualquier tipo; la base de datos la revisa. */
  answerActivity(userId: string, missionId: string, index: number, response: ActivityResponse): Promise<AnswerResult>;
  /** Cierra el intento: la nota sale de las respuestas guardadas. */
  finishAttempt(userId: string, missionId: string, passMark: number, items: string[]): Promise<FinishResult>;
  /** Marca como leída una lección de explicación (cuenta como aprobada). */
  completeReading(userId: string, missionId: string): Promise<CompleteResult>;
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
  usePower(userId: string, missionId: string, index: number, itemId: string, dailyCap: number, minXp: number): Promise<PowerResult>;
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
  /** Código que el estudiante comparte con su familia (renew = cambiarlo). */
  familyCode(studentId: string, renew?: boolean): Promise<string>;
  linkFamily(familyId: string, code: string): Promise<{ id: string; name: string }>;
  /** Desvincula; `actorId` es la familia o el estudiante. */
  unlinkFamily(actorId: string, familyId: string, studentId: string): Promise<void>;
  listStudentFamilies(studentId: string): Promise<LinkedFamily[]>;
  familyOverview(familyId: string): Promise<FamilyChild[]>;
  sendFamilyMessage(familyId: string, studentId: string, message: string): Promise<{ remaining: number }>;
  /** Mensajes sin leer de sus familias vinculadas. */
  studentMessages(studentId: string): Promise<FamilyMessage[]>;
  readFamilyMessages(studentId: string): Promise<void>;
  /** Mensajes que le quedan hoy a la familia por cada estudiante: { id: cantidad }. */
  familyMessagesLeft(familyId: string): Promise<Record<string, number>>;
  // Suscripciones
  /** Cursos con acceso completo (docentes y admin: todos). */
  getCourseAccess(userId: string): Promise<Set<string>>;
  // Pagos en línea
  startPayment(payerId: string, studentId: string | null, course: string, provider: PaymentProvider): Promise<PaymentStart>;
  settlePayment(update: PaymentUpdate): Promise<{ status: PaymentStatus; userId: string; course: string }>;
  getPayment(reference: string): Promise<Payment | null>;
  /** Pagos recientes donde la persona pagó o recibió el curso. */
  listPayments(userId: string): Promise<Payment[]>;
  adminPayments(adminId: string): Promise<AdminPayment[]>;
  // Administración (cada función comprueba en la base de datos que quien llama es admin)
  adminUsers(adminId: string, query: string): Promise<AdminUser[]>;
  adminSetRole(adminId: string, userId: string, role: "estudiante" | "familia" | "docente"): Promise<void>;
  /** Contraseña nueva para un estudiante o una familia (no para docentes ni administradores). */
  adminSetPassword(adminId: string, userId: string, password: string): Promise<void>;
  adminGrantAccess(adminId: string, userId: string, course: string, expiresAt: string | null): Promise<void>;
  adminRevokeAccess(adminId: string, userId: string, course: string): Promise<void>;
  adminSetPrice(adminId: string, course: string, price: number | null): Promise<void>;
  adminClasses(adminId: string): Promise<AdminClass[]>;
  /** Eliminar (el administrador): prepara en la base de datos (copia contable y registro) y luego borra. */
  adminDeleteCourse(adminId: string, slug: string): Promise<{ title: string; students: number; payments: number; groups: number }>;
  adminDeleteClass(adminId: string, classId: string): Promise<{ name: string; members: number }>;
  adminDeleteUser(adminId: string, userId: string): Promise<{ name: string; role: string }>;
  /** Grupo ligado a una clase: su código da acceso hasta el fin del año lectivo. */
  adminCreateClass(adminId: string, course: string, name: string, teacherId: string): Promise<{ id: string; code: string }>;
  adminAssignTeacher(adminId: string, classId: string, teacherId: string): Promise<void>;
  /** Crea una cuenta de docente ya confirmada, con una contraseña temporal. */
  createTeacherAccount(email: string, name: string, password: string): Promise<{ id: string }>;
  /** Cuenta de estudiante creada por el administrador (ya confirmada, sin correo de bienvenida). */
  createStudentAccount(email: string, name: string, password: string, avatar: AvatarBase): Promise<{ id: string }>;
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
  /** Crea un curso completo (borrador) desde un plan de importación. Si algo falla, no deja nada a medias. */
  importCourse(slug: string, plan: ImportPlan): Promise<void>;
  updateCourse(slug: string, input: CourseInput): Promise<void>;
  setCoursePublished(slug: string, published: boolean): Promise<void>;
  setCourseFree(slug: string, free: boolean): Promise<void>;
  createModule(courseSlug: string, input: ModuleInput): Promise<{ id: string }>;
  updateModule(moduleId: string, input: ModuleInput): Promise<void>;
  /** Solo si ya no tiene lecciones. */
  deleteModule(moduleId: string): Promise<void>;
  moveModule(moduleId: string, direction: -1 | 1): Promise<void>;
  createMission(courseSlug: string, input: MissionInput): Promise<{ id: string }>;
  updateMission(missionId: string, input: MissionInput): Promise<void>;
  deleteMission(missionId: string): Promise<void>;
  moveMission(missionId: string, direction: -1 | 1): Promise<void>;
  createQuestion(missionId: string, input: QuestionInput): Promise<{ id: string }>;
  updateQuestion(questionId: string, input: QuestionInput): Promise<void>;
  deleteQuestion(questionId: string): Promise<void>;
  moveQuestion(questionId: string, direction: -1 | 1): Promise<void>;
}
