import { describe, expect, it } from "vitest";
import { rowsFromSheets, validateStudentRows } from "@/lib/student-import";
import { USERNAME_DOMAIN, isUsernameAccount, loginEmail, loginLabel } from "@/lib/usernames";
import { loginSchema } from "@/lib/validation";

const row = (row: number, name: string, login: string, password = "", group = "") => ({ row, name, login, password, group });

describe("cuentas con usuario", () => {
  it("un usuario se vuelve un correo interno que nunca recibe mensajes; un correo se deja igual", () => {
    expect(loginEmail("Luna.Perez")).toBe(`luna.perez@${USERNAME_DOMAIN}`);
    expect(loginEmail(" tomas@colegio.edu.co ")).toBe("tomas@colegio.edu.co");
    expect(USERNAME_DOMAIN.endsWith(".invalid")).toBe(true);
    expect(loginEmail("lú")).toBeNull();
    expect(loginEmail("ab")).toBeNull();
    expect(loginEmail("mal@correo")).toBeNull();
    expect(loginLabel(`luna.perez@${USERNAME_DOMAIN}`)).toBe("luna.perez");
    expect(isUsernameAccount("luna@gmail.com")).toBe(false);
  });

  it("el ingreso acepta el correo o el usuario", () => {
    expect(loginSchema.parse({ email: "luna.perez", password: "x" }).email).toBe(`luna.perez@${USERNAME_DOMAIN}`);
    expect(loginSchema.parse({ email: "Ana@Correo.co", password: "x" }).email).toBe("ana@correo.co");
    expect(loginSchema.safeParse({ email: "¿?", password: "x" }).success).toBe(false);
  });
});

describe("carga masiva de estudiantes", () => {
  it("valida nombre, usuario, contraseña y grupo, e ignora las filas vacías", () => {
    const { ok, errors } = validateStudentRows([
      row(2, "Luna Pérez", "luna.perez", "Luna2027", "abc234"),
      row(3, "Tomás Ruiz", "tomas@colegio.edu.co"),
      row(4, "", ""),
      row(5, "X", "corto"),
      row(6, "Sara", "sara.g", "solo-letras"),
      row(7, "Otra Luna", "LUNA.PEREZ"),
      row(8, "Pedro", "pedro.m", "", "ABC"),
    ]);
    expect(ok.map((r) => [r.row, r.login, r.password, r.group])).toEqual([[2, "luna.perez", "Luna2027", "ABC234"], [3, "tomas@colegio.edu.co", null, null]]);
    expect(errors.map((e) => e.row)).toEqual([5, 6, 7, 8]);
    expect(errors.find((e) => e.row === 7)?.message).toMatch(/repetido \(fila 2\)/);
  });

  it("lee la hoja «Estudiantes» por el título de sus columnas", () => {
    const r = rowsFromSheets([
      { sheet: "Instrucciones", data: [["Cómo cargar"]] },
      { sheet: "Estudiantes", data: [["Código de grupo", "Nombre", "Usuario o correo", "Contraseña"], ["ABC234", "Luna", "luna.p", 2027]] },
    ]);
    expect(r).toEqual({ rows: [{ row: 2, name: "Luna", login: "luna.p", password: "2027", group: "ABC234" }] });
    expect(rowsFromSheets([{ sheet: "Hoja1", data: [["A", "B"]] }])).toHaveProperty("error");
  });
});
