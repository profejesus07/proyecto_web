import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { ProgramCard } from "@/components/program-card";
import { SiteShell } from "@/components/site-header";
import { DungeonShowcase } from "@/components/dungeon-showcase";
import { Sprite, asset } from "@/components/sprite";
import { VALUES, categoriesFor, type Catalog } from "@/components/home/shared";
import { PROJECTS, SERVICES } from "@/content/servicios";

/** Cómo funciona, en tres pasos: lo primero que necesita saber quien llega. */
const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "lesson", title: "Elige un curso", text: "Cursos cortos o clases anuales. La primera lección siempre es gratis." },
  { icon: "play", title: "Aprende jugando", text: "Lecciones breves, retos con retroalimentación al instante y un Guardián al final de cada módulo." },
  { icon: "seal", title: "Obtén tu constancia", text: "Al terminar recibes una constancia que cualquiera puede verificar en línea." },
];

/** Momentos de la aventura: escenario + personaje dentro de un panel del Gremio. */
const MOMENTS: { title: string; text: string; scene: string; sprite: string; alt: string; spriteClass: string }[] = [
  { title: "Una guía en cada lección", text: "Sora explica cada tema y cada respuesta.", scene: asset.scene("portales", "disponible"), sprite: asset.sora("abrir-portal"), alt: "Sora abre un portal", spriteClass: "bottom-0 left-1/2 h-[80%] -translate-x-1/2" },
  { title: "Retos que se superan", text: "Cada módulo termina con un Guardián.", scene: asset.scene("mazmorra", "fuego"), sprite: asset.boss("petrox", "provocar"), alt: "Petrox, el Guardián de piedra", spriteClass: "bottom-[4%] right-[10%] h-[82%]" },
  { title: "Un compañero que crece", text: "Experiencia, monedas, rangos y objetos.", scene: asset.scene("gremio", "dia"), sprite: asset.kuro("celebrar", "majestuoso"), alt: "Kuro majestuoso celebra en el Gremio", spriteClass: "bottom-[2%] left-[10%] h-[70%]" },
];

/** Portada: deja claro en un vistazo que es una academia de cursos, con el estilo del Gremio en modo claro. */
export function HomeClaro({ catalog }: { catalog: Catalog }) {
  const featured = catalog.slice(0, 4);
  const categories = categoriesFor(catalog);

  return (
    <SiteShell variant="claro">
      {/* ===== Portada: qué es y buscador ===== */}
      <section className="relative isolate overflow-hidden">
        <div className="dots-claro absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pb-20 lg:pt-16">
          <div className="rise min-w-0 space-y-6">
            <p className="chip"><span className="size-2 rounded-full bg-gold" aria-hidden="true" /> Academia virtual · Cursos en línea</p>
            <h1 className="text-[2.4rem] font-extrabold leading-[1.02] min-[380px]:text-[2.7rem] sm:text-6xl">
              Cursos en línea que se aprenden como una <span className="marker">aventura</span>
            </h1>
            <p className="max-w-xl text-lg text-muted sm:text-xl">Cursos cortos y clases con lecciones breves, práctica con retroalimentación inmediata y constancias verificables. <strong className="text-text">La primera lección es gratis.</strong></p>
            <form action="/programas" role="search" className="panel flex max-w-xl items-center gap-2 rounded-full p-2 pl-5">
              <label htmlFor="buscar-home" className="sr-only">¿Qué quieres aprender?</label>
              <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input id="buscar-home" name="q" placeholder="¿Qué quieres aprender?" className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-[#9a95bd]" />
              <button type="submit" className="btn btn-primary">Buscar</button>
            </form>
            <ul className="flex flex-wrap gap-2" aria-label="Tipos de programa">
              {categories.slice(0, 3).map((c) => (
                <li key={c.label}><Link href={c.href} className="chip transition hover:border-[#6b3bf5] hover:text-[#4a22c9]"><Icon name={c.icon} className="size-4" /> {c.label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="rise relative mx-auto w-full min-w-0 max-w-lg [animation-delay:120ms]">
            <DungeonShowcase />
          </div>
        </div>
      </section>

      {/* ===== Cómo funciona ===== */}
      <section aria-labelledby="como-t" className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="como-t" className="sr-only">Cómo funciona</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="panel flex items-start gap-4 p-5">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-[#15103f] text-gold shadow-md">
                <Icon name={s.icon} />
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-gold text-[0.7rem] font-extrabold text-[#15103f]">{i + 1}</span>
              </span>
              <span><span className="block font-display text-lg font-extrabold">{s.title}</span><span className="text-sm text-muted">{s.text}</span></span>
            </li>
          ))}
        </ol>
      </section>

      {/* ===== Catálogo ===== */}
      <section id="programas" aria-labelledby="programas-t" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h2 id="programas-t" className="mt-2 text-3xl font-extrabold sm:text-4xl">Cursos y clases</h2>
          </div>
          <Link href="/programas" className="btn btn-secondary btn-sm">Ver todo el catálogo <Icon name="arrow" className="size-4" /></Link>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {categories.slice(0, 3).map((c) => (
            <li key={c.label}>
              <Link href={c.href} className="panel lift group flex items-center gap-3 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#6b3bf5]/10 text-[#6b3bf5] transition group-hover:bg-[#6b3bf5] group-hover:text-white"><Icon name={c.icon} /></span>
                <span className="min-w-0 flex-1"><span className="block font-bold">{c.label}</span><span className="block text-sm text-muted">{c.detail}</span></span>
                <Icon name="arrow" className="size-5 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-[#6b3bf5]" />
              </Link>
            </li>
          ))}
        </ul>
        {featured.length ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => <ProgramCard key={c.slug} c={c} />)}
          </ul>
        ) : (
          <p className="panel mt-8 p-8 text-center text-muted">Muy pronto publicaremos los primeros programas.</p>
        )}
      </section>

      {/* ===== Filosofía: la aventura ===== */}
      <section id="filosofia" aria-labelledby="filosofia-t" className="mx-auto max-w-6xl scroll-mt-24 px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Por qué es diferente</p>
          <h2 id="filosofia-t" className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">No solo cursos: una <span className="marker">historia</span> que vale la pena vivir</h2>
        </div>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {MOMENTS.map((m) => (
            <li key={m.title} className="panel lift overflow-hidden p-3">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                <Sprite src={m.scene} alt="" decorative className="absolute inset-0 size-full object-cover" />
                <Sprite src={m.sprite} alt={m.alt} className={`absolute w-auto drop-shadow-xl ${m.spriteClass}`} />
              </div>
              <div className="px-2 pb-2 pt-4">
                <h3 className="text-xl font-extrabold">{m.title}</h3>
                <p className="mt-1 text-muted">{m.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <ul className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <li key={v.title} className="flex items-center gap-2 text-sm"><Icon name="check" className="size-4 shrink-0 text-[#6b3bf5]" /> <span><strong>{v.title}.</strong> <span className="text-muted">{v.text}</span></span></li>
          ))}
        </ul>
      </section>

      {/* ===== Servicios y proyectos ===== */}
      <section aria-labelledby="servicios-t" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="panel panel-glow p-6 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <p className="eyebrow">Para docentes e instituciones</p>
              <h2 id="servicios-t" className="text-3xl font-extrabold leading-tight sm:text-4xl">Servicios y proyectos</h2>
              <p className="text-muted">Además de los cursos, creamos plataformas a la medida: gestión docente, exámenes institucionales, aplicaciones, juegos y gamificación educativa.</p>
            </div>
            <Link href="/servicios" className="btn btn-primary btn-lg">Ver servicios y proyectos</Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            {SERVICES.map((s) => <li key={s.id} className="chip">{s.title}</li>)}
          </ul>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {PROJECTS.map((p) => (
              <li key={p.title} className="rounded-xl border border-line bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6b3bf5]">{p.kind}</p>
                <h3 className="mt-1 text-lg font-extrabold">{p.title}</h3>
                <p className="mt-1 text-sm text-muted">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== Cierre: Kuro invita ===== */}
      <section aria-labelledby="cierre-t" className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <Sprite src={asset.kuro("saludar", "joven")} alt="" decorative className="float h-40 w-auto shrink-0" />
          <div className="panel flex-1 p-6 sm:p-8">
            <h2 id="cierre-t" className="text-3xl font-extrabold">Empieza hoy tu primer curso</h2>
            <p className="mt-2 text-muted">Crea tu cuenta gratis y prueba la primera lección sin pagar nada.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/registro" className="btn btn-primary btn-lg">Crear cuenta gratis</Link>
              <Link href="/programas" className="btn btn-secondary btn-lg">Ver cursos</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
