import type { Metadata } from "next";
import { ProgramCard } from "@/components/program-card";
import { SiteShell } from "@/components/site-header";
import { loadCatalog } from "@/lib/data/queries";

export const revalidate = 600;
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

export default async function ProgramsPage() {
  const catalog = await loadCatalog();
  const groups = [
    { kind: "curso", title: "Cursos cortos", text: "Educación informal con constancia de asistencia al terminar." },
    { kind: "clase", title: "Clases", text: "Por área y periodos, con acceso durante el año lectivo." },
  ].map((g) => ({ ...g, items: catalog.filter((c) => c.kind === g.kind) })).filter((g) => g.items.length);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
        <header className="max-w-2xl space-y-3">
          <p className="eyebrow">Programas</p>
          <h1 className="text-5xl font-extrabold sm:text-6xl">Todos los programas</h1>
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
