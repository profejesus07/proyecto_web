import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProgramCard } from "@/components/program-card";
import { SiteShell } from "@/components/site-header";
import { DungeonShowcase } from "@/components/dungeon-showcase";
import { Sprite, asset } from "@/components/sprite";
import { VALUES, categoriesFor, type Catalog } from "@/components/home/shared";
import { SERVICES } from "@/content/servicios";

/** Momentos de la aventura: escenario + personaje dentro de un panel del Gremio. */
const MOMENTS: { eyebrow: string; title: string; text: string; scene: string; sprite: string; alt: string; spriteClass: string }[] = [
  {
    eyebrow: "Historia", title: "Cada lección abre un portal",
    text: "Sora te guía de mundo en mundo y cada tema es un lugar nuevo por descubrir.",
    scene: asset.scene("portales", "disponible"), sprite: asset.sora("abrir-portal"), alt: "Sora abre un portal", spriteClass: "bottom-0 left-1/2 h-[80%] -translate-x-1/2",
  },
  {
    eyebrow: "Aventura", title: "Retos que se superan",
    text: "Al final de cada módulo espera un Guardián; cada error se explica para que vuelvas más fuerte.",
    scene: asset.scene("mazmorra", "fuego"), sprite: asset.boss("petrox", "provocar"), alt: "Petrox, el Guardián de piedra", spriteClass: "bottom-[4%] right-[10%] h-[82%]",
  },
  {
    eyebrow: "Descubrimiento", title: "Sube de rango con Kuro",
    text: "Ganas experiencia, monedas y objetos; tu compañero crece contigo misión a misión.",
    scene: asset.scene("gremio", "dia"), sprite: asset.kuro("celebrar", "majestuoso"), alt: "Kuro majestuoso celebra en el Gremio", spriteClass: "bottom-[2%] left-[10%] h-[70%]",
  },
  {
    eyebrow: "Propósito", title: "Docentes y familias acompañan",
    text: "Informes claros, constancias verificables y mensajes de la familia en un mismo lugar.",
    scene: asset.scene("terraza", "manana"), sprite: "/assets/familia/mama-lucia/mama-lucia-orgullo.svg", alt: "Mamá Lucía mira orgullosa el avance", spriteClass: "bottom-0 right-[12%] h-[80%]",
  },
];

/** Portada con el estilo del Gremio (paneles, botones dorados, personajes) en modo claro. */
export function HomeClaro({ catalog }: { catalog: Catalog }) {
  const featured = catalog.slice(0, 4);
  const categories = categoriesFor(catalog);

  return (
    <SiteShell variant="claro">
      {/* ===== Portada ===== */}
      <section className="relative isolate overflow-hidden">
        <div className="dots-claro absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-24 lg:pt-20">
          <div className="rise min-w-0 space-y-7">
            <p className="chip"><span className="size-2 rounded-full bg-gold" aria-hidden="true" /> Academia Virtual Umbral · Educación con historia</p>
            <h1 className="text-[2.6rem] font-extrabold leading-[1] min-[380px]:text-[2.9rem] sm:text-6xl lg:text-7xl">
              Aprender es <span className="marker">salvar</span> el mundo.
            </h1>
            <p className="max-w-lg text-lg text-muted sm:text-xl">Cursos y clases donde cada lección es una aventura y cada estudiante, el protagonista.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/registro" className="btn btn-primary btn-lg">Crear cuenta gratis</Link>
              <Link href="/programas" className="btn btn-secondary btn-lg">Ver cursos y clases</Link>
            </div>
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
              {["Sin anuncios", "En cualquier dispositivo", "Primera lección gratis"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Icon name="check" className="size-4 text-[#6b3bf5]" /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="rise relative mx-auto w-full min-w-0 max-w-lg [animation-delay:120ms]">
            <DungeonShowcase />
          </div>
        </div>
      </section>

      {/* ===== Momentos de la aventura ===== */}
      <section aria-labelledby="aventura-t" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Así se aprende en Umbral</p>
          <h2 id="aventura-t" className="mt-2 text-3xl font-extrabold sm:text-4xl">Una aventura en cuatro momentos</h2>
        </div>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {MOMENTS.map((m) => (
            <li key={m.title} className="panel lift overflow-hidden p-3">
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
                <Sprite src={m.scene} alt="" decorative className="absolute inset-0 size-full object-cover" />
                <Sprite src={m.sprite} alt={m.alt} className={`absolute w-auto drop-shadow-xl ${m.spriteClass}`} />
              </div>
              <div className="px-3 pb-3 pt-5">
                <p className="eyebrow">{m.eyebrow}</p>
                <h3 className="mt-1 text-2xl font-extrabold">{m.title}</h3>
                <p className="mt-1 text-muted">{m.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Explora ===== */}
      <section aria-labelledby="explora-t" className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <h2 id="explora-t" className="text-2xl font-extrabold sm:text-3xl">Explora</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.label}>
              <Link href={c.href} className="panel lift group flex h-full items-center gap-4 p-5">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#6b3bf5]/10 text-[#6b3bf5] transition group-hover:bg-[#6b3bf5] group-hover:text-white"><Icon name={c.icon} className="size-6" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{c.label}</span>
                  <span className="block text-sm text-muted">{c.detail}</span>
                </span>
                <Icon name="arrow" className="size-5 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-[#6b3bf5]" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Programas ===== */}
      <section id="programas" aria-labelledby="programas-t" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Programas destacados</p>
            <h2 id="programas-t" className="mt-2 text-3xl font-extrabold sm:text-4xl">Cursos y clases</h2>
          </div>
          <form action="/programas" role="search" className="flex w-full max-w-md items-center gap-2 sm:w-auto">
            <label htmlFor="buscar-home" className="sr-only">¿Qué quieres aprender?</label>
            <input id="buscar-home" name="q" placeholder="¿Qué quieres aprender?" className="input min-w-0 flex-1 sm:w-72" />
            <button type="submit" className="btn btn-secondary">Buscar</button>
          </form>
        </div>
        {featured.length ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => <ProgramCard key={c.slug} c={c} />)}
          </ul>
        ) : (
          <p className="panel mt-8 p-8 text-center text-muted">Muy pronto publicaremos los primeros programas.</p>
        )}
      </section>

      {/* ===== Valores ===== */}
      <section id="filosofia" aria-label="Por qué la Academia Virtual Umbral" className="mx-auto max-w-6xl scroll-mt-24 px-4 sm:px-6">
        <ul className="panel grid gap-6 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
          {VALUES.map((v) => (
            <li key={v.title} className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#15103f] text-gold shadow-md"><Icon name={v.icon} /></span>
              <span><span className="block font-bold leading-tight">{v.title}</span><span className="text-sm text-muted">{v.text}</span></span>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Instituciones ===== */}
      <section aria-labelledby="inst-t" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="panel panel-glow grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            <p className="eyebrow">Para instituciones educativas</p>
            <h2 id="inst-t" className="text-3xl font-extrabold leading-tight sm:text-4xl">Soluciones para docentes, directivos e instituciones</h2>
            <ul className="flex flex-wrap gap-2 pt-1">
              {SERVICES.map((s) => <li key={s.id} className="chip">{s.title}</li>)}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/servicios" className="btn btn-primary btn-lg">Conocer los servicios</Link>
            <Link href="/servicios#contacto" className="btn btn-secondary btn-lg">Hablemos</Link>
          </div>
        </div>
      </section>

      {/* ===== Cierre: Kuro invita ===== */}
      <section aria-labelledby="cierre-t" className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <Sprite src={asset.kuro("saludar", "joven")} alt="" decorative className="float h-40 w-auto shrink-0" />
          <div className="panel relative flex-1 p-6 sm:p-8">
            <p className="eyebrow">Kuro</p>
            <h2 id="cierre-t" className="mt-1 text-3xl font-extrabold">¿Listo para cruzar el umbral?</h2>
            <p className="mt-2 text-muted">Crea tu cuenta gratis y empieza hoy tu primera aventura.</p>
            <Link href="/registro" className="btn btn-primary btn-lg mt-5">Empieza gratis</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
