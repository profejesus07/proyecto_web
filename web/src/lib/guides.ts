import { defaultGuide, guideById, type Guide } from "@/content/elenco";
import type { Profile } from "@/lib/data/types";
import { isStaff } from "@/lib/roles";

/** Maestro (docente/admin) o Guardián del Hogar (familia) de una persona; null para estudiantes. */
export function guideFor(p: Pick<Profile, "id" | "role" | "avatarLook">): Guide | null {
  const group = isStaff(p.role) ? "maestro" : p.role === "familia" ? "hogar" : null;
  if (!group) return null;
  const chosen = guideById(p.avatarLook.guide);
  return chosen && chosen.group === group ? chosen : defaultGuide(group, p.id);
}
