import { loginEmail, loginLabel } from "@/lib/usernames";
import { newPassword } from "@/lib/validation";

/** Carga masiva de estudiantes (manual o desde Excel): validación de filas y lectura de la plantilla. */
export const MAX_STUDENT_ROWS = 300;

export interface StudentRowIn { name: string; login: string; password: string; group: string }
export interface StudentRow { row: number; name: string; login: string; email: string; password: string | null; group: string | null }
export interface RowError { row: number; message: string }

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();

/** Valida las filas: nombre, usuario o correo, contraseña (opcional) y código de grupo (opcional). */
export function validateStudentRows(rows: (StudentRowIn & { row: number })[]): { ok: StudentRow[]; errors: RowError[] } {
  const ok: StudentRow[] = [];
  const errors: RowError[] = [];
  const seen = new Map<string, number>();
  for (const r of rows) {
    const name = text(r.name).replace(/\s+/g, " ");
    const login = text(r.login).toLowerCase();
    const password = text(r.password);
    const group = text(r.group).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!name && !login && !password && !group) continue; // fila vacía
    if (name.length < 2 || name.length > 24) { errors.push({ row: r.row, message: "El nombre debe tener entre 2 y 24 caracteres (es el que verá en el juego)." }); continue; }
    const email = loginEmail(login);
    if (!email) {
      errors.push({ row: r.row, message: login.includes("@") ? "El correo no es válido." : "El usuario debe tener de 3 a 30 caracteres: letras sin tildes, números, punto, guion o guion bajo." });
      continue;
    }
    if (seen.has(email)) { errors.push({ row: r.row, message: `El usuario o correo está repetido (fila ${seen.get(email)}).` }); continue; }
    if (password) {
      const p = newPassword.safeParse(password);
      if (!p.success) { errors.push({ row: r.row, message: p.error.issues[0]?.message ?? "La contraseña no es válida." }); continue; }
    }
    if (group && group.length !== 6) { errors.push({ row: r.row, message: "El código de grupo tiene 6 caracteres." }); continue; }
    seen.set(email, r.row);
    ok.push({ row: r.row, name, login: loginLabel(email), email, password: password || null, group: group || null });
  }
  if (ok.length + errors.length > MAX_STUDENT_ROWS) return { ok: [], errors: [{ row: 0, message: `Se pueden cargar hasta ${MAX_STUDENT_ROWS} estudiantes por vez.` }] };
  return { ok, errors };
}

type Cell = string | number | boolean | Date | null | undefined;
const HEADERS: Record<keyof StudentRowIn, RegExp> = {
  name: /^nombre/i,
  login: /^(usuario|correo|usuario o correo)/i,
  password: /^contrase/i,
  group: /^(grupo|c[oó]digo)/i,
};

/** Lee la hoja «Estudiantes» (o la primera) de la plantilla: busca las columnas por su título. */
export function rowsFromSheets(sheets: { sheet: string; data: Cell[][] }[]): { rows: (StudentRowIn & { row: number })[] } | { error: string } {
  const sheet = sheets.find((s) => /estudiantes/i.test(s.sheet)) ?? sheets[0];
  if (!sheet || sheet.data.length === 0) return { error: "El archivo está vacío." };
  const head = sheet.data[0].map((c) => text(c));
  const col = Object.fromEntries((Object.keys(HEADERS) as (keyof StudentRowIn)[]).map((k) => [k, head.findIndex((h) => HEADERS[k].test(h))])) as Record<keyof StudentRowIn, number>;
  if (col.name < 0 || col.login < 0) return { error: "No encontramos las columnas «Nombre» y «Usuario o correo». Usa la plantilla." };
  const at = (r: Cell[], i: number) => (i < 0 ? "" : text(r[i]));
  return {
    rows: sheet.data.slice(1).map((r, i) => ({ row: i + 2, name: at(r, col.name), login: at(r, col.login), password: at(r, col.password), group: at(r, col.group) })),
  };
}
