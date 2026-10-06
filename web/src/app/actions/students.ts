"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import readXlsxFile from "read-excel-file/node";
import { getViewer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { AVATAR_BASES } from "@/lib/data/types";
import { tempPassword } from "@/lib/passwords";
import { isAdmin } from "@/lib/roles";
import { rowsFromSheets, validateStudentRows, type RowError, type StudentRowIn } from "@/lib/student-import";

export interface BulkResultRow { row: number; name: string; login: string; password: string; group: string | null; ok: boolean; message?: string }
export type BulkState = { results?: BulkResultRow[]; errors?: RowError[]; error?: string } | undefined;

const MAX_FILE_BYTES = 2 * 1024 * 1024;

/**
 * Crea las cuentas. Primero se validan todas las filas (y los códigos de grupo): si alguna tiene
 * un error, no se crea ninguna, para corregir el archivo y volver a subirlo completo.
 */
async function createAll(rows: (StudentRowIn & { row: number })[]): Promise<BulkState> {
  const viewer = await getViewer();
  if (!viewer || !isAdmin(viewer.role)) return { error: "Solo el administrador puede cargar estudiantes." };
  const { ok, errors } = validateStudentRows(rows);
  if (errors.length) return { errors };
  if (!ok.length) return { error: "No hay estudiantes para cargar." };

  const repo = getRepo();
  const groups = new Map((await repo.adminClasses(viewer.id)).filter((c) => !c.archived).map((c) => [c.code, c]));
  const unknown = ok.filter((r) => r.group && !groups.has(r.group)).map((r) => ({ row: r.row, message: `No hay un grupo activo con el código ${r.group}.` }));
  if (unknown.length) return { errors: unknown };

  const results: BulkResultRow[] = [];
  for (const r of ok) {
    const password = r.password ?? tempPassword();
    const group = r.group ? groups.get(r.group)! : null;
    try {
      const { id } = await repo.createStudentAccount(r.email, r.name, password, AVATAR_BASES[randomInt(AVATAR_BASES.length)]);
      let message: string | undefined;
      if (group) {
        try {
          await repo.joinClass(id, group.code);
        } catch {
          message = `Cuenta creada, pero no se pudo asignar a «${group.name}».`;
        }
      }
      results.push({ row: r.row, name: r.name, login: r.login, password, group: group?.name ?? null, ok: true, message });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      results.push({ row: r.row, name: r.name, login: r.login, password: "", group: null, ok: false,
        message: /already|registered|exists/i.test(msg) ? "Ese usuario o correo ya tiene cuenta." : "No se pudo crear la cuenta." });
    }
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/maestro", "layout");
  return { results };
}

/** Carga manual: las filas escritas en la tabla de la consola. */
export async function createStudentsAction(rows: StudentRowIn[]): Promise<BulkState> {
  if (!Array.isArray(rows)) return { error: "No hay estudiantes para cargar." };
  return createAll(rows.slice(0, 400).map((r, i) => ({
    row: i + 1, name: String(r?.name ?? ""), login: String(r?.login ?? ""), password: String(r?.password ?? ""), group: String(r?.group ?? ""),
  })));
}

/** Carga desde Excel, con la plantilla de la consola. */
export async function importStudentsAction(_prev: BulkState, formData: FormData): Promise<BulkState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Elige el archivo de Excel." };
  if (file.size > MAX_FILE_BYTES) return { error: "El archivo pesa más de 2 MB." };
  if (!/\.xlsx$/i.test(file.name)) return { error: "El archivo debe ser de Excel (.xlsx)." };
  let sheets;
  try {
    sheets = (await readXlsxFile(Buffer.from(await file.arrayBuffer()))) as Parameters<typeof rowsFromSheets>[0];
  } catch {
    return { error: "No pudimos leer el archivo. Revisa que sea un Excel (.xlsx) basado en la plantilla." };
  }
  const parsed = rowsFromSheets(sheets);
  if ("error" in parsed) return { error: parsed.error };
  return createAll(parsed.rows);
}
