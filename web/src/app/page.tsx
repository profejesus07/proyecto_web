import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { ProgramCard } from "@/components/program-card";
import { SiteShell } from "@/components/site-header";
import { DungeonShowcase } from "@/components/dungeon-showcase";
import { Sprite, asset } from "@/components/sprite";
import { SERVICES } from "@/content/servicios";
import { loadCatalog } from "@/lib/data/queries";

// El catálogo se vuelve a leer cada 10 minutos.
export const revalidate = 600;

const VALUES: { icon: IconName; title: string; text: string }[] = [
  { icon: "play", title: "Primera lección gratis", text: "Prueba antes de decidir." },
  { icon: "seal", title: "Constancias verificables", text: "Se comprueban en línea." },
  { icon: "people", title: "Acompañamiento real", text: "Docentes y familias ven el avance." },
  { icon: "feedback", title: "Retroalimentación al instante", text: "Cada respuesta se explica." },
];

/** Filas de la portada: escenario de fondo + personaje encima, alternando lado. */
const FEATURES: { eyebrow: string; title: string; text: string; scene: string; sprite: string; alt: string; spriteClass: string }[] = [
  {
    eyebrow: "Historia", title: "Cada lección abre un portal",
    text: "Los contenidos viven dentro de una narrativa: Sora te guía de mundo en mundo y cada tema es un lugar nuevo por descubrir.",
    scene: asset.scene("portales", "disponible"), sprite: asset.sora("abrir-portal"), alt: "Sora abre un portal en la Sala de Portales", spriteClass: "bottom-0 left-1/2 h-[78%] -translate-x-1/2",
  },
  {
    eyebrow: "Aventura", title: "Retos que se superan, no tareas que se entregan",
    text: "Al final de cada módulo espera un Guardián. Tus respuestas son tus poderes, y cada error se explica para que vuelvas más fuerte.",
    scene: asset.scene("mazmorra", "fuego"), sprite: asset.boss("petrox", "provocar"), alt: "Petrox, el Guardián de piedra, desafía al aventurero", spriteClass: "bottom-[4%] right-[8%] h-[82%]",
  },
  {
    eyebrow: "Descubrimiento", title: "Sube de rango junto a Kuro",
    text: "Ganas experiencia, monedas y objetos. Tu compañero crece contigo: de cachorro a majestuoso, misión a misión.",
    scene: asset.scene("gremio", "noche"), sprite: asset.kuro("celebrar", "majestuoso"), alt: "Kuro majestuoso celebra en el Gremio", spriteClass: "bottom-[2%] left-[10%] h-[70%]",
  },
  {
    eyebrow: "Propósito", title: "Docentes y familias ven el avance",
    text: "Informes claros, constancias verificables y mensajes de la familia: todos acompañan la aventura sin perder de vista lo que se aprende.",
    scene: asset.scene("terraza", "atardecer"), sprite: "/assets/familia/mama-lucia/mama-lucia-orgullo.svg", alt: "Mamá Lucía mira orgullosa el avance", spriteClass: "bottom-0 right-[12%] h-[80%]",
  },
];

export default async function Home() {
  const catalog = await loadCatalog();
  const featured = catalog.slice(0, 4);
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const categories: { label: string; href: string; detail: string; icon: IconName }[] = [
    { label: "Cursos cortos", href: "/programas?tipo=curso", detail: count(catalog.filter((c) => c.kind === "curso").length, "programa", "programas"), icon: "lesson" },
    { label: "Clases anuales", href: "/programas?tipo=clase", detail: count(catalog.filter((c) => c.kind === "clase").length, "clase", "clases"), icon: "clock" },
    { label: "Gratis", href: "/programas?tipo=gratis", detail: count(catalog.filter((c) => c.isFree).length, "programa", "programas"), icon: "play" },
    { label: "Para instituciones", href: "/servicios", detail: "Plataformas a la medida", icon: "people" },
  ];

  return (
    <SiteShell bold>
      {/* ===== Portada ===== */}
      <section className="relative isolate overflow-hidden pb-40 sm:pb-56">
        <div className="stars -z-10" aria-hidden="true" />
        <div className="glow -left-40 top-10 -z-10 size-[28rem] bg-[#6b3bf5]/40" aria-hidden="true" />
        <div className="glow -right-32 top-40 -z-10 size-[24rem] bg-[#8a5cff]/30" aria-hidden="true" />
        <div className="horizon -z-10" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pt-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-20">
          <div className="rise min-w-0 space-y-8">
            <h1 className="display text-[3.1rem] min-[400px]:text-[3.6rem] sm:text-7xl xl:text-[6.2rem]">
              Aprender es <span className="text-[#ffc83d]">salvar</span> el mundo
            </h1>
            <p className="max-w-xl text-lg text-white/85 sm:text-xl">Cursos y clases donde cada lección es una aventura y cada estudiante, el protagonista. Sin anuncios, en cualquier dispositivo y con la primera lección gratis.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/registro" className="btn btn-lg btn-white">Crear cuenta gratis</Link>
              <Link href="/programas" className="btn btn-lg btn-dark">Ver cursos y clases <Icon name="arrow" className="size-5" /></Link>
            </div>
          </div>
          <div className="rise relative mx-auto w-full min-w-0 max-w-xl [animation-delay:120ms]">
            <DungeonShowcase />
          </div>
        </div>
      </section>

      {/* ===== Filas alternas ===== */}
      <section aria-label="Cómo se aprende en Umbral" className="mx-auto max-w-7xl space-y-24 px-4 py-10 sm:space-y-32 sm:px-6">
        {FEATURES.map((f, i) => (
          <article key={f.title} className={`grid items-center gap-10 lg:gap-16 lg:grid-cols-[1.25fr_1fr] ${i % 2 ? "lg:[&>*:first-child]:order-2 lg:grid-cols-[1fr_1.25fr]" : ""}`}>
            <div className="card-bold hoverable relative aspect-[4/3] overflow-hidden">
              <Sprite src={f.scene} alt="" decorative className="absolute inset-0 size-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#15103f]/70 via-transparent to-transparent" aria-hidden="true" />
              <Sprite src={f.sprite} alt={f.alt} className={`absolute w-auto drop-shadow-2xl ${f.spriteClass}`} />
            </div>
            <div className="space-y-5">
              <p className="eyebrow">{f.eyebrow}</p>
              <h2 className="display text-4xl sm:text-5xl xl:text-6xl">{f.title}</h2>
              <p className="max-w-md text-lg text-muted">{f.text}</p>
            </div>
          </article>
        ))}
      </section>

      {/* ===== Explora por categoría ===== */}
      <section aria-labelledby="explora-t" className="mx-auto max-w-7xl px-4 pt-28 sm:px-6">
        <h2 id="explora-t" className="display text-center text-4xl sm:text-6xl">Explora</h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.label}>
              <Link href={c.href} className="card-bold group flex h-full flex-col gap-6 p-7">
                <span className="grid size-14 place-items-center rounded-2xl bg-[#6b3bf5] text-white shadow-lg shadow-[#6b3bf5]/40 transition group-hover:scale-110 group-hover:rotate-[-6deg]"><Icon name={c.icon} className="size-7" /></span>
                <span className="mt-auto">
                  <span className="block font-display text-2xl font-extrabold uppercase tracking-tight">{c.label}</span>
                  <span className="mt-1 flex items-center justify-between text-muted">{c.detail} <Icon name="arrow" className="size-5 transition group-hover:translate-x-1 group-hover:text-white" /></span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Cursos y clases ===== */}
      <section id="programas" aria-labelledby="programas-t" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Programas destacados</p>
            <h2 id="programas-t" className="display mt-3 text-4xl sm:text-6xl">Cursos y clases</h2>
          </div>
          <form action="/programas" role="search" className="flex w-full max-w-md items-center gap-2 rounded-full bg-white p-1.5 pl-5 text-[#15103f]">
            <label htmlFor="buscar-home" className="sr-only">¿Qué quieres aprender?</label>
            <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-[#5c5876]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input id="buscar-home" name="q" placeholder="¿Qué quieres aprender?" className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-[#8a86a3]" />
            <button type="submit" className="btn btn-primary btn-sm">Buscar</button>
          </form>
        </div>
        {featured.length ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => <ProgramCard key={c.slug} c={c} />)}
          </ul>
        ) : (
          <p className="card-bold mt-10 p-10 text-center text-lg text-muted">Muy pronto publicaremos los primeros programas.</p>
        )}
      </section>

      {/* ===== Filosofía ===== */}
      <section id="filosofia" aria-labelledby="filosofia-t" className="relative isolate scroll-mt-24 overflow-hidden px-4 py-24 sm:px-6">
        <div className="glow left-1/2 top-1/2 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 bg-[#6b3bf5]/25" aria-hidden="true" />
        <div className="mx-auto max-w-5xl text-center">
          <p className="eyebrow">Nuestra filosofía</p>
          <h2 id="filosofia-t" className="display mt-4 text-4xl sm:text-6xl xl:text-7xl">No solo cursos: una <span className="text-[#ffc83d]">historia</span> que vale la pena vivir</h2>
        </div>
        <ul className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <li key={v.title} className="card-bold hoverable p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-[#ffc83d]"><Icon name={v.icon} /></span>
              <h3 className="mt-5 text-xl font-extrabold">{v.title}</h3>
              <p className="mt-1 text-muted">{v.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Para instituciones ===== */}
      <section aria-labelledby="inst-t" className="px-4 sm:px-6">
        <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#6b3bf5] via-[#4a22c9] to-[#2a1f7a] p-8 sm:p-14">
          <div className="stars -z-10" aria-hidden="true" />
          <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#ffc83d]">Para instituciones educativas</p>
              <h2 id="inst-t" className="display text-4xl sm:text-5xl">Soluciones para docentes, directivos e instituciones</h2>
              <ul className="flex flex-wrap gap-2 pt-1">
                {SERVICES.map((s) => <li key={s.id} className="rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/25">{s.title}</li>)}
              </ul>
            </div>
            <div className="flex flex-wrap gap-4 lg:justify-end">
              <Link href="/servicios" className="btn btn-lg btn-white">Conocer los servicios</Link>
              <Link href="/servicios#contacto" className="btn btn-lg btn-dark">Hablemos</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Cierre ===== */}
      <section aria-labelledby="cierre-t" className="relative isolate overflow-hidden px-4 pb-10 pt-32 text-center sm:px-6">
        <div className="stars -z-10" aria-hidden="true" />
        <Sprite src={asset.kuro("saludar", "joven")} alt="" decorative className="drift mx-auto h-40 w-auto sm:h-52" />
        <h2 id="cierre-t" className="display mx-auto mt-6 max-w-4xl text-5xl sm:text-7xl">¿Listo para cruzar el umbral?</h2>
        <p className="mx-auto mt-5 max-w-lg text-lg text-muted">Crea tu cuenta gratis y empieza hoy tu primera aventura.</p>
        <Link href="/registro" className="btn btn-lg btn-white mt-8">Empieza gratis</Link>
      </section>
    </SiteShell>
  );
}
