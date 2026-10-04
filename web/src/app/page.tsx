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

const VALUES: { icon: IconName; title: string; text: string; color: string }[] = [
  { icon: "play", title: "Primera lección gratis", text: "Prueba antes de decidir.", color: "#ff5a36" },
  { icon: "seal", title: "Constancias verificables", text: "Se comprueban en línea.", color: "#5b3df5" },
  { icon: "people", title: "Acompañamiento real", text: "Docentes y familias ven el avance.", color: "#0fa98f" },
  { icon: "feedback", title: "Retroalimentación al instante", text: "Cada respuesta se explica.", color: "#e79a00" },
];

const PILLARS: { title: string; text: string; color: string; bg: string }[] = [
  { title: "Historia", text: "Cada contenido vive dentro de una narrativa.", color: "#5b3df5", bg: "#efebff" },
  { title: "Aventura", text: "Retos que se superan, no tareas que se entregan.", color: "#ff5a36", bg: "#fff0eb" },
  { title: "Descubrimiento", text: "Aprender es encontrar, no memorizar.", color: "#0fa98f", bg: "#e6f8f4" },
  { title: "Propósito", text: "Lo que aprendes salva tu mundo.", color: "#c98200", bg: "#fff6dc" },
];

export default async function Home() {
  const catalog = await loadCatalog();
  const featured = catalog.slice(0, 4);
  const [gremio] = UNIVERSES;
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const categories: { label: string; href: string; detail: string; icon: IconName; color: string; bg: string }[] = [
    { label: "Cursos cortos", href: "/programas?tipo=curso", detail: count(catalog.filter((c) => c.kind === "curso").length, "programa", "programas"), icon: "lesson", color: "#ff5a36", bg: "#fff0eb" },
    { label: "Clases anuales", href: "/programas?tipo=clase", detail: count(catalog.filter((c) => c.kind === "clase").length, "clase", "clases"), icon: "clock", color: "#0fa98f", bg: "#e6f8f4" },
    { label: "Gratis", href: "/programas?tipo=gratis", detail: count(catalog.filter((c) => c.isFree).length, "programa", "programas"), icon: "play", color: "#c98200", bg: "#fff6dc" },
    { label: "Para instituciones", href: "/servicios", detail: "Plataformas a la medida", icon: "people", color: "#5b3df5", bg: "#efebff" },
  ];

  return (
    <SiteShell>
      {/* ===== Portada ===== */}
      <section className="brand-hero relative isolate overflow-hidden">
        <div className="dots absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-24 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-20">
          <div className="rise space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
              <span className="size-2 rounded-full bg-[#ffc233]" aria-hidden="true" /> Educación con historia
            </p>
            <h1 className="text-[2.9rem] font-extrabold leading-[1] sm:text-7xl">
              Aprender es <span className="text-[#ffc233]">salvar</span> el mundo.
            </h1>
            <p className="max-w-lg text-lg text-white/85 sm:text-xl">Cursos y clases donde cada lección es una aventura y cada estudiante, el protagonista.</p>
            <form action="/programas" role="search" className="flex max-w-xl items-center gap-2 rounded-full bg-white p-2 pl-5 text-[#17142b] shadow-2xl shadow-black/20">
              <label htmlFor="buscar-home" className="sr-only">¿Qué quieres aprender?</label>
              <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-[#5c5876]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input id="buscar-home" name="q" placeholder="¿Qué quieres aprender?" className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-[#8a86a3]" />
              <button type="submit" className="btn btn-accent">Buscar</button>
            </form>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
              <span className="flex items-center gap-1.5"><Icon name="check" className="size-4 text-[#ffc233]" /> Sin anuncios</span>
              <span className="flex items-center gap-1.5"><Icon name="check" className="size-4 text-[#ffc233]" /> En cualquier dispositivo</span>
              <span className="flex items-center gap-1.5"><Icon name="check" className="size-4 text-[#ffc233]" /> Primera lección gratis</span>
            </div>
          </div>

          <div className="rise relative mx-auto w-full max-w-lg [animation-delay:120ms]">
            <div className="overflow-hidden rounded-[2rem] border-4 border-white/20 bg-white/10 shadow-2xl shadow-black/30">
              <UniverseArt u={gremio} className="aspect-[4/3]" />
            </div>
            <div className="drift absolute -left-4 top-6 rounded-2xl bg-white px-4 py-3 text-[#17142b] shadow-xl sm:-left-10" style={{ ["--r" as string]: "-4deg" }} aria-hidden="true">
              <p className="text-xs font-bold uppercase tracking-wider text-[#ff5a36]">Misión superada</p>
              <p className="font-display text-xl font-extrabold">+60 XP ✨</p>
            </div>
            <div className="drift absolute -bottom-5 right-2 rounded-2xl bg-[#ffc233] px-4 py-3 text-[#17142b] shadow-xl [animation-delay:1.5s] sm:-right-6" style={{ ["--r" as string]: "3deg" }} aria-hidden="true">
              <p className="text-xs font-bold uppercase tracking-wider">Universo</p>
              <p className="font-display text-base font-extrabold leading-tight">{gremio.name}</p>
            </div>
          </div>
        </div>
        {/* Borde ondulado hacia la siguiente sección. */}
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-10 w-full text-[var(--bg)]" aria-hidden="true">
          <path d="M0 60V30C240 0 480 0 720 22s480 38 720 8v30z" fill="currentColor" />
        </svg>
      </section>

      {/* ===== Explora por categoría ===== */}
      <section aria-labelledby="explora-t" className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <h2 id="explora-t" className="text-2xl font-extrabold sm:text-3xl">Explora</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.label}>
              <Link href={c.href} className="lift group flex h-full items-center gap-4 rounded-2xl border border-line bg-panel p-5">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl" style={{ background: c.bg, color: c.color }}><Icon name={c.icon} className="size-6" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{c.label}</span>
                  <span className="block text-sm text-muted">{c.detail}</span>
                </span>
                <Icon name="arrow" className="size-5 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-[var(--cyan)]" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Cursos y clases ===== */}
      <section id="programas" aria-labelledby="programas-t" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Programas destacados</p>
            <h2 id="programas-t" className="mt-2 text-3xl font-extrabold sm:text-4xl">Cursos y clases</h2>
          </div>
          <Link href="/programas" className="btn btn-secondary btn-sm">Ver todos <Icon name="arrow" className="size-4" /></Link>
        </div>
        {featured.length ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => <ProgramCard key={c.slug} c={c} />)}
          </ul>
        ) : (
          <p className="mt-8 rounded-3xl border border-line bg-panel p-8 text-center text-muted">Muy pronto publicaremos los primeros programas.</p>
        )}
      </section>

      {/* ===== Valores ===== */}
      <section aria-label="Por qué UMBRAL" className="mx-auto max-w-6xl px-4 sm:px-6">
        <ul className="grid gap-4 rounded-[2rem] bg-panel-2 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
          {VALUES.map((v) => (
            <li key={v.title} className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white shadow-md" style={{ background: v.color }}><Icon name={v.icon} /></span>
              <span><span className="block font-bold leading-tight">{v.title}</span><span className="text-sm text-muted">{v.text}</span></span>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Filosofía ===== */}
      <section id="filosofia" aria-labelledby="filosofia-t" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Nuestra filosofía</p>
          <h2 id="filosofia-t" className="mt-2 text-3xl font-extrabold leading-tight sm:text-5xl">No solo cursos: una <span className="hl">historia</span> que vale la pena vivir.</h2>
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <li key={p.title} className="lift rounded-3xl p-6" style={{ background: p.bg }}>
              <span className="grid size-10 place-items-center rounded-full font-display text-sm font-extrabold text-white" style={{ background: p.color }}>0{i + 1}</span>
              <h3 className="mt-5 text-2xl font-extrabold" style={{ color: p.color }}>{p.title}</h3>
              <p className="mt-1 text-[#3b3756]">{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Para instituciones ===== */}
      <section aria-labelledby="inst-t" className="px-4 sm:px-6">
        <div className="brand-band relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] p-8 sm:p-12">
          <div className="dots absolute inset-0 opacity-50" aria-hidden="true" />
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-[#ff5a36]/40 blur-3xl" aria-hidden="true" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ffc233]">Para instituciones educativas</p>
              <h2 id="inst-t" className="text-3xl font-extrabold leading-tight sm:text-4xl">Soluciones para docentes, directivos e instituciones</h2>
              <ul className="flex flex-wrap gap-2 pt-1">
                {SERVICES.map((s) => <li key={s.id} className="rounded-full bg-white/12 px-3 py-1 text-sm font-medium text-white ring-1 ring-white/20">{s.title}</li>)}
              </ul>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/servicios" className="btn btn-lg btn-light">Conocer los servicios</Link>
              <Link href="/servicios#contacto" className="btn btn-lg btn-outline-light">Hablemos</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Cierre ===== */}
      <section aria-labelledby="cierre-t" className="px-4 py-20 sm:px-6">
        <div className="warm-band mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 rounded-[2rem] p-8 sm:p-12">
          <div>
            <h2 id="cierre-t" className="text-3xl font-extrabold sm:text-4xl">¿Listo para cruzar el umbral?</h2>
            <p className="mt-2 text-lg text-[#3b2a17]">Crea tu cuenta gratis y empieza hoy tu primera aventura.</p>
          </div>
          <Link href="/registro" className="btn btn-lg bg-[#17142b] text-white hover:bg-black">Empieza gratis</Link>
        </div>
      </section>
    </SiteShell>
  );
}
