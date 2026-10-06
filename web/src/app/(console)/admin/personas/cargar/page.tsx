import type { Metadata } from "next";
import Link from "next/link";
import { BulkStudents } from "@/components/bulk-students";
import { Icon } from "@/components/icons";
import { PanelHeader } from "@/components/workspace/ui";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { MAX_STUDENT_ROWS } from "@/lib/student-import";

export const metadata: Metadata = { title: "Cargar estudiantes · Consola" };

export default async function LoadStudentsPage() {
  const viewer = await requireAdmin("/admin/personas/cargar");
  const groups = (await getRepo().adminClasses(viewer.id)).filter((c) => !c.archived).map((c) => ({ code: c.code, name: `${c.name} · ${c.teacher}` }));
  return (
    <div className="space-y-8">
      <Link href="/admin/personas" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text print:hidden"><Icon name="arrow" className="size-4 rotate-180" /> Personas</Link>
      <PanelHeader title="Cargar estudiantes" description={`Crea varias cuentas a la vez, con usuario (o correo) y contraseña, y asígnalas a un grupo. Hasta ${MAX_STUDENT_ROWS} por vez.`} />
      <div className="grid gap-3 text-sm sm:grid-cols-3 print:hidden">
        {[
          { icon: "user" as const, title: "Usuario o correo", text: "Con un usuario (luna.perez) el estudiante entra escribiendo solo eso; no necesita correo." },
          { icon: "key" as const, title: "Contraseña", text: "Escríbela tú o déjala vacía y se genera una segura. Se muestra una sola vez." },
          { icon: "people" as const, title: "Grupo", text: "Opcional: el estudiante queda en ese grupo y su docente lo supervisa desde ya." },
        ].map((t) => (
          <div key={t.title} className="flex gap-3 rounded-xl border border-line bg-white p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#efeafe] text-[#4a22c9]"><Icon name={t.icon} className="size-4" /></span>
            <span><strong className="block">{t.title}</strong><span className="text-muted">{t.text}</span></span>
          </div>
        ))}
      </div>
      <section aria-label="Cargar estudiantes" className="panel p-5 sm:p-6"><BulkStudents groups={groups} /></section>
    </div>
  );
}
