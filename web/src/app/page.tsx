import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProgramCard } from "@/components/program-card";
import { SiteShell } from "@/components/site-header";
import { UniverseArt } from "@/components/universe-art";
import { SERVICES } from "@/content/servicios";
import { UNIVERSES } from "@/content/universos";
import { loadCatalog } from "@/lib/data/queries";

// El catálogo se vuelve a leer cada 10 minutos.
export const revalidate = 600;

const PILLARS = [
  { n: "01", title: "Historia", text: "Cada contenido vive dentro de una narrativa. Se aprende porque importa lo que pasa después." },
  { n: "02", title: "Aventura", text: "Retos que se superan, no tareas que se entregan. Equivocarse es parte del camino." },
  { n: "03", title: "Descubrimiento", text: "Aprender es encontrar, no memorizar. Cada lección abre una puerta nueva." },
  { n: "04", title: "Propósito", text: "Lo que aprendes sirve para algo: en cada historia, tú salvas tu mundo." },
];

export default async function Home() {
  const catalog = await loadCatalog();
  const featured = catalog.slice(0, 3);
  const [gremio, hacker, dragon] = UNIVERSES;

  return (
    <SiteShell>
      {/* ===== Manifiesto ===== */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div className="rise space-y-8">
          <p className="eyebrow">UMBRAL · Educación con historia</p>
          <h1 className="text-[2.9rem] font-extrabold leading-[0.98] sm:text-7xl">
            Aprender es<br />salvar <span className="relative whitespace-nowrap">el mundo<svg aria-hidden="true" viewBox="0 0 300 20" className="absolute -bottom-2 left-0 w-full text-cyan"><path d="M3 15 C 80 3, 200 3, 297 12" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg></span>.
          </h1>
          <p className="max-w-xl text-lg text-muted sm:text-xl">
            No ofrecemos solo cursos y clases. Ofrecemos una historia, una aventura y un descubrimiento: cada estudiante se vuelve protagonista y cada lección acerca su mundo a la luz.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="#universos" className="btn btn-primary btn-lg">Explorar los universos</Link>
            <Link href="/servicios" className="btn btn-secondary btn-lg">Soy docente o institución</Link>
          </div>
        </div>

        {/* Collage: tres universos, tres estilos. */}
        <div className="rise relative h-[26rem] [animation-delay:120ms] sm:h-[30rem]" aria-hidden="true">
          <div className="absolute right-0 top-0 w-[78%] rotate-2 overflow-hidden rounded-3xl border border-line bg-white shadow-xl">
            <UniverseArt u={gremio} className="aspect-[4/3]" />
            <p className="px-4 py-3 text-sm font-bold">{gremio.name}</p>
          </div>
          <div className="absolute bottom-6 left-0 w-[58%] -rotate-3 overflow-hidden rounded-3xl border border-line bg-white shadow-xl">
            <UniverseArt u={hacker} className="aspect-[4/3]" />
            <p className="px-4 py-3 text-sm font-bold">{hacker.name}</p>
          </div>
          <div className="absolute bottom-0 right-[6%] w-[40%] rotate-6 overflow-hidden rounded-3xl border border-line bg-white shadow-xl">
            <UniverseArt u={dragon} className="aspect-square" />
          </div>
        </div>
      </section>

      {/* ===== Filosofía ===== */}
      <section id="filosofia" aria-labelledby="filosofia-t" className="scroll-mt-20 border-y border-line bg-panel">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <div className="space-y-4">
              <p className="eyebrow">Nuestra filosofía</p>
              <h2 id="filosofia-t" className="text-4xl font-extrabold leading-tight sm:text-5xl">Un mundo que necesita héroes que aprendan.</h2>
              <p className="text-muted">El rigor académico de siempre, vivido de otra manera. Por eso cada curso pertenece a un universo con su propio estilo, sus personajes y su misión.</p>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
              {PILLARS.map((p) => (
                <li key={p.n} className="space-y-3 bg-panel p-7">
                  <span className="font-display text-sm font-bold text-cyan">{p.n}</span>
                  <h3 className="text-2xl font-extrabold">{p.title}</h3>
                  <p className="text-muted">{p.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ===== Universos ===== */}
      <section id="universos" aria-labelledby="universos-t" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <p className="eyebrow">Universos</p>
          <h2 id="universos-t" className="text-4xl font-extrabold sm:text-5xl">Cada historia, un estilo distinto</h2>
          <p className="text-lg text-muted">Fantasía, ciberpunk, elementos, pixel art… El mismo aprendizaje, muchas formas de vivirlo.</p>
        </div>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {UNIVERSES.map((u) => (
            <li key={u.id} className="group overflow-hidden rounded-3xl border border-line bg-panel transition hover:-translate-y-1 hover:shadow-xl">
              <UniverseArt u={u} className="aspect-[16/9]" />
              <div className="space-y-2 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">{u.style}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${u.status === "disponible" ? "bg-[#1f8a4c] text-white" : "bg-black/5 text-muted"}`}>
                    {u.status === "disponible" ? "Disponible" : "Próximamente"}
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold">{u.name}</h3>
                <p className="text-muted">{u.tagline}</p>
                {u.status === "disponible" && (
                  <Link href="/programas" className="inline-flex items-center gap-1.5 pt-2 font-bold text-cyan hover:underline hover:underline-offset-4">
                    Ver sus cursos y clases <Icon name="arrow" className="size-4" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Cursos y clases ===== */}
      <section id="programas" aria-labelledby="programas-t" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl space-y-3">
            <p className="eyebrow">Cursos y clases</p>
            <h2 id="programas-t" className="text-4xl font-extrabold sm:text-5xl">Empieza tu aventura</h2>
            <p className="text-muted">La primera lección de cada programa es gratis.</p>
          </div>
          <Link href="/programas" className="inline-flex items-center gap-1.5 font-bold text-cyan hover:underline hover:underline-offset-4">
            Ver todos los programas <Icon name="arrow" className="size-4" />
          </Link>
        </div>
        {featured.length ? (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => <ProgramCard key={c.slug} c={c} />)}
          </ul>
        ) : (
          <p className="mt-10 rounded-3xl border border-line bg-panel p-8 text-center text-muted">Muy pronto publicaremos los primeros programas.</p>
        )}
      </section>

      {/* ===== Para instituciones ===== */}
      <section aria-labelledby="servicios-t" className="bg-[#15120f] text-[#f6f3ee]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b7a8ff]">Para docentes, directivos e instituciones</p>
              <h2 id="servicios-t" className="text-4xl font-extrabold leading-tight sm:text-5xl">Más que cursos: soluciones para tu institución</h2>
              <p className="text-[#c9c2b6]">Plataformas, aplicaciones y juegos hechos a la medida, con la misma idea: que aprender y enseñar se sienta como una buena historia.</p>
              <Link href="/servicios" className="btn btn-lg mt-2 bg-[#f6f3ee] text-[#15120f] hover:bg-white">Ver los servicios</Link>
            </div>
            <ul className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <li key={s.id} className="space-y-2 bg-[#15120f] p-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-[#b7a8ff]"><Icon name={s.icon} /></span>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="text-sm text-[#c9c2b6]">{s.lead}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== Cierre ===== */}
      <section aria-labelledby="cierre-t" className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <h2 id="cierre-t" className="text-4xl font-extrabold leading-tight sm:text-6xl">¿Listo para cruzar el umbral?</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted">Crea tu cuenta gratis y empieza hoy tu primera aventura. Si eres institución, cuéntanos qué quieres lograr.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/registro" className="btn btn-primary btn-lg">Empieza gratis</Link>
          <Link href="/servicios#contacto" className="btn btn-secondary btn-lg">Hablemos</Link>
        </div>
      </section>
    </SiteShell>
  );
}
