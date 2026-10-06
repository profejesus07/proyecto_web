import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { ProgramCard } from "@/components/program-card";
import { SiteShell } from "@/components/site-header";
import { DungeonShowcase } from "@/components/dungeon-showcase";
import { HeroStage } from "@/components/hero-stage";
import { Sprite, asset } from "@/components/sprite";
import { loadCatalog } from "@/lib/data/queries";

// El catálogo se vuelve a leer cada 10 minutos.
export const revalidate = 600;

const PROMISES: { icon: IconName; text: string }[] = [
  { icon: "play", text: "Primera lección gratis" },
  { icon: "seal", text: "Constancias verificables" },
  { icon: "device", text: "Celular, tableta o computador" },
];

/** Cómo funciona: tres pasos, cada uno con su personaje. */
const STEPS: { title: string; text: string; sprite: string; alt: string }[] = [
  { title: "Elige un curso", text: "Cursos cortos o clases por área.", sprite: asset.sora("saludar"), alt: "Sora, la guía" },
  { title: "Aprende y practica", text: "Lecciones breves y retos con retroalimentación al instante.", sprite: asset.boss("petrox", "reposo"), alt: "Petrox, un Guardián" },
  { title: "Obtén tu constancia", text: "Verificable en línea con un código.", sprite: asset.kuro("celebrar", "joven"), alt: "Kuro celebra" },
];

export default async function Home() {
  const catalog = await loadCatalog();
  const featured = catalog.slice(0, 3);

  return (
    <SiteShell>
      {/* ===== Portada ===== */}
      <HeroStage className="paper overflow-hidden border-b border-line">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_28rem_at_85%_30%,rgb(138_92_255/0.14),transparent_70%),linear-gradient(to_bottom,transparent_60%,white)]" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="rise min-w-0">
            <div className="hero-parallax space-y-6">
              <p className="eyebrow">Academia virtual</p>
              <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl">
                Cursos en línea que se aprenden como una <span className="underline-gold">aventura</span>
              </h1>
              <p className="max-w-lg text-lg text-muted">Lecciones breves, práctica guiada y una historia que te acompaña de principio a fin.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/programas" className="btn btn-primary btn-lg">Ver cursos <Icon name="arrow" className="size-5" /></Link>
                <Link href="/registro" className="btn btn-secondary btn-lg">Crear cuenta gratis</Link>
              </div>
              <p className="text-sm text-muted">¿Ya tienes cuenta? <Link href="/ingresar" className="font-semibold text-[#4a22c9] underline underline-offset-4">Ingresar</Link></p>
            </div>
          </div>
          <div className="rise relative mx-auto w-full min-w-0 max-w-lg [animation-delay:120ms]">
            <div data-hero-tilt><DungeonShowcase /></div>
          </div>
        </div>
      </HeroStage>

      {/* ===== Lo esencial ===== */}
      <section aria-label="Lo esencial" className="border-b border-line">
        <ul className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6">
          {PROMISES.map((p) => (
            <li key={p.text} className="flex items-center justify-center gap-3 font-medium sm:justify-start">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f3f1fa] text-[#4a22c9]"><Icon name={p.icon} /></span>
              {p.text}
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Cursos ===== */}
      <section aria-labelledby="cursos-t" className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h2 id="cursos-t" className="mt-2 text-3xl sm:text-4xl">Cursos destacados</h2>
          </div>
          <Link href="/programas" className="inline-flex items-center gap-1.5 font-semibold text-[#4a22c9] hover:underline hover:underline-offset-4">Ver todos los cursos <Icon name="arrow" className="size-4" /></Link>
        </div>
        {featured.length ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => <ProgramCard key={c.slug} c={c} />)}
          </ul>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-muted">Muy pronto publicaremos los primeros cursos.</p>
        )}
      </section>

      {/* ===== Cómo funciona ===== */}
      <section aria-labelledby="como-t" className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <p className="eyebrow text-center">Cómo funciona</p>
        <h2 id="como-t" className="mt-2 text-center text-3xl sm:text-4xl">Tres pasos, una aventura</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-line bg-white p-6 pt-5">
              <div className="flex items-start justify-between">
                <span className="serif text-5xl text-[#4a22c9]/20">{i + 1}</span>
                <Sprite src={s.sprite} alt={s.alt} className="h-28 w-auto" />
              </div>
              <h3 className="mt-2 text-xl">{s.title}</h3>
              <p className="mt-1 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ===== Servicios ===== */}
      <section aria-labelledby="servicios-t" className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="ink-band grid items-center gap-8 overflow-hidden rounded-3xl p-8 sm:p-12 md:grid-cols-[1.4fr_auto]">
          <div className="space-y-3">
            <p className="eyebrow">Para docentes e instituciones</p>
            <h2 id="servicios-t" className="text-3xl sm:text-4xl">Plataformas educativas a la medida</h2>
            <p className="max-w-xl text-white/75">Gestión docente, exámenes, aplicaciones y gamificación para tu institución.</p>
          </div>
          <Link href="/servicios" className="btn btn-gold btn-lg justify-self-start">Ver servicios <Icon name="arrow" className="size-5" /></Link>
        </div>
      </section>
    </SiteShell>
  );
}
