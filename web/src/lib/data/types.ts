export type Role = "estudiante" | "docente" | "familia";
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
}

export interface Course {
  slug: string;
  title: string;
  summary: string;
  element: Element;
  guardian: string;
  position: number;
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
  hint: string;
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

export interface InventoryRow {
  itemId: string;
  source: string;
  acquiredAt: string;
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
  completeMission(userId: string, missionId: string, score: number, passMark: number, items: string[]): Promise<CompleteResult>;
  purchaseItem(userId: string, itemId: string, price: number): Promise<{ coins: number }>;
  setAvatar(userId: string, base: AvatarBase): Promise<void>;
}
