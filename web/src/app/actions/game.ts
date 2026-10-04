"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { FREE_FRAME, canWearGear, equippedItems, sanitizeLook } from "@/lib/avatar-look";
import { chapterById, chaptersUnlockedBy } from "@/content/cronicas";
import { getRepo } from "@/lib/data";
import { AVATAR_BASES, type PowerResult, type AnswerResult, type AvatarBase, type CompleteResult } from "@/lib/data/types";
import { AIDS, type AidKind } from "@/lib/game/aids";
import { PASS_MARK } from "@/lib/game/grading";
import { POWERS, type PowerKind } from "@/lib/game/powers";
import { rankForXp, ranksReached } from "@/lib/game/ranks";
import { itemsOnFirstCompletion } from "@/lib/game/rewards";
import { RARITY, consumableRule, getItem, isForSale, itemImage, priceOf } from "@/lib/catalog";
import { answerSchema, displayName, submitSchema } from "@/lib/validation";

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
  | { ok: true; passMark: number; review: ReviewRow[]; result: CompleteResult; newRanks: string[]; items: GrantedItem[]; chronicles: { id: string; title: string }[] }
  | { ok: false; error: string };

const MESSAGES: Record<string, string> = {
  mision_bloqueada: "Esta misión todavía está bloqueada. Termina primero las anteriores.",
  requiere_suscripcion: "Esta misión es parte del curso completo. Suscríbete al curso para continuar.",
  mision_no_encontrada: "No encontramos esa misión.",
  respuestas_incompletas: "Falta responder alguna pregunta.",
  sin_intento: "Empieza la misión respondiendo la primera pregunta.",
  pregunta_invalida: "Esa pregunta no existe.",
  respuesta_invalida: "Esa opción no existe.",
  sin_preguntas: "Esta misión aún no tiene preguntas.",
};

function friendly(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : "";
  for (const [k, v] of Object.entries(MESSAGES)) if (msg.includes(k)) return v;
  return fallback;
}

export type AnswerOutcome = ({ ok: true } & AnswerResult) | { ok: false; error: string };

/** Responde una pregunta. El servidor la revisa al momento y la respuesta queda fija. */
export async function answerQuestionAction(missionId: string, index: number, choice: number): Promise<AnswerOutcome> {
  const parsed = answerSchema.safeParse({ missionId, index, choice });
  if (!parsed.success) return { ok: false, error: "No pudimos leer tu respuesta." };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Tu sesión terminó. Vuelve a ingresar para guardar tu avance." };
  try {
    const r = await getRepo().answerQuestion(viewer.id, parsed.data.missionId, parsed.data.index, parsed.data.choice);
    return { ok: true, ...r };
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos guardar tu respuesta. Inténtalo de nuevo.") };
  }
}

/** Termina la misión con las respuestas ya guardadas en el servidor. */
export async function submitMissionAction(missionId: string): Promise<SubmitOutcome> {
  const parsed = submitSchema.safeParse({ missionId });
  if (!parsed.success) return { ok: false, error: "No encontramos esa misión." };

  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Tu sesión terminó. Vuelve a ingresar para guardar tu avance." };

  try {
    const repo = getRepo();
    const play = await repo.getMissionPlay(parsed.data.missionId);
    if (!play) return { ok: false, error: MESSAGES.mision_no_encontrada };
    const key = await repo.getAnswerKey(parsed.data.missionId);
    const total = (await repo.getCourse(play.course.slug))?.missions.length ?? play.mission.position;
    const progress = await repo.getProgress(viewer.id);
    const items = itemsOnFirstCompletion({
      isBoss: play.mission.isBoss,
      guardian: play.course.guardian,
      element: play.course.element,
      xpBefore: viewer.xp,
      xpGain: play.mission.xpReward,
      firstEver: !progress.some((p) => p.completed),
    });
    const result = await repo.finishAttempt(viewer.id, play.mission.id, PASS_MARK, items);

    revalidatePath("/gremio");
    revalidatePath("/portales", "layout");
    revalidatePath("/perfil");
    revalidatePath("/tienda");
    revalidatePath("/cronicas", "layout");

    const { answers, ...rest } = result;
    return {
      ok: true,
      passMark: PASS_MARK,
      review: key.map((k, i) => ({ correct: answers[i] === k.correctIndex, chosen: answers[i] ?? -1, correctIndex: k.correctIndex, explanation: k.explanation })),
      result: rest,
      newRanks: result.first ? ranksReached(viewer.xp, result.xp).map((r) => r.key) : [],
      chronicles: result.first ? chaptersUnlockedBy(play.course.guardian, play.mission.position, total).map((c) => ({ id: c.id, title: c.title })) : [],
      items: result.granted.flatMap((id) => {
        const it = getItem(id);
        return it ? [{ id, name: it.nombre, alt: it.alt, image: itemImage(it), rarity: RARITY[it.rareza].label, color: RARITY[it.rareza].color }] : [];
      }),
    };
  } catch (e) {
    return { ok: false, error: friendly(e, "No pudimos guardar tu resultado. Inténtalo de nuevo.") };
  }
}

export type BuyOutcome = { ok: true; coins: number; name: string; quantity?: number } | { ok: false; error: string };

export async function buyItemAction(itemId: string): Promise<BuyOutcome> {
  const aid = typeof itemId === "string" ? consumableRule(itemId) : undefined;
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Tu sesión terminó. Vuelve a ingresar." };
  const item = typeof itemId === "string" ? getItem(itemId) : undefined;
  const price = item ? priceOf(item) : null;
  if (!item || price === null || !isForSale(item)) {
    return { ok: false, error: "Ese objeto no está a la venta." };
  }
  if (aid) {
    if (viewer.xp < aid.minXp) return { ok: false, error: `Se desbloquea al llegar al rango ${aid.minRank}.` };
    try {
      const { coins, quantity } = await getRepo().buyConsumable(viewer.id, item.id, price, aid.maxStock);
      revalidatePath("/tienda");
      revalidatePath("/gremio");
      revalidatePath("/perfil");
      return { ok: true, coins, name: item.nombre, quantity };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("reserva_llena")) return { ok: false, error: `Ya llevas el máximo (${aid.maxStock}). Úsalas en tus misiones.` };
      if (msg.includes("monedas_insuficientes")) return { ok: false, error: "Te faltan monedas. ¡Completa misiones para ganar más!" };
      return { ok: false, error: "No pudimos completar la compra. Inténtalo de nuevo." };
    }
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

export type AidOutcome =
  | { ok: true; kind: AidKind; hint?: string; removed?: number[]; free: boolean; charged: boolean; left: number }
  | { ok: false; error: string };

const AID_MESSAGES: Record<string, string> = {
  sin_unidades: "No te quedan. Consigue más en la tienda.",
  tope_diario: "Ya usaste el máximo de hoy. Mañana podrás usar más.",
  rango_insuficiente: "Esta ayuda se desbloquea en un rango más alto.",
  sin_pista: "Esta pregunta no tiene pista.",
  no_aplica: "Esta ayuda no sirve en esta pregunta.",
  mision_bloqueada: MESSAGES.mision_bloqueada,
  requiere_suscripcion: MESSAGES.requiere_suscripcion,
  pregunta_no_encontrada: "No encontramos esa pregunta.",
};

/** Usa una Pista o un 50/50 en una pregunta. El servidor decide si cobra y qué revela. */
export async function activateAidAction(questionId: string, kind: string): Promise<AidOutcome> {
  if (typeof questionId !== "string" || questionId.length < 1 || questionId.length > 64 || !(kind in AIDS)) {
    return { ok: false, error: "No pudimos usar esa ayuda." };
  }
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Tu sesión terminó. Vuelve a ingresar." };
  const rule = AIDS[kind as AidKind];
  try {
    const r = await getRepo().useAid(viewer.id, questionId, rule.itemId, rule.dailyCap, rule.minXp);
    if (r.charged) revalidatePath("/tienda");
    return { ok: true, kind: rule.kind, ...r };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    for (const [k, v] of Object.entries(AID_MESSAGES)) if (msg.includes(k)) return { ok: false, error: v };
    return { ok: false, error: "No pudimos usar esa ayuda. Inténtalo de nuevo." };
  }
}

const POWER_MESSAGES: Record<string, string> = {
  rango_insuficiente: "Todavía no tienes el rango para usar ese poder.",
  sin_unidades: "No te quedan unidades de ese poder. Consíguelas en la tienda.",
  tope_diario: "Ya usaste ese poder las veces permitidas hoy. ¡Mañana puedes volver a usarlo!",
  ya_respondida: "Ese poder se usa antes de responder la pregunta.",
  no_aplica: "Ese poder no sirve en esta pregunta.",
  sin_pista: "Esta pregunta no tiene pista que iluminar.",
  sin_recuerdos: "Aún no has visto pistas en esta misión: no hay nada que recordar.",
  sin_jugada: "Tu sombra no recuerda esta pregunta: todavía no la habías acertado.",
  no_lo_tienes: "Ese poder se gana al llegar al rango S.",
  ya_usado: "Ya usaste el Segundo Aliento en esta pregunta hoy.",
  mision_bloqueada: "Esta misión todavía está bloqueada.",
};

export type PowerOutcome = ({ ok: true; kind: PowerKind } & PowerResult) | { ok: false; error: string };

/** Usa un poder en una pregunta de la misión (la base de datos aplica todas las reglas). */
export async function activatePowerAction(missionId: string, index: number, kind: string): Promise<PowerOutcome> {
  if (typeof missionId !== "string" || missionId.length > 64 || !Number.isInteger(index) || index < 0 || !(kind in POWERS)) {
    return { ok: false, error: "No pudimos usar ese poder." };
  }
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Tu sesión terminó. Vuelve a ingresar." };
  const rule = POWERS[kind as PowerKind];
  try {
    const r = await getRepo().usePower(viewer.id, missionId, index, rule.itemId, rule.dailyCap, rule.minXp);
    if (r.charged) revalidatePath("/tienda");
    return { ok: true, kind: rule.kind, ...r };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    for (const [k, v] of Object.entries(POWER_MESSAGES)) if (msg.includes(k)) return { ok: false, error: v };
    return { ok: false, error: "No pudimos usar ese poder. Inténtalo de nuevo." };
  }
}

/** Guarda el avatar del Vestidor: personaje, colores y atuendo (solo de rangos alcanzados). */
export async function saveAvatarAction(base: string, rawLook: unknown): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer || !(AVATAR_BASES as readonly string[]).includes(base)) return { ok: false };
  const look = sanitizeLook(rawLook);
  if (look.gear && !canWearGear(look.gear, rankForXp(viewer.xp).key)) return { ok: false };
  // Solo se puede llevar lo que se tiene (el marco básico es de todos).
  const wanted = equippedItems(look).filter((id) => id !== FREE_FRAME);
  if (wanted.length) {
    const owned = new Set((await getRepo().getInventory(viewer.id)).map((i) => i.itemId));
    if (wanted.some((id) => !owned.has(id))) return { ok: false };
  }
  await getRepo().setAvatar(viewer.id, base as AvatarBase, look);
  revalidatePath("/", "layout");
  return { ok: true };
}

export type NameState = { ok: boolean; message: string } | null;

/** Cambia el nombre de aventurero (el que ven el docente y el Gremio). */
export async function updateDisplayNameAction(_prev: NameState, form: FormData): Promise<NameState> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Tu sesión terminó. Vuelve a ingresar." };
  const parsed = displayName.safeParse(form.get("displayName"));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Nombre no válido." };
  if (parsed.data !== viewer.displayName) await getRepo().setDisplayName(viewer.id, parsed.data);
  revalidatePath("/", "layout");
  return { ok: true, message: "¡Listo! Tu nombre se actualizó." };
}

/** La bienvenida de Sora ya se vio (no vuelve a aparecer sola). */
export async function markIntroSeenAction(): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  await getRepo().markIntroSeen(viewer.id);
  revalidatePath("/gremio");
  return { ok: true };
}

/** Marca un capítulo de las Crónicas como leído (solo si existe). */
export async function markChapterReadAction(id: string): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer || typeof id !== "string" || !chapterById(id)) return { ok: false };
  if (!viewer.chroniclesRead.includes(id)) await getRepo().markChapterRead(viewer.id, id);
  return { ok: true };
}
