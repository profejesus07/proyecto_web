import { beforeEach, describe, expect, it, vi } from "vitest";

// Comprueba cómo el repositorio real habla con Supabase, con un cliente falso que registra las consultas.
type Call = { table: string; select?: string; eq: [string, unknown][]; order?: string };
const calls: Call[] = [];
const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];
const tables: Record<string, unknown[]> = {};
let rpcResult: { data: unknown; error: { message: string } | null } = { data: null, error: null };

function builder(table: string) {
  const call: Call = { table, eq: [] };
  calls.push(call);
  const rows = () => (tables[table] ?? []).filter((r) => call.eq.every(([k, v]) => (r as Record<string, unknown>)[k] === v));
  const b: Record<string, unknown> = {
    select: (cols: string) => { call.select = cols; return b; },
    eq: (k: string, v: unknown) => { call.eq.push([k, v]); return b; },
    order: (col: string) => { call.order = col; return b; },
    maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
    then: (res: (v: unknown) => unknown) => res({ data: rows(), error: null }),
  };
  return b;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (t: string) => builder(t),
    rpc: async (fn: string, args: Record<string, unknown>) => { rpcCalls.push({ fn, args }); return rpcResult; },
  }),
}));

import { createSupabaseRepo } from "@/lib/data/supabase-repo";

beforeEach(() => {
  calls.length = 0;
  rpcCalls.length = 0;
  for (const k of Object.keys(tables)) delete tables[k];
  rpcResult = { data: null, error: null };
});

describe("repositorio de Supabase", () => {
  it("las preguntas que se muestran NUNCA piden la respuesta correcta ni la explicación", async () => {
    tables.missions = [{ id: "m1", course_slug: "c", position: 1, title: "t", intro: "i", xp_reward: 10, is_boss: false }];
    tables.courses = [{ slug: "c", title: "C", summary: "s", element: "luz", guardian: "petrox", position: 1, published: true }];
    tables.questions = [{ id: "q1", mission_id: "m1", position: 1, prompt: "p", options: ["a", "b"], hint: "h", correct_index: 1, explanation: "x" }];
    const play = await createSupabaseRepo().getMissionPlay("m1");
    const q = calls.find((c) => c.table === "questions")!;
    expect(q.select).toBe("id,position,prompt,options,hint");
    expect(q.select).not.toMatch(/correct|explanation|\*/);
    expect(play?.questions[0]).toEqual({ id: "q1", position: 1, prompt: "p", options: ["a", "b"], hasHint: true });
    expect(JSON.stringify(play)).not.toContain('"h"');
  });

  it("solo lista cursos publicados", async () => {
    tables.courses = [{ slug: "a", title: "A", summary: "", element: "luz", guardian: "petrox", position: 1, published: true }];
    await createSupabaseRepo().listCourses();
    expect(calls[0].eq).toContainEqual(["published", true]);
  });

  it("convierte el perfil y sanea un avatar desconocido", async () => {
    tables.profiles = [{ id: "u", role: "docente", display_name: "Ana", avatar: { base: "hacker" }, xp: 5, coins: 6, gems: 7, streak: 2 }];
    const p = await createSupabaseRepo().getProfile("u");
    expect(p).toEqual({ id: "u", role: "docente", displayName: "Ana", avatarBase: "aria", xp: 5, coins: 6, gems: 7, streak: 2 });
  });

  it("devuelve null si el perfil no existe", async () => {
    expect(await createSupabaseRepo().getProfile("nadie")).toBeNull();
  });

  it("completa la misión con la función de la base de datos y convierte la respuesta", async () => {
    rpcResult = { data: { passed: true, first: true, score: 100, xp_gain: 60, coins_gain: 20, gems_gain: 0, xp: 60, coins: 60, gems: 0, streak: 1, boss_defeated: false, course_done: false, granted: ["obj_x"] }, error: null };
    const r = await createSupabaseRepo().completeMission("u", "m", 100, 70, ["obj_x"]);
    expect(rpcCalls[0]).toEqual({ fn: "complete_mission", args: { p_user: "u", p_mission: "m", p_score: 100, p_pass_mark: 70, p_items_on_first: ["obj_x"] } });
    expect(r).toMatchObject({ passed: true, first: true, xpGain: 60, coinsGain: 20, granted: ["obj_x"] });
  });

  it("propaga el error de la base de datos para poder explicarlo", async () => {
    rpcResult = { data: null, error: { message: "mision_bloqueada" } };
    await expect(createSupabaseRepo().completeMission("u", "m", 100, 70, [])).rejects.toThrow(/mision_bloqueada/);
  });

  it("compra con la función atómica", async () => {
    rpcResult = { data: { coins: 80, item: "obj_ayuda_pista" }, error: null };
    expect(await createSupabaseRepo().purchaseItem("u", "obj_ayuda_pista", 20)).toEqual({ coins: 80 });
    expect(rpcCalls[0].fn).toBe("purchase_item");
  });

  it("usa ayudas con la función de la base de datos", async () => {
    rpcResult = { data: { removed: [0, 2], free: false, charged: true, left: 3 }, error: null };
    const r = await createSupabaseRepo().useAid("u", "q1", "obj_ayuda_5050", 5, 150);
    expect(rpcCalls[0]).toEqual({ fn: "use_aid", args: { p_user: "u", p_question: "q1", p_item: "obj_ayuda_5050", p_daily_cap: 5, p_min_xp: 150 } });
    expect(r).toEqual({ hint: undefined, removed: [0, 2], free: false, charged: true, left: 3 });
  });

  it("compra ayudas acumulables", async () => {
    rpcResult = { data: { coins: 20, quantity: 2 }, error: null };
    expect(await createSupabaseRepo().buyConsumable("u", "obj_ayuda_pista", 20, 20)).toEqual({ coins: 20, quantity: 2 });
    expect(rpcCalls[0]).toEqual({ fn: "buy_consumable", args: { p_user: "u", p_item: "obj_ayuda_pista", p_price: 20, p_max: 20 } });
  });
});
