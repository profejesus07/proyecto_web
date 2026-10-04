import Link from "next/link";
import { Logo } from "@/components/logo";
import { SUPPORT_EMAIL } from "@/lib/features";

const COLUMNS = [
  { title: "UMBRAL", links: [["/programas", "Cursos y clases"], ["/servicios", "Para instituciones"], ["/#filosofia", "Filosofía"]] },
  { title: "Tu cuenta", links: [["/registro", "Crear cuenta"], ["/ingresar", "Ingresar"], ["/verificar", "Verificar una constancia"]] },
  { title: "Confianza", links: [["/privacidad", "Privacidad y datos"], ["/terminos", "Términos de uso"]] },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/60 bg-bg-2/60 print:hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted">Educación con historia: cursos, clases y plataformas para que aprender se sienta como salvar el mundo.</p>
          <p className="text-sm"><a href={`mailto:${SUPPORT_EMAIL}`} className="text-muted underline-offset-4 hover:text-text hover:underline">{SUPPORT_EMAIL}</a></p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="space-y-3 text-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text/80">{col.title}</p>
            {col.links.map(([href, label]) => (
              <Link key={href} className="block text-muted transition hover:text-text" href={href}>{label}</Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="border-t border-line/40">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">© {new Date().getFullYear()} Umbral · Mgtr. Jesús David Álvarez Sáez. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
