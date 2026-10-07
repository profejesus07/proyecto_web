import writeXlsxFile from "write-excel-file/node";
import { getViewer } from "@/lib/auth";
import { templateSheets } from "@/lib/excel-template";
import { isAdmin } from "@/lib/roles";

/** Plantilla de Excel para cargar cursos y clases (solo el administrador). */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer || !isAdmin(viewer.role)) return new Response("No autorizado", { status: 403 });
  const sheets = templateSheets().map((s) => ({ sheet: s.sheet, data: s.data, columns: s.columns }));
  const buffer = await writeXlsxFile(sheets as Parameters<typeof writeXlsxFile>[0] & unknown[]).toBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-curso-unex-academy.xlsx"',
      "Cache-Control": "private, no-store",
    },
  });
}
