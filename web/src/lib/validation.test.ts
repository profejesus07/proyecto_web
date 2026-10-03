import { describe, expect, it } from "vitest";
import { PASSWORD_RULES, registerSchema } from "./validation";

const base = { displayName: "Luna", email: "luna@correo.com", role: "estudiante", consent: "on" };
const ok = (password: string) => registerSchema.safeParse({ ...base, password }).success;

describe("contraseña nueva", () => {
  it("pide 8 caracteres con letras y números", () => {
    expect(ok("estrella7")).toBe(true);
    expect(ok("ESTRELLA2026")).toBe(true);
    expect(ok("estrella")).toBe(false); // sin número
    expect(ok("12345678")).toBe(false); // sin letra
    expect(ok("luna7")).toBe(false); // corta
    expect(ok("a1".repeat(37))).toBe(false); // más de 72
  });

  it("explica en español qué falta", () => {
    const r = registerSchema.safeParse({ ...base, password: "estrellas" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("La contraseña necesita al menos un número.");
  });

  it("las reglas que ve el formulario coinciden con las del servidor", () => {
    for (const p of ["estrella7", "estrella", "12345678", "luna7", "ñandú123", "ññññ1234"]) {
      expect(PASSWORD_RULES.every((r) => r.test(p))).toBe(ok(p));
    }
  });
});
