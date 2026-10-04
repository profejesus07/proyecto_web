import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { ProgramCard } from "@/components/program-card";
import { PublicHeader } from "@/components/site-header";
import { loadCatalog } from "@/lib/data/queries";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "Programas",
  description: "Cursos cortos y clases de la academia Umbral. La primera lección de cada programa es gratis.",
};

export default async function ProgramsPage() {
  const catalog = await loadCatalog();
  const groups = [
    { kind: "curso", title: "Cursos cortos", text: "Educación informal con constancia de asistencia al terminar." },
    { kind: "clase", title: "Clases", text: "Por área y periodos, con acceso durante el año lectivo." },
  ].map((g) => ({ ...g, items: catalog.filter((c) => c.kind === g.kind) })).filter((g) => g.items.length);

  return (
    <>
      <PublicHeader />
      <main id="contenido" className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
        <header className="max-w-2xl space-y-3">
          <p className="eyebrow">Programas</p>
          <h1 className="text-4xl sm:text-5xl">Todos los programas</h1>
          <p className="text-lg text-muted">La primera lección de cada programa es gratis. Entra, pruébala y decide.</p>
        </header>
        {groups.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-line/70 bg-panel/40 p-8 text-center text-muted">Muy pronto publicaremos los primeros programas.</p>
        ) : (
          groups.map((g) => (
            <section key={g.kind} aria-labelledby={`g-${g.kind}`} className="mt-14 space-y-6">
              <div>
                <h2 id={`g-${g.kind}`} className="text-2xl">{g.title}</h2>
                <p className="text-sm text-muted">{g.text}</p>
              </div>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((c) => <ProgramCard key={c.slug} c={c} />)}
              </ul>
            </section>
          ))
        )}
      </main>
      <Footer />
    </>
  );
}
