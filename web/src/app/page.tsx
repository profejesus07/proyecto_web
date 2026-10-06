import Link from "next/link";
import { Icon } from "@/components/icons";
import { KuroGreeter } from "@/components/kuro-greeter";
import { SiteShell } from "@/components/site-header";
import { Sprite, asset } from "@/components/sprite";
import { formatPrice, loadCatalog } from "@/lib/data/queries";

// El catálogo se vuelve a leer cada 10 minutos.
export const revalidate = 600;

/** Portada: una bienvenida corta y cálida de Kuro, con el mismo estilo del Gremio que la página de ingreso. */
export default async function Home() {
  const featured = (await loadCatalog()).slice(0, 3);

  return (
    <SiteShell gremio>
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <section aria-labelledby="bienvenida-t" className="mx-auto grid max-w-4xl items-center gap-8 md:grid-cols-[1fr_1.5fr]">
          <aside className="text-center">
            <KuroGreeter />
            <p className="mt-3 font-display text-xl font-bold">¡Hola! Soy Kuro.</p>
            <p className="text-sm text-muted">Tócame, ¡me encanta saludar!</p>
          </aside>
          <div className="panel space-y-5 p-6 sm:p-8">
            <p className="eyebrow">Academia Virtual Umbral</p>
            <h1 id="bienvenida-t" className="text-3xl sm:text-4xl">Bienvenido al Gremio</h1>
            <p className="text-muted">Aquí aprender se vive como una aventura: cursos y clases con lecciones breves, retos que se superan y constancias verificables.</p>
            <p className="font-semibold">La primera lección de cada curso es gratis.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/programas" className="btn btn-primary">Ver cursos</Link>
              <Link href="/registro" className="btn btn-secondary">Crear cuenta gratis</Link>
            </div>
            <p className="text-sm text-muted">¿Ya tienes cuenta? <Link href="/ingresar" className="font-semibold text-cyan underline underline-offset-4">Ingresa aquí</Link></p>
          </div>
        </section>

        {featured.length > 0 && (
          <section aria-labelledby="cursos-t" className="mt-16 space-y-5">
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
