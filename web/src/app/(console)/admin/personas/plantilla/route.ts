import writeXlsxFile from "write-excel-file/node";
import { getViewer } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { MAX_STUDENT_ROWS } from "@/lib/student-import";

const H = (value: string) => ({ value, fontWeight: "bold" as const, backgroundColor: "#241C6E", color: "#FFFFFF" });
const T = (value: string) => ({ value });

/** Plantilla de Excel para cargar estudiantes (solo el administrador). */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer || !isAdmin(viewer.role)) return new Response("No autorizado", { status: 403 });
  const sheets = [
    {
      sheet: "Estudiantes",
      columns: [{ width: 28 }, { width: 30 }, { width: 18 }, { width: 18 }],
      data: [
        [H("Nombre"), H("Usuario o correo"), H("Contraseña"), H("Código de grupo")],
        [T("Luna Pérez"), T("luna.perez"), T("Luna2027"), null],
        [T("Tomás Ruiz"), T("tomas.ruiz@colegio.edu.co"), null, null],
      ],
    },
    {
      sheet: "Instrucciones",
      columns: [{ width: 110 }],
      data: [
        [H("Cómo cargar estudiantes desde Excel")],
        ...[
          "1. Escribe un estudiante por fila en la hoja «Estudiantes». Borra los dos ejemplos.",
          "2. Nombre: el que verá en el juego (de 2 a 24 caracteres). Mejor nombre y un apellido.",
          "3. Usuario o correo: con un usuario (por ejemplo luna.perez) el estudiante entra escribiendo solo ese usuario.",
          "   Usa letras sin tildes, números, punto, guion o guion bajo (3 a 30 caracteres). Con un correo, entra con su correo.",
          "4. Contraseña: al menos 8 caracteres, con letras y números. Si la dejas vacía, la plataforma crea una.",
          "5. Código de grupo (opcional): el código de 6 caracteres de un grupo de «Grupos y códigos». El estudiante queda en ese grupo.",
          "6. En Consola → Personas → «Cargar estudiantes», sube el archivo. Si alguna fila tiene un error, no se crea ninguna cuenta",
          "   y verás la fila exacta para corregirla. Al final puedes descargar la lista con los usuarios y contraseñas.",
          `Hasta ${MAX_STUDENT_ROWS} estudiantes por archivo. Las cuentas de usuario no tienen correo: si olvidan la contraseña, la cambia el administrador.`,
        ].map((t) => [T(t)]),
      ],
    },
  ];
  const buffer = await writeXlsxFile(sheets as unknown as Parameters<typeof writeXlsxFile>[0] & unknown[]).toBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-estudiantes-unex-academy.xlsx"',
      "Cache-Control": "private, no-store",
    },
  });
}
