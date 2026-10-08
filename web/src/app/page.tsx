import Link from "next/link";
import { Icon } from "@/components/icons";
import { KuroGreeter } from "@/components/kuro-greeter";
import { SiteShell } from "@/components/site-header";
import { Sprite, asset } from "@/components/sprite";
import { UniverseArt } from "@/components/universe-art";
import { UNIVERSES, cursosDelUniverso } from "@/content/universos";
import { formatPrice, loadCatalog } from "@/lib/data/queries";
import { VIEWPORT_PUBLICO } from "@/config/viewport-publico";
import styles from "./portada.module.css";

export const viewport = VIEWPORT_PUBLICO;

// El catálogo se vuelve a leer cada 10 minutos.
export const revalidate = 600;

/** Portada: la bienvenida de Kuro sobre Cosmos, como la portada del sitio principal UNEX; debajo, los universos
 *  (el Gremio de los Portales primero, con sus cursos para empezar). */
export default async function Home() {
  const catalogo = await loadCatalog();
  const disponibles = UNIVERSES.filter((u) => u.status === "disponible");

  return (
    <SiteShell>
      <section data-tema="oscuro" aria-labelledby="bienvenida-t" className={styles.portada}>
        <div className={styles.contenido}>
          <div className={styles.kuro}>
            <KuroGreeter />
            <p className="mt-3 font-display text-xl font-bold">¡Hola! Soy Kuro.</p>
            <p className="text-sm text-muted">Tócame, ¡me encanta saludar!</p>
          </div>
          <div>
            <p className="eyebrow">UNEX Academy</p>
            <h1 id="bienvenida-t" className="mt-2">Bienvenido al Gremio</h1>
            <p className={styles.entradilla}>Aquí aprender se vive como una aventura: cursos y clases con lecciones breves, retos que se superan y constancias verificables.</p>
            <p className="mt-3 font-medium">La primera lección de cada curso es gratis.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/registro" className="btn btn-primary">Crear cuenta gratis</Link>
              <Link href="/programas" className="btn btn-secondary">Ver cursos</Link>
            </div>
            <p className="mt-5 text-sm text-muted">¿Ya tienes cuenta? <Link href="/ingresar" className="font-semibold text-cyan underline underline-offset-4">Ingresa aquí</Link></p>
          </div>
        </div>
      </section>

      <section aria-labelledby="universos-t" className="mx-auto w-full max-w-5xl px-4 pb-4 pt-14 sm:px-6">
        <p className="eyebrow">Universos</p>
        <h2 id="universos-t" className="mt-2">Elige tu universo</h2>
        <p className="mt-3 max-w-2xl text-muted">Cada universo es una forma distinta de vivir el aprendizaje, con su propia historia, sus personajes y su estilo.</p>

        <div className="mt-8 space-y-5">
          {disponibles.map((u) => {
            const cursos = cursosDelUniverso(u.id, catalogo).slice(0, 3);
            return (
              <article key={u.id} data-universo={u.id} aria-labelledby={`universo-${u.id}-t`} className="panel overflow-hidden md:grid md:grid-cols-[2fr_3fr]">
                <UniverseArt u={u} className="aspect-[16/10] md:aspect-auto md:min-h-full" />
                <div className="p-6 sm:p-8">
                  <p className="chip">{u.style}</p>
                  <h3 id={`universo-${u.id}-t`} className="universo-titulo mt-3 text-2xl font-bold">{u.name}</h3>
                  <p className="mt-2 text-muted">{u.tagline}</p>

                  {cursos.length > 0 && (
                    <section aria-labelledby={`cursos-${u.id}-t`} className="mt-6">
                      <h4 id={`cursos-${u.id}-t`} className="text-base">Cursos para empezar</h4>
                      <ul className="mt-3 space-y-2">
                        {cursos.map((c) => (
                          <li key={c.slug}>
                            <Link href={`/programas/${c.slug}`} className="flex items-center gap-3 rounded-xl border border-line bg-panel-2 p-3 transition hover:border-cyan/60">
                              <Sprite src={asset.boss(c.guardian)} alt="" decorative className="size-12 shrink-0 object-contain" />
                              <span className="min-w-0">
                                <span className="block font-display font-bold leading-snug">{c.title}</span>
                                <span className="mt-0.5 block text-sm text-muted">{c.lessons} {c.lessons === 1 ? "lección" : "lecciones"} · {c.isFree ? "Gratis" : c.price === null ? "1.ª lección gratis" : formatPrice(c.price)}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  <Link href="/programas" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline hover:underline-offset-4">Ver todos los cursos <Icon name="arrow" className="size-4" /></Link>
                </div>
              </article>
            );
          })}

          {/* Mientras los próximos universos no tengan nombre, una sola tarjeta genérica. */}
          <article aria-labelledby="universos-nuevos-t" className="rounded-2xl border-2 border-dashed border-line-fuerte p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h3 id="universos-nuevos-t" className="text-xl">Nuevos universos en camino</h3>
              <span className="chip">Próximamente</span>
            </div>
            <p className="mt-2 max-w-2xl text-muted">Estamos creando nuevos universos, cada uno con su historia, sus personajes y su estilo visual.</p>
          </article>
        </div>
      </section>
    </SiteShell>
  );
}
