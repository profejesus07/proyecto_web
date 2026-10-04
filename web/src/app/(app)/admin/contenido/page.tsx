import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { NewCourseForm } from "@/components/editor-client";
import { Sprite, asset } from "@/components/sprite";
import { PageTitle } from "@/components/ui";
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
      <PageTitle eyebrow="Panel del administrador" title="Contenido">
        <p>Crea clases y cursos cortos, sus lecciones y preguntas. Nada se ve hasta que lo publiques.</p>
      </PageTitle>
      <AdminNav current="contenido" />

      <section aria-labelledby="nuevo-t" className="max-w-3xl space-y-3">
        <h2 id="nuevo-t" className="text-2xl">Nuevo portal</h2>
        <NewCourseForm />
      </section>

      {groups.map((g) => {
        const list = courses.filter((c) => c.kind === g.kind);
        return (
          <section key={g.kind} aria-labelledby={`g-${g.kind}`} className="space-y-3">
            <h2 id={`g-${g.kind}`} className="text-2xl">{g.title}</h2>
            {list.length === 0 ? (
              <p className="panel p-5 text-muted">Todavía no hay ninguno.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/admin/contenido/${c.slug}`} className="panel flex h-full items-center gap-3 p-4 transition hover:border-cyan/50">
                      <Sprite src={asset.boss(c.guardian)} alt="" decorative className="size-14 shrink-0 object-contain" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{c.title}</span>
                        <span className="block text-xs text-muted">
                          {KIND_LABEL[c.kind]} · {c.missionCount} {c.missionCount === 1 ? "lección" : "lecciones"}
                          {c.kind === "clase" && c.grade ? ` · ${c.area ?? ""} ${c.grade} ${c.schoolYear ?? ""}` : ""}
                          {c.kind === "curso" && c.hours ? ` · ${c.hours} h` : ""}
                        </span>
                        <span className={`mt-1 inline-block rounded px-1.5 text-xs font-bold ${c.published ? "bg-green/15 text-[#b6f5cb]" : "bg-white/10 text-muted"}`}>{c.published ? "Publicado" : "Borrador"}</span>
                      </span>
                    </Link>
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
