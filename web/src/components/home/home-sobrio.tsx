import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProgramCard } from "@/components/program-card";
import { SiteShell } from "@/components/site-header";
import { Sprite, asset } from "@/components/sprite";
import { VALUES, categoriesFor, type Catalog } from "@/components/home/shared";
import { SERVICES } from "@/content/servicios";

const POPULAR: [string, string][] = [["Cursos gratis", "/programas?tipo=gratis"], ["Cursos cortos", "/programas?tipo=curso"], ["Clases anuales", "/programas?tipo=clase"]];

const METHOD: { title: string; text: string }[] = [
  { title: "Historia", text: "Cada contenido vive dentro de una narrativa que le da sentido a lo que se aprende." },
  { title: "Aventura", text: "Retos que se superan, no tareas que se entregan: la práctica tiene un propósito." },
  { title: "Descubrimiento", text: "Lecciones breves que invitan a encontrar, no a memorizar." },
  { title: "Propósito", text: "Cada logro se nota: experiencia, constancias y un avance que todos pueden ver." },
];

/** Portada sobria (inspirada en EducaciónIT): blanca, ordenada, con el buscador como protagonista. */
export function HomeSobrio({ catalog }: { catalog: Catalog }) {
  const featured = catalog.slice(0, 4);
  const categories = categoriesFor(catalog);

  return (
    <SiteShell variant="sobrio">
      {/* ===== Portada ===== */}
      <section className="border-b border-line bg-gradient-to-b from-[#f7f6fc] to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:py-24">
          <div className="min-w-0 space-y-6">
            <p className="eyebrow text-sm uppercase">Academia Virtual Umbral</p>
            <h1 className="text-4xl leading-[1.1] sm:text-5xl">Cursos y clases en línea que se aprenden como una historia</h1>
            <p className="max-w-xl text-lg text-muted">Lecciones breves, práctica con retroalimentación inmediata y constancias verificables. La primera lección es gratis.</p>
            <form action="/programas" role="search" className="flex max-w-xl items-center gap-2 rounded-lg border border-line bg-white p-1.5 pl-4 shadow-sm focus-within:border-[#4a22c9]">
              <label htmlFor="buscar-home" className="sr-only">¿Qué quieres aprender?</label>
              <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input id="buscar-home" name="q" placeholder="¿Qué quieres aprender?" className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none placeholder:text-[#8f8ca6]" />
              <button type="submit" className="btn btn-primary">Buscar</button>
            </form>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              <span>Lo más buscado:</span>
              {POPULAR.map(([label, href]) => <Link key={href} href={href} className="font-medium text-text underline decoration-line underline-offset-4 hover:decoration-[#4a22c9]">{label}</Link>)}
            </p>
          </div>
          <figure className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_48px_-28px_rgb(20_18_59/0.35)]">
            <Sprite src={asset.scene("portales", "disponible")} alt="" decorative priority className="aspect-[4/3] w-full object-cover" />
            <Sprite src={asset.sora("hablar")} alt="Sora, la guía de la academia" priority className="absolute bottom-0 left-1/2 h-[70%] w-auto -translate-x-1/2" />
            <figcaption className="absolute inset-x-3 bottom-3 rounded-lg bg-white/95 px-4 py-3 text-sm shadow-sm">
              <span className="block font-semibold">Aprender con una guía</span>
              <span className="text-muted">Sora acompaña cada lección y explica cada respuesta.</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ===== Franja de garantías ===== */}
      <section aria-label="Por qué la Academia Virtual Umbral" className="border-b border-line">
        <ul className="mx-auto grid max-w-6xl divide-line px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:divide-x">
          {VALUES.map((v) => (
            <li key={v.title} className="flex items-start gap-3 py-6 lg:px-6 lg:first:pl-0">
              <Icon name={v.icon} className="mt-0.5 size-6 shrink-0 text-[#4a22c9]" />
              <span><span className="block font-semibold leading-tight">{v.title}</span><span className="text-sm text-muted">{v.text}</span></span>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Categorías ===== */}
      <section aria-labelledby="explora-t" className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <h2 id="explora-t" className="text-3xl">Explora la oferta académica</h2>
        <p className="mt-2 text-muted">Elige el formato que mejor se adapta a ti o a tu institución.</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.label}>
              <Link href={c.href} className="group flex h-full items-center gap-4 rounded-xl border border-line p-5 transition hover:border-[#4a22c9]">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#f3f1fa] text-[#4a22c9]"><Icon name={c.icon} className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{c.label}</span>
                  <span className="block text-sm text-muted">{c.detail}</span>
                </span>
                <Icon name="arrow" className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-[#4a22c9]" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Programas ===== */}
      <section id="programas" aria-labelledby="programas-t" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="programas-t" className="text-3xl">Programas destacados</h2>
            <p className="mt-2 text-muted">Cursos cortos y clases con constancia verificable.</p>
          </div>
          <Link href="/programas" className="btn btn-secondary btn-sm">Ver todo el catálogo <Icon name="arrow" className="size-4" /></Link>
        </div>
        {featured.length ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => <ProgramCard key={c.slug} c={c} />)}
          </ul>
        ) : (
          <p className="mt-8 rounded-xl border border-dashed border-line p-10 text-center text-muted">Muy pronto publicaremos los primeros programas.</p>
        )}
      </section>

      {/* ===== Método ===== */}
      <section id="filosofia" aria-labelledby="filosofia-t" className="scroll-mt-24 border-y border-line bg-[#f7f7fa]">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow text-sm uppercase">Nuestro método</p>
            <h2 id="filosofia-t" className="mt-3 text-3xl leading-tight sm:text-4xl">No solo cursos: una historia que vale la pena vivir</h2>
            <p className="mt-4 text-muted">Combinamos el rigor de un programa académico con la motivación de una buena historia.</p>
          </div>
          <ol className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {METHOD.map((m, i) => (
              <li key={m.title} className="border-t border-[#d9d6e6] pt-5">
                <span className="text-sm font-semibold tabular-nums text-[#4a22c9]">0{i + 1}</span>
                <h3 className="mt-2 text-xl">{m.title}</h3>
                <p className="mt-1 text-muted">{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== Instituciones ===== */}
      <section aria-labelledby="inst-t" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <p className="eyebrow text-sm uppercase">Para instituciones educativas</p>
            <h2 id="inst-t" className="text-3xl leading-tight sm:text-4xl">Soluciones para docentes, directivos e instituciones</h2>
            <p className="text-muted">Plataformas a la medida para gestionar, evaluar y acompañar el aprendizaje.</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/servicios" className="btn btn-primary">Conocer los servicios</Link>
              <Link href="/servicios#contacto" className="btn btn-secondary">Hablemos</Link>
            </div>
          </div>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {SERVICES.map((s) => (
              <li key={s.id} className="flex items-start gap-4 p-5">
                <Icon name={s.icon} className="mt-0.5 size-5 shrink-0 text-[#4a22c9]" />
                <span><span className="block font-semibold">{s.title}</span><span className="text-sm text-muted">{s.lead}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== Cierre ===== */}
      <section aria-labelledby="cierre-t" className="px-4 pb-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 rounded-xl bg-[#14123b] px-8 py-10 text-white sm:px-12">
          <div>
            <h2 id="cierre-t" className="text-2xl sm:text-3xl">Empieza hoy tu primera lección</h2>
            <p className="mt-1 text-white/70">Crear una cuenta es gratis y solo toma un minuto.</p>
          </div>
          <Link href="/registro" className="btn btn-lg bg-white text-[#14123b] hover:bg-[#f3f1fa]">Crear cuenta gratis</Link>
        </div>
      </section>
    </SiteShell>
  );
}
