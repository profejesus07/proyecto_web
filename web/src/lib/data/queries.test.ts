import { describe, expect, it } from "vitest";
import type { CourseDetail, ProgressRow } from "./types";
import { buildCourseView } from "./queries";

const course: CourseDetail = {
  slug: "c", title: "C", summary: "", element: "naturaleza", guardian: "petrox", position: 1, price: 20000,
  kind: "curso", area: null, grade: null, schoolYear: null, accessUntil: null, hours: 8, trainerName: "T", trainerTitle: "Mgtr.", isFree: false, modules: [],
  missions: [1, 2, 3, 4].map((n) => ({ id: `m${n}`, courseSlug: "c", position: n, title: `M${n}`, intro: "", xpReward: 10, isBoss: n === 4, period: null, moduleId: null, lessonKind: "reto" as const, body: "", videoUrl: null })),
};
const done = (id: string, score = 100): ProgressRow => ({ missionId: id, bestScore: score, attempts: 1, completed: true });

describe("buildCourseView con acceso al curso", () => {
  it("al inicio solo la primera misión está disponible", () => {
    const v = buildCourseView(course, [], [], true);
    expect(v.missions.map((m) => m.state)).toEqual(["disponible", "bloqueada", "bloqueada", "bloqueada"]);
    expect(v.missions.map((m) => m.lock)).toEqual([null, "orden", "orden", "orden"]);
    expect(v.status).toBe("nuevo");
    expect(v.next?.id).toBe("m1");
  });

  it("las misiones se desbloquean en orden", () => {
    const v = buildCourseView(course, [done("m1"), done("m2")], [], true);
    expect(v.missions.map((m) => m.state)).toEqual(["completada", "completada", "disponible", "bloqueada"]);
    expect(v.done).toBe(2);
    expect(v.status).toBe("en-curso");
  });

  it("una misión intentada pero no superada sigue disponible", () => {
    const v = buildCourseView(course, [{ missionId: "m1", bestScore: 40, attempts: 2, completed: false }], [], true);
    expect(v.missions[0]).toMatchObject({ state: "disponible", bestScore: 40, attempts: 2 });
  });

  it("un dato inconsistente (m3 hecha sin m1 ni m2) no desbloquea m2", () => {
    const v = buildCourseView(course, [done("m3")], [], true);
    expect(v.missions.map((m) => m.state)).toEqual(["disponible", "bloqueada", "completada", "bloqueada"]);
    expect(v.next?.id).toBe("m1");
  });

  it("portal completo con Guardián vencido", () => {
    const v = buildCourseView(course, ["m1", "m2", "m3", "m4"].map((id) => done(id)), ["c"], true);
    expect(v).toMatchObject({ status: "completado", bossDefeated: true, next: null, needsSubscription: false });
  });
});

describe("buildCourseView sin suscripción", () => {
  it("la primera lección es gratis y las demás piden suscribirse", () => {
    const v = buildCourseView(course, [], [], false);
    expect(v.missions.map((m) => m.state)).toEqual(["disponible", "bloqueada", "bloqueada", "bloqueada"]);
    expect(v.missions.map((m) => m.lock)).toEqual([null, "suscripcion", "suscripcion", "suscripcion"]);
    expect(v.needsSubscription).toBe(false);
  });

  it("al terminar la lección gratis, lo siguiente es suscribirse", () => {
    const v = buildCourseView(course, [done("m1")], [], false);
    expect(v.missions[1]).toMatchObject({ state: "bloqueada", lock: "suscripcion" });
    expect(v).toMatchObject({ next: null, needsSubscription: true, hasAccess: false });
  });
});
