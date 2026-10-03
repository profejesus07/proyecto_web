"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { AVATAR_BASES, type AvatarBase, type CompleteResult } from "@/lib/data/types";
import { PASS_MARK, gradeAnswers } from "@/lib/game/grading";
import { ranksReached } from "@/lib/game/ranks";
import { itemsOnFirstCompletion } from "@/lib/game/rewards";
import { RARITY, getItem, itemImage, priceOf, SHOP_CATEGORIES } from "@/lib/catalog";
import { SHOP_OPEN } from "@/lib/features";
import { submitSchema } from "@/lib/validation";

export interface ReviewRow {
  correct: boolean;
  chosen: number;
  correctIndex: number;
  explanation: string;
}

export interface GrantedItem {
  id: string;
  name: string;
  alt: string;
  image: string;
  rarity: string;
  color: string;
}

export type SubmitOutcome =
  | { ok: true; passMark: number; review: ReviewRow[]; result: CompleteResult; newRanks: string[]; items: GrantedItem[] }
  | { ok: false; error: string };

const MESSAGES: Record<string, string> = {
  mision_bloqueada: "Esta misión todavía está bloqueada. Termina primero las anteriores.",
  mision_no_encontrada: "No encontramos esa misión.",
  respuestas_incompletas: "Falta responder alguna pregunta.",
  sin_preguntas: "Esta misión aún no tiene preguntas.",
};

function friendly(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : "";
  for (const [k, v] of Object.entries(MESSAGES)) if (msg.includes(k)) return v;
  return fallback;
}

export async function submitMissionAction(missionId: string, answers: number[]): Promise<SubmitOutcome> {
  const parsed = submitSchema.safeParse({ missionId, answers });
  if (!parsed.success) return { ok: false, error: "No pudimos leer tus respuestas." };

  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Tu sesión terminó. Vuelve a ingresar para guardar tu avance." };

  try {
    const repo = getRepo();
    const play = await repo.getMissionPlay(parsed.data.missionId);
    if (!play) return { ok: false, error: MESSAGES.mision_no_encontrada };
    const key = await repo.getAnswerKey(parsed.data.missionId);
    if (key.length !== play.questions.length) return { ok: false, error: "Esta misión está en mantenimiento. Inténtalo más tarde." };

    const grade = gradeAnswers(key.map((k) => k.correctIndex), parsed.data.answers);
    const progress = await repo.getProgress(viewer.id);
    const items = itemsOnFirstCompletion({
      isBoss: play.mission.isBoss,
      guardian: play.course.guardian,
      element: play.course.element,
      xpBefore: viewer.xp,
      xpGain: play.mission.xpReward,
      firstEver: !progress.some((p) => p.completed),
    });
    const result = await repo.completeMission(viewer.id, play.mission.id, grade.score, PASS_MARK, items);

    revalidatePath("/gremio");
    revalidatePath("/portales", "layout");
    revalidatePath("/perfil");
    revalidatePath("/tienda");

    return {
      ok: true,
      passMark: PASS_MARK,
      review: key.map((k, i) => ({ correct: grade.perQuestion[i], chosen: parsed.data.answers[i], correctIndex: k.correctIndex, explanation: k.explanation })),
      result,
      newRanks: result.first ? ranksReached(viewer.xp, result.xp).map((r) => r.key) : [],
      items: result.granted.flatMap((id) => {
        const it = getItem(id);
        return it ? [{ id, name: it.nombre, alt: it.alt, image: itemImage(it), rarity: RARITY[it.rareza].label, color: RARITY[it.rareza].color }] : [];
      }),
    };
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos guardar tu resultado. Inténtalo de nuevo.") };
  }
}

export type BuyOutcome = { ok: true; coins: number; name: string } | { ok: false; error: string };

export async function buyItemAction(itemId: string): Promise<BuyOutcome> {
  if (!SHOP_OPEN) return { ok: false, error: "La tienda todavía no está abierta." };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Tu sesión terminó. Vuelve a ingresar." };
  const item = typeof itemId === "string" ? getItem(itemId) : undefined;
  const price = item ? priceOf(item) : null;
  if (!item || price === null || !(SHOP_CATEGORIES as readonly string[]).includes(item.categoria)) {
    return { ok: false, error: "Ese objeto no está a la venta." };
  }
  try {
    const { coins } = await getRepo().purchaseItem(viewer.id, item.id, price);
    revalidatePath("/tienda");
    revalidatePath("/perfil");
    revalidatePath("/gremio");
    return { ok: true, coins, name: item.nombre };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("ya_lo_tienes")) return { ok: false, error: "Ya tienes este objeto." };
    if (msg.includes("monedas_insuficientes")) return { ok: false, error: "Te faltan monedas. ¡Completa misiones para ganar más!" };
    return { ok: false, error: "No pudimos completar la compra. Inténtalo de nuevo." };
  }
}

export async function selectAvatarAction(base: string): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer || !(AVATAR_BASES as readonly string[]).includes(base)) return { ok: false };
  await getRepo().setAvatar(viewer.id, base as AvatarBase);
  revalidatePath("/", "layout");
  return { ok: true };
}
