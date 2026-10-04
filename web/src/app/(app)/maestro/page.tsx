import type { Metadata } from "next";
import Link from "next/link";
import { CreateClassForm } from "@/components/classes-client";
import { SpeechBubble } from "@/components/dialogue";
import { GuidePicker } from "@/components/guide-picker";
import { Sprite } from "@/components/sprite";
import { MAESTROS, guideSrc } from "@/content/elenco";
import { PageTitle } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { guideFor } from "@/lib/guides";

export const metadata: Metadata = { title: "Maestro del Gremio" };

export default async function TeacherPage() {
  const viewer = await requireTeacher("/maestro");
  const classes = await getRepo().listTeacherClasses(viewer.id);
  const active = classes.filter((c) => !c.archived);
  const archived = classes.filter((c) => c.archived);
  const guide = guideFor(viewer)!;

  return (
    <div className="space-y-8">
      <section className="panel relative isolate overflow-hidden rounded-3xl" aria-label="Maestro del Gremio">
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(60% 90% at 85% 60%, rgba(91,52,214,.35), transparent 70%)" }} />
        <div className="flex items-end justify-between gap-4 p-6 sm:p-8">
          <div className="space-y-4 md:max-w-xl">
            <PageTitle eyebrow="Maestro del Gremio" title="Tus clases">
              <p>Crea una clase, comparte su código y sigue el avance de tus estudiantes en cada portal.</p>
            </PageTitle>
            <SpeechBubble name={guide.name} src={guideSrc(guide, active.length ? "senalar" : "saludar")} alt={guide.name}>
              {active.length
                ? "Abre una clase para ver quién avanza, quién necesita un empujón y qué preguntas les cuestan más."
                : <>Bienvenido al Gremio. Empieza creando tu primera clase: tus estudiantes se unen escribiendo el código en <strong>Perfil → Mis clases</strong>.</>}
            </SpeechBubble>
          </div>
          <Sprite src={guideSrc(guide, active.length ? "reposo" : "abrir-portal")} alt="" decorative className="hidden h-64 w-auto shrink-0 md:block" />
        </div>
      </section>

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

      <section aria-labelledby="retrato-t" className="panel max-w-2xl space-y-3 p-5">
        <h2 id="retrato-t" className="text-xl">Tu retrato en el Gremio</h2>
        <p className="text-sm text-muted">Elige el Maestro que te representa. Lo verás en la cabecera y en tus informes.</p>
        <GuidePicker options={MAESTROS} current={guide.id} legend="Maestro del Gremio" />
      </section>

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
