import type { Metadata } from "next";
import Link from "next/link";
import { CreateClassForm } from "@/components/classes-client";
import { SpeechBubble } from "@/components/dialogue";
import { asset } from "@/components/sprite";
import { PageTitle } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Maestro del Gremio" };

export default async function TeacherPage() {
  const viewer = await requireTeacher("/maestro");
  const classes = await getRepo().listTeacherClasses(viewer.id);
  const active = classes.filter((c) => !c.archived);
  const archived = classes.filter((c) => c.archived);

  return (
    <div className="space-y-8">
      <PageTitle eyebrow="Maestro del Gremio" title="Tus clases">
        <p>Crea una clase, comparte su código y sigue el avance de tus estudiantes en cada portal.</p>
      </PageTitle>

      <SpeechBubble name="Maestra Sora" src={asset.sora(active.length ? "senalar" : "saludar")} alt="La Maestra Sora" className="max-w-3xl">
        {active.length
          ? "Abre una clase para ver quién avanza, quién necesita un empujón y qué preguntas les cuestan más."
          : <>Bienvenido, Maestro del Gremio. Empieza creando tu primera clase: tus estudiantes se unen escribiendo el código en <strong>Perfil → Mis clases</strong>.</>}
      </SpeechBubble>

      <section aria-labelledby="nueva-t" className="max-w-2xl space-y-3">
        <h2 id="nueva-t" className="text-2xl">Nueva clase</h2>
        <CreateClassForm />
      </section>

      {active.length > 0 && (
        <section aria-labelledby="activas-t" className="space-y-3">
          <h2 id="activas-t" className="text-2xl">Clases activas</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((c) => (
              <li key={c.id}>
                <Link href={`/maestro/${c.id}`} className="panel flex h-full flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-cyan/50">
                  <h3 className="font-display text-xl font-bold leading-tight">{c.name}</h3>
                  <p className="text-sm text-muted">{c.members} {c.members === 1 ? "estudiante" : "estudiantes"}{c.courseTitle ? ` · ${c.courseTitle}` : ""}</p>
                  <p className="mt-auto flex items-center justify-between gap-2">
                    <span className="font-mono text-lg font-bold tracking-[0.25em] text-gold" aria-label={`Código ${c.code.split("").join(" ")}`}>{c.code}</span>
                    <span className="text-sm font-semibold text-cyan">Ver informe →</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {archived.length > 0 && (
        <details className="panel p-5">
          <summary className="cursor-pointer font-semibold">Clases archivadas ({archived.length})</summary>
          <ul className="mt-3 space-y-2">
            {archived.map((c) => (
              <li key={c.id}><Link href={`/maestro/${c.id}`} className="text-cyan hover:underline">{c.name}</Link> <span className="text-sm text-muted">· {c.members} estudiantes</span></li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
