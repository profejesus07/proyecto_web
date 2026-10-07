import type { Metadata } from "next";
import Link from "next/link";
import { ProgramCard } from "@/components/program-card";
import { SiteShell } from "@/components/site-header";
import { loadCatalog } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Cursos",
  description: "Cursos cortos y clases de la Academia Virtual Umbral. La primera lección de cada programa es gratis.",
};

const FAQ = [
  { q: "¿Cuánto cuesta?", a: "Crear la cuenta es gratis y la primera lección de cada programa también. Algunos programas son gratis completos; los demás tienen su precio en pesos colombianos y se pagan en línea con Wompi o Mercado Pago (PSE, Nequi, tarjeta y más)." },
  { q: "¿Para qué edades es?", a: "Para niñas, niños, adolescentes y adultos. Si eres menor de edad, tu acudiente debe autorizar el uso de la plataforma; puede acompañarte desde una cuenta de familia." },
  { q: "¿Necesito instalar algo?", a: "No. Funciona en el navegador del celular, la tableta o el computador. Tu avance se guarda en tu cuenta." },
  { q: "¿Qué valor tienen las constancias?", a: "Los cursos cortos son educación informal (Ley 115 de 1994 y Decreto 1075 de 2015). Al terminarlos se expide una constancia de asistencia que cualquiera puede verificar en línea con su código. No conduce a título." },
];

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
      <header className="paper border-b border-line">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
          <p className="eyebrow">Catálogo</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Cursos</h1>
          <p className="mt-3 max-w-xl text-lg text-muted">La primera lección de cada curso es gratis.</p>
          <nav aria-label="Filtrar" className="mt-8 flex w-full gap-1 overflow-x-auto whitespace-nowrap rounded-xl bg-white/5 p-1 ring-1 ring-line sm:inline-flex sm:w-auto">
            {FILTERS.map(([t, label]) => (
              <Link key={t} href={t ? `/programas?tipo=${t}` : "/programas"} aria-current={tipo === t ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${tipo === t ? "bg-accion text-ink shadow-sm" : "text-muted hover:text-text"}`}>{label}</Link>
            ))}
          </nav>
        </div>
      </header>
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
        <section aria-labelledby="preguntas-t" className="mx-auto mt-24 grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="eyebrow">Ayuda</p>
            <h2 id="preguntas-t" className="mt-2 text-3xl">Preguntas frecuentes</h2>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-cyan/10 text-cyan transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
