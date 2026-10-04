import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { ProgramCard } from "@/components/program-card";
import { SiteShell } from "@/components/site-header";
import { UniverseArt } from "@/components/universe-art";
import { SERVICES } from "@/content/servicios";
import { UNIVERSES } from "@/content/universos";
import { loadCatalog } from "@/lib/data/queries";

// El catálogo se vuelve a leer cada 10 minutos.
export const revalidate = 600;

const VALUES: { icon: IconName; title: string; text: string }[] = [
  { icon: "play", title: "Primera lección gratis", text: "Prueba cualquier programa antes de decidir." },
  { icon: "seal", title: "Constancias verificables", text: "Cada constancia se comprueba en línea." },
  { icon: "people", title: "Acompañamiento", text: "Docentes y familias siguen el avance." },
];

const PILLARS = [
  { title: "Historia", text: "Cada contenido vive dentro de una narrativa." },
  { title: "Aventura", text: "Retos que se superan, no tareas que se entregan." },
  { title: "Descubrimiento", text: "Aprender es encontrar, no memorizar." },
  { title: "Propósito", text: "Lo que aprendes salva tu mundo." },
];

export default async function Home() {
  const catalog = await loadCatalog();
  const featured = catalog.slice(0, 4);
  const [gremio] = UNIVERSES;

  return (
    <SiteShell>
      {/* ===== Portada: propuesta + buscador ===== */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div className="rise space-y-7">
          <p className="eyebrow">Educación con historia</p>
          <h1 className="text-[2.8rem] font-extrabold leading-[1] sm:text-6xl">Aprender es salvar el mundo.</h1>
          <p className="max-w-lg text-lg text-muted">Cursos y clases donde cada lección es parte de una aventura y cada estudiante es protagonista.</p>
          <form action="/programas" role="search" className="flex max-w-lg items-center gap-2 rounded-full border border-line bg-panel p-1.5 pl-5 shadow-sm focus-within:border-[var(--cyan)]">
            <label htmlFor="buscar-home" className="sr-only">¿Qué quieres aprender?</label>
            <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input id="buscar-home" name="q" placeholder="¿Qué quieres aprender?" className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-muted" />
            <button type="submit" className="btn btn-primary btn-sm !min-h-10 px-5">Buscar</button>
          </form>
          <ul className="flex flex-wrap gap-2 text-sm" aria-label="Explorar">
            {[["Cursos cortos", "/programas?tipo=curso"], ["Clases", "/programas?tipo=clase"], ["Gratis", "/programas?tipo=gratis"], ["Para instituciones", "/servicios"]].map(([label, href]) => (
              <li key={href}><Link href={href} className="inline-block rounded-full border border-line bg-panel px-3.5 py-1.5 font-medium hover:border-[var(--ink)]">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div className="rise relative [animation-delay:120ms]">
          <div className="overflow-hidden rounded-[2rem] border border-line bg-panel shadow-xl">
            <UniverseArt u={gremio} className="aspect-[4/3]" />
          </div>
          <div className="absolute -bottom-6 left-4 max-w-[16rem] rounded-2xl border border-line bg-panel p-4 shadow-lg sm:-left-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Universo</p>
            <p className="font-display text-lg font-extrabold leading-tight">{gremio.name}</p>
          </div>
        </div>
      </section>

      {/* ===== Valores ===== */}
      <section aria-label="Lo que ofrecemos" className="border-y border-line bg-panel">
        <ul className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6">
          {VALUES.map((v) => (
            <li key={v.title} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--cyan)]/10 text-cyan"><Icon name={v.icon} /></span>
              <span><span className="block font-bold">{v.title}</span><span className="text-sm text-muted">{v.text}</span></span>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Cursos y clases ===== */}
      <section id="programas" aria-labelledby="programas-t" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="programas-t" className="text-3xl font-extrabold sm:text-4xl">Cursos y clases</h2>
          <Link href="/programas" className="inline-flex items-center gap-1.5 font-bold text-cyan hover:underline hover:underline-offset-4">
            Ver todos <Icon name="arrow" className="size-4" />
          </Link>
        </div>
        {featured.length ? (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => <ProgramCard key={c.slug} c={c} />)}
          </ul>
        ) : (
          <p className="mt-8 rounded-3xl border border-line bg-panel p-8 text-center text-muted">Muy pronto publicaremos los primeros programas.</p>
        )}
      </section>

      {/* ===== Filosofía ===== */}
      <section id="filosofia" aria-labelledby="filosofia-t" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6">
        <div className="grid items-center gap-10 rounded-[2rem] border border-line bg-panel p-8 sm:p-12 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-3">
            <p className="eyebrow">Nuestra filosofía</p>
            <h2 id="filosofia-t" className="text-3xl font-extrabold leading-tight sm:text-4xl">No solo cursos: una historia que vale la pena vivir.</h2>
          </div>
          <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {PILLARS.map((p, i) => (
              <li key={p.title} className="border-l-2 border-[var(--cyan)] pl-4">
                <p className="text-xs font-bold text-cyan">0{i + 1}</p>
                <h3 className="text-xl font-extrabold">{p.title}</h3>
                <p className="text-sm text-muted">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== Para instituciones ===== */}
      <section aria-labelledby="inst-t" className="bg-[#15120f] text-[#f6f3ee]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b7a8ff]">Para instituciones educativas</p>
            <h2 id="inst-t" className="text-3xl font-extrabold leading-tight sm:text-4xl">Soluciones para docentes, directivos e instituciones</h2>
            <ul className="flex flex-wrap gap-2 pt-1">
              {SERVICES.map((s) => <li key={s.id} className="rounded-full border border-white/15 px-3 py-1 text-sm text-[#d8d1c5]">{s.title}</li>)}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/servicios" className="btn btn-lg bg-[#f6f3ee] text-[#15120f] hover:bg-white">Conocer los servicios</Link>
            <Link href="/servicios#contacto" className="btn btn-lg border-white/40 text-[#f6f3ee] hover:bg-white/10">Hablemos</Link>
          </div>
        </div>
      </section>

      {/* ===== Cierre ===== */}
      <section aria-labelledby="cierre-t" className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 id="cierre-t" className="text-3xl font-extrabold sm:text-5xl">¿Listo para cruzar el umbral?</h2>
        <p className="mt-4 text-lg text-muted">Crea tu cuenta gratis y empieza hoy.</p>
        <Link href="/registro" className="btn btn-primary btn-lg mt-7">Empieza gratis</Link>
      </section>
    </SiteShell>
  );
}
