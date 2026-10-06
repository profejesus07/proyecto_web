import type { Metadata } from "next";
import Link from "next/link";
import { CreateClassForm } from "@/components/classes-client";
import { GuideFace } from "@/components/guide-face";
import { GuidePicker } from "@/components/guide-picker";
import { Icon } from "@/components/icons";
import { Empty, Kpi, PanelHeader, PanelSection } from "@/components/workspace/ui";
import { MAESTROS } from "@/content/elenco";
import { requireTeacher } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { guideFor } from "@/lib/guides";
import { isAdmin } from "@/lib/roles";

export const metadata: Metadata = { title: "Panel docente" };

export default async function TeacherPage() {
  const viewer = await requireTeacher("/maestro");
  const classes = await getRepo().listTeacherClasses(viewer.id);
  const active = classes.filter((c) => !c.archived);
  const archived = classes.filter((c) => c.archived);
  const guide = guideFor(viewer)!;
  const students = active.reduce((n, c) => n + c.members, 0);

  return (
    <div className="space-y-8">
      <PanelHeader eyebrow={isAdmin(viewer.role) ? "Informes de grupos" : "Panel docente"} title="Tus clases"
        description="Crea una clase, comparte su código y sigue el avance de tus estudiantes.">
        <a href="#nueva-t" className="btn btn-primary btn-sm"><Icon name="plus" className="size-4" /> Nueva clase</a>
      </PanelHeader>

      <dl className="grid gap-4 sm:grid-cols-3">
        <Kpi icon="hash" label="Clases activas" value={active.length} />
        <Kpi icon="people" label="Estudiantes" value={students} tone="ok" hint={active.length ? `${(students / active.length).toFixed(1).replace(".", ",")} por clase` : undefined} />
        <Kpi icon="layers" label="Archivadas" value={archived.length} tone="muted" />
      </dl>

      <section aria-label="Maestro del Gremio" className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
        <GuideFace guide={guide} size={40} />
        <p className="text-sm"><strong>{guide.name}:</strong>{" "}
          {active.length
            ? "abre una clase para ver quién avanza, quién necesita un empujón y qué preguntas les cuestan más."
            : <>empieza creando tu primera clase. Tus estudiantes se unen escribiendo el código en <strong>Perfil → Mis clases</strong>.</>}
        </p>
      </section>

      {active.length === 0 && (
        <section aria-labelledby="nueva-t" className="max-w-2xl scroll-mt-24 space-y-3">
          <h2 id="nueva-t" className="text-lg">Nueva clase</h2>
          <CreateClassForm />
        </section>
      )}

      <PanelSection id="activas-t" title="Clases activas">
        {active.length === 0 ? <Empty icon="hash">Todavía no tienes clases activas.</Empty> : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((c) => (
              <li key={c.id}>
                <Link href={`/maestro/${c.id}`} className="panel group flex h-full flex-col gap-4 p-5 transition hover:border-[#c9c3e6] hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg">{c.name}</h3>
                      <p className="truncate text-sm text-muted">{c.courseTitle ?? "Grupo propio"}</p>
                    </div>
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#efeafe] text-[#4a22c9]"><Icon name="chart" className="size-4" /></span>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-sm">
                    <span className="flex items-center gap-1.5 text-muted"><Icon name="people" className="size-4" /> {c.members} {c.members === 1 ? "estudiante" : "estudiantes"}</span>
                    <span className="font-mono font-bold tracking-[0.2em] text-[#3b1aa6]" aria-label={`Código ${c.code.split("").join(" ")}`}>{c.code}</span>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-[#4a22c9]">Ver informe <Icon name="arrow" className="size-4 transition group-hover:translate-x-0.5" /></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>

      {active.length > 0 && (
        <section aria-labelledby="nueva-t" className="max-w-2xl scroll-mt-24 space-y-3">
          <h2 id="nueva-t" className="text-lg">Nueva clase</h2>
          <CreateClassForm />
        </section>
      )}
      {archived.length > 0 && (
        <details className="panel p-5">
          <summary className="cursor-pointer font-semibold">Clases archivadas ({archived.length})</summary>
          <ul className="mt-3 divide-y divide-line">
            {archived.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link href={`/maestro/${c.id}`} className="font-medium hover:text-[#4a22c9] hover:underline">{c.name}</Link>
                <span className="text-muted">{c.members} estudiantes</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {!isAdmin(viewer.role) && (
        <section aria-labelledby="retrato-t" className="panel space-y-3 p-5">
          <div>
            <h2 id="retrato-t" className="text-lg">Tu retrato en el Gremio</h2>
            <p className="text-sm text-muted">Elige el Maestro que te representa en la cabecera del juego y en tus informes.</p>
          </div>
          <GuidePicker options={MAESTROS} current={guide.id} legend="Maestro del Gremio" />
        </section>
      )}
    </div>
  );
}
