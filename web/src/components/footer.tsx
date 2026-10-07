import Link from "next/link";
import { Logo } from "@/components/logo";
import { SUPPORT_EMAIL } from "@/lib/features";

const COLUMNS = [
  { title: "Academia", links: [["/programas", "Cursos"], ["/servicios", "Servicios"], ["/proyectos", "Proyectos"]] },
  { title: "Tu cuenta", links: [["/ingresar", "Ingresar"], ["/registro", "Crear cuenta"], ["/verificar", "Verificar una constancia"]] },
  { title: "Legal", links: [["/privacidad", "Privacidad y datos"], ["/terminos", "Términos de uso"]] },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-bg-2 print:hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
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
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">© {new Date().getFullYear()} UNEX Academy · Mgtr. Jesús David Álvarez Sáez. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
