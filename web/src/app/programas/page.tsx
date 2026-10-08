import type { Metadata } from "next";
import Link from "next/link";
import { FranjaPortada } from "@/components/FranjaPortada";
import { PreguntasFrecuentes } from "@/components/PreguntasFrecuentes";
import { ProgramCard } from "@/components/program-card";
import { SiteShell } from "@/components/site-header";
import { Sprite } from "@/components/sprite";
import { loadCatalog } from "@/lib/data/queries";
import { VIEWPORT_PUBLICO } from "@/config/viewport-publico";

export const viewport = VIEWPORT_PUBLICO;

export const metadata: Metadata = {
  title: "Cursos",
  description: "Cursos cortos y clases de UNEX Academy. La primera lección de cada programa es gratis.",
};

const FILTERS = [["", "Todos"], ["curso", "Cursos cortos"], ["clase", "Clases"], ["gratis", "Gratis"]] as const;
const GROUPS = [
  { kind: "curso", title: "Cursos cortos", text: "Con constancia de asistencia al terminar." },
  { kind: "clase", title: "Clases", text: "Por área y periodos, durante el año lectivo." },
] as const;

export default async function ProgramsPage({ searchParams }: PageProps<"/programas">) {
  const sp = await searchParams;
  const tipo = typeof sp.tipo === "string" && ["curso", "clase", "gratis"].includes(sp.tipo) ? sp.tipo : "";
  const catalog = (await loadCatalog()).filter((c) => (tipo === "gratis" ? c.isFree : !tipo || c.kind === tipo));
  const groups = GROUPS.map((g) => ({ ...g, items: catalog.filter((c) => c.kind === g.kind) })).filter((g) => g.items.length);

  return (
    <SiteShell>
      <FranjaPortada
        id="cursos-t" antetitulo="Catálogo" titulo="Cursos" amplia
        ilustracion={<Sprite src="/assets/escenarios/portales/portales-disponible-cuadrado.svg" alt="La Sala de Portales, con portales abiertos" priority className="aspect-square w-full max-w-xs rounded-3xl object-cover" />}
        acciones={
          // Tokens del tema: dentro de la franja Cosmos se ven en oscuro (antes bg-white/5, que solo servía en oscuro).
          <nav aria-label="Filtrar" className="flex w-full gap-1 overflow-x-auto whitespace-nowrap rounded-xl bg-[var(--chip-fondo)] p-1.5 ring-1 ring-[var(--chip-borde)] sm:inline-flex sm:w-auto">
            {FILTERS.map(([t, label]) => (
              <Link key={t} href={t ? `/programas?tipo=${t}` : "/programas"} aria-current={tipo === t ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-offset-2 sm:px-4 ${tipo === t ? "bg-accion text-sobre-accion shadow-sm" : "text-muted hover:text-text"}`}>{label}</Link>
            ))}
          </nav>
        }
      >
        <p>La primera lección de cada curso es gratis.</p>
      </FranjaPortada>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {groups.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
            {tipo ? <>No hay cursos en esta categoría todavía. <Link href="/programas" className="font-semibold text-cyan underline underline-offset-4">Ver todos</Link></> : "Muy pronto publicaremos los primeros cursos."}
          </p>
        ) : (
          groups.map((g) => (
            <section key={g.kind} aria-labelledby={`g-${g.kind}`} className="mt-14">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                <h2 id={`g-${g.kind}`} className="text-2xl">{g.title}</h2>
                <p className="text-sm text-muted">{g.text}</p>
              </div>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((c) => <ProgramCard key={c.slug} c={c} />)}
              </ul>
            </section>
          ))
        )}
        <PreguntasFrecuentes ids={["costo", "edades", "instalar", "constancias"]} antetitulo="Ayuda" className="mx-auto mt-24 max-w-6xl" />
      </div>
    </SiteShell>
  );
}
