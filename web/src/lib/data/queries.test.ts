import { describe, expect, it } from "vitest";
import type { CourseDetail, ProgressRow } from "./types";


import { buildCourseView } from "./queries";

const course: CourseDetail = {
  slug: "c", title: "C", summary: "", element: "naturaleza", guardian: "petrox", position: 1,
  missions: [1, 2, 3, 4].map((n) => ({ id: `m${n}`, courseSlug: "c", position: n, title: `M${n}`, intro: "", xpReward: 10, isBoss: n === 4 })),
};
const done = (id: string, score = 100): ProgressRow => ({ missionId: id, bestScore: score, attempts: 1, completed: true });

describe("buildCourseView", () => {
  it("al inicio solo la primera misión está disponible", () => {
    const v = buildCourseView(course, [], []);
    expect(v.missions.map((m) => m.state)).toEqual(["disponible", "bloqueada", "bloqueada", "bloqueada"]);
    expect(v.status).toBe("nuevo");
    expect(v.next?.id).toBe("m1");
  });

  it("las misiones se desbloquean en orden", () => {
    const v = buildCourseView(course, [done("m1"), done("m2")], []);
    expect(v.missions.map((m) => m.state)).toEqual(["completada", "completada", "disponible", "bloqueada"]);
    expect(v.done).toBe(2);
    expect(v.status).toBe("en-curso");
  });

  it("una misión intentada pero no superada sigue disponible", () => {
    const v = buildCourseView(course, [{ missionId: "m1", bestScore: 40, attempts: 2, completed: false }], []);
    expect(v.missions[0]).toMatchObject({ state: "disponible", bestScore: 40, attempts: 2 });
  });

  it("un dato inconsistente (m3 hecha sin m1 ni m2) no desbloquea m2", () => {
    const v = buildCourseView(course, [done("m3")], []);
    expect(v.missions.map((m) => m.state)).toEqual(["disponible", "bloqueada", "completada", "bloqueada"]);
    expect(v.next?.id).toBe("m1");
  });

  it("portal completo con Guardián vencido", () => {
    const v = buildCourseView(course, ["m1", "m2", "m3", "m4"].map((id) => done(id)), ["c"]);
    expect(v.status).toBe("completado");
    expect(v.bossDefeated).toBe(true);
    expect(v.next).toBeNull();
  });
});
