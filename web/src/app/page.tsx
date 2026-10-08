import Link from "next/link";
import { Icon } from "@/components/icons";
import { KuroGreeter } from "@/components/kuro-greeter";
import { SiteShell } from "@/components/site-header";
import { Sprite, asset } from "@/components/sprite";
import { formatPrice, loadCatalog } from "@/lib/data/queries";
import { VIEWPORT_PUBLICO } from "@/config/viewport-publico";
import styles from "./portada.module.css";

export const viewport = VIEWPORT_PUBLICO;

// El catálogo se vuelve a leer cada 10 minutos.
export const revalidate = 600;

/** Portada: la bienvenida de Kuro sobre Cosmos, como la portada del sitio principal UNEX; debajo, los cursos. */
export default async function Home() {
  const featured = (await loadCatalog()).slice(0, 3);

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

      <div className="mx-auto w-full max-w-5xl px-4 pb-4 sm:px-6">
        {featured.length > 0 && (
          <section aria-labelledby="cursos-t" className="mt-14 space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="cursos-t" className="text-2xl">Cursos para empezar</h2>
              <Link href="/programas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline hover:underline-offset-4">Ver todos <Icon name="arrow" className="size-4" /></Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((c) => (
                <li key={c.slug}>
                  <Link href={`/programas/${c.slug}`} className="panel flex h-full items-center gap-4 p-4 transition hover:border-cyan/60">
                    <Sprite src={asset.boss(c.guardian)} alt="" decorative className="size-16 shrink-0 object-contain" />
                    <span className="min-w-0">
                      <span className="block font-display font-bold leading-snug">{c.title}</span>
                      <span className="mt-1 block text-sm text-muted">{c.lessons} {c.lessons === 1 ? "lección" : "lecciones"} · {c.isFree ? "Gratis" : c.price === null ? "1.ª lección gratis" : formatPrice(c.price)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
