import Link from "next/link";
import { Logo } from "@/components/logo";
import { productos, sitioPrincipal } from "@/config/productos";
import { SUPPORT_EMAIL } from "@/lib/features";

const COLUMNS = [
  { title: "UNEX Academy", links: [["/programas", "Cursos"], ["/servicios", "Servicios"]] },
  { title: "Tu cuenta", links: [["/ingresar", "Ingresar"], ["/registro", "Crear cuenta"], ["/verificar", "Verificar una constancia"]] },
  { title: "Legal", links: [["/privacidad", "Privacidad y datos"], ["/terminos", "Términos de uso"]] },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-bg-2 print:hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted">Cursos en línea con historia, práctica guiada y constancias verificables.</p>
          <p className="text-sm"><a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-text underline decoration-line underline-offset-4 hover:decoration-current">{SUPPORT_EMAIL}</a></p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="space-y-3 text-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{col.title}</p>
            {col.links.map(([href, label]) => (
              <Link key={href} className="block text-text/80 transition hover:text-text" href={href}>{label}</Link>
            ))}
          </nav>
        ))}
        {/* Las plataformas UNEX (en el Gremio, el único acceso: la franja de arriba no se muestra ahí). */}
        <nav aria-label="Plataformas UNEX" className="space-y-3 text-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Plataformas UNEX</p>
          <a className="block text-text/80 transition hover:text-text" href={sitioPrincipal.url}>{sitioPrincipal.nombre}</a>
          {productos.filter((p) => p.id !== "academy").map((p) => p.url ? (
            <a key={p.id} className="block text-text/80 transition hover:text-text" href={p.url}>{p.nombre}</a>
          ) : (
            <p key={p.id} className="text-text/60">{p.nombre} <span className="ml-1 rounded-full border border-current px-1.5 text-[0.6875rem]">Próximamente</span></p>
          ))}
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">© {new Date().getFullYear()} UNEX Academy · Mgtr. Jesús David Álvarez Sáez. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
