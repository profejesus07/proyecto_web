"use server";

import { revalidatePath } from "next/cache";
import { guideById } from "@/content/elenco";
import { getViewer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { isStaff } from "@/lib/roles";

/** El docente elige su Maestro del Gremio; la familia, su Guardián del Hogar. */
export async function saveGuideAction(id: string): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  const g = typeof id === "string" ? guideById(id) : undefined;
  if (!viewer || !g) return { ok: false };
  const allowed = g.group === "maestro" ? isStaff(viewer.role) : viewer.role === "familia";
  if (!allowed) return { ok: false };
  await getRepo().setAvatar(viewer.id, viewer.avatarBase, { ...viewer.avatarLook, guide: g.id });
  revalidatePath("/", "layout");
  return { ok: true };
}
