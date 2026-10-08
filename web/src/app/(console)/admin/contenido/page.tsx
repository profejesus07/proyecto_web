import type { Metadata } from "next";
import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { ImportForm, NewCourseForm } from "@/components/editor-client";
import { Sprite, asset } from "@/components/sprite";
import { Icon } from "@/components/icons";
import { PanelHeader } from "@/components/workspace/ui";
import { requireAdmin } from "@/lib/auth";
import { KIND_LABEL } from "@/lib/content";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Contenido" };

export default async function ContentPage() {
  await requireAdmin("/admin/contenido");
  const courses = await getRepo().listAllCourses();
  const groups = [
    { kind: "clase" as const, title: "Clases (por área y periodo)" },
    { kind: "curso" as const, title: "Cursos cortos (educación informal)" },
  ];
  return (
    <div className="space-y-8">
      <PanelHeader title="Contenido" description="Clases y cursos cortos, con sus lecciones y actividades. Nada se ve hasta que lo publiques.">
        <Link href="/admin/cursos" className="btn btn-secondary btn-sm"><Icon name="tag" className="size-4" /> Precios</Link>
      </PanelHeader>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="nuevo-t" className="panel space-y-3 p-5 sm:p-6">
          <h2 id="nuevo-t" className="flex items-center gap-2 text-lg"><Icon name="plus" className="size-5 text-accion" /> Nuevo portal</h2>
          <NewCourseForm />
        </section>
        <section aria-labelledby="importar-t" className="panel space-y-3 p-5 sm:p-6">
          <h2 id="importar-t" className="flex items-center gap-2 text-lg"><Icon name="download" className="size-5 text-accion" /> Importar desde Excel</h2>
          <ImportForm />
        </section>
      </div>

      {groups.map((g) => {
        const list = courses.filter((c) => c.kind === g.kind);
        return (
          <section key={g.kind} aria-labelledby={`g-${g.kind}`} className="space-y-3">
            <h2 id={`g-${g.kind}`} className="text-lg">{g.title} <span className="font-normal text-muted">· {list.length}</span></h2>
            {list.length === 0 ? (
              <p className="panel p-5 text-muted">Todavía no hay ninguno.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((c) => (
                  <li key={c.slug} className="panel flex h-full flex-col transition hover:border-line-fuerte hover:shadow-md">
                    <Link href={`/admin/contenido/${c.slug}`} className="flex flex-1 items-center gap-3 p-4">
                      <Sprite src={asset.boss(c.guardian)} alt="" decorative className="size-14 shrink-0 rounded-lg bg-bg object-contain p-1" />
                      <span className="min-w-0">
                        <span className="block break-words font-semibold">{c.title}</span>
                        <span className="block text-xs text-muted">
                          {KIND_LABEL[c.kind]} · {c.missionCount} {c.missionCount === 1 ? "lección" : "lecciones"}
                          {c.kind === "clase" && c.grade ? ` · ${c.area ?? ""} ${c.grade} ${c.schoolYear ?? ""}` : ""}
                          {c.hours ? ` · ${c.hours} h` : ""}
                        </span>
                        <span className={`badge mt-1.5 ${c.published ? "badge-ok" : "badge-muted"}`}>{c.published ? "Publicado" : "Borrador"}</span>
                      </span>
                    </Link>
                    <div className="flex justify-end border-t border-line px-4 py-2">
                      <DeleteButton kind="curso" id={c.slug} name={c.title} consequences={[
                        "Se borran sus lecciones, sus preguntas y el avance de todos los estudiantes en este curso.",
                        "Se quitan los accesos al curso. Sus pagos quedan en la copia contable y las constancias ya expedidas siguen verificables.",
                        "Los grupos ligados a este curso quedan archivados.",
                        "Si solo quieres ocultarlo, ábrelo y pásalo a borrador.",
                      ]} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
