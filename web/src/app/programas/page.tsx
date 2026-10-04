import type { Metadata } from "next";
import Link from "next/link";
import { ProgramCard } from "@/components/program-card";
import { SiteShell } from "@/components/site-header";
import { normAnswer } from "@/lib/activities";
import { loadCatalog } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Programas",
  description: "Cursos cortos y clases de la academia Umbral. La primera lección de cada programa es gratis.",
};


const FAQ = [
  { q: "¿Cuánto cuesta?", a: "Crear la cuenta es gratis y la primera lección de cada programa también. Algunos programas son gratis completos; los demás tienen su precio en pesos colombianos y se pagan en línea con Wompi o Mercado Pago (PSE, Nequi, tarjeta y más)." },
  { q: "¿Para qué edades es?", a: "Para niñas, niños, adolescentes y adultos. Si eres menor de edad, tu acudiente debe autorizar el uso de la plataforma; puede acompañarte desde una cuenta de familia." },
  { q: "¿Necesito instalar algo?", a: "No. Funciona en el navegador del celular, la tableta o el computador. Tu avance se guarda en tu cuenta." },
  { q: "¿Qué valor tienen las constancias?", a: "Los cursos cortos son educación informal (Ley 115 de 1994 y Decreto 1075 de 2015). Al terminarlos se expide una constancia de asistencia que cualquiera puede verificar en línea con su código. No conduce a título." },
];

const FILTERS = [["", "Todos"], ["curso", "Cursos cortos"], ["clase", "Clases"], ["gratis", "Gratis"]] as const;

export default async function ProgramsPage({ searchParams }: PageProps<"/programas">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80).trim() : "";
  const tipo = typeof sp.tipo === "string" && ["curso", "clase", "gratis"].includes(sp.tipo) ? sp.tipo : "";
  const words = normAnswer(q).split(" ").filter(Boolean);
  // Búsqueda sencilla: todas las palabras deben aparecer en el título, la descripción o el área.
  const catalog = (await loadCatalog()).filter((c) => {
    if (tipo === "gratis" ? !c.isFree : tipo && c.kind !== tipo) return false;
    const hay = normAnswer(`${c.title} ${c.summary} ${c.area ?? ""}`);
    return words.every((w) => hay.includes(w));
  });
  const href = (t: string) => `/programas?${new URLSearchParams({ ...(q && { q }), ...(t && { tipo: t }) }).toString()}`;
  const groups = [
    { kind: "curso", title: "Cursos cortos", text: "Educación informal con constancia de asistencia al terminar." },
    { kind: "clase", title: "Clases", text: "Por área y periodos, con acceso durante el año lectivo." },
  ].map((g) => ({ ...g, items: catalog.filter((c) => c.kind === g.kind) })).filter((g) => g.items.length);

  return (
    <SiteShell>
      <header className="brand-hero relative isolate overflow-hidden">
        <div className="dots absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
        <div className="mx-auto max-w-6xl space-y-3 px-4 pb-16 pt-12 sm:px-6">
          <p className="text-sm font-semibold text-[#ffc233]">Programas</p>
          <h1 className="text-5xl font-extrabold sm:text-6xl">Todos los programas</h1>
          <p className="max-w-2xl text-lg text-white/85">La primera lección de cada programa es gratis. Entra, pruébala y decide.</p>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="relative -mt-7 flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-panel p-3 shadow-lg">
          <form action="/programas" role="search" className="flex w-full max-w-md items-center gap-2 rounded-full border border-line bg-[var(--bg)] p-1.5 pl-5 focus-within:border-[var(--cyan)]">
            <label htmlFor="buscar" className="sr-only">Buscar programas</label>
            <input id="buscar" name="q" defaultValue={q} placeholder="Buscar programas" className="min-w-0 flex-1 bg-transparent py-1.5 outline-none placeholder:text-muted" />
            {tipo && <input type="hidden" name="tipo" value={tipo} />}
            <button type="submit" className="btn btn-primary btn-sm">Buscar</button>
          </form>
          <nav aria-label="Filtrar" className="flex flex-wrap gap-2 text-sm">
            {FILTERS.map(([t, label]) => (
              <Link key={t} href={href(t)} aria-current={tipo === t ? "page" : undefined}
                className={`rounded-full border px-3.5 py-1.5 font-medium ${tipo === t ? "border-[var(--cyan)] bg-[var(--cyan)] text-white" : "border-line bg-panel hover:border-[var(--cyan)] hover:text-[var(--cyan)]"}`}>{label}</Link>
            ))}
          </nav>
        </div>
        {groups.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-line bg-panel p-8 text-center text-muted">
            {q || tipo ? <>No encontramos programas con esa búsqueda. <Link href="/programas" className="font-semibold text-cyan underline underline-offset-4">Ver todos</Link></> : "Muy pronto publicaremos los primeros programas."}
          </p>
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
        <section aria-labelledby="preguntas-t" className="mx-auto mt-20 max-w-3xl">
          <h2 id="preguntas-t" className="text-center text-3xl font-extrabold sm:text-4xl">Preguntas frecuentes</h2>
          <div className="mt-8 divide-y divide-line rounded-3xl border border-line bg-panel">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
