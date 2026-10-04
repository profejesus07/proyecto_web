import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/60 bg-bg-2/60 print:hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted">Cursos que se viven como una aventura. Creado por un docente, pensado para estudiantes, familias y maestros.</p>
        </div>
        <nav aria-label="Plataforma" className="space-y-2 text-sm">
          <p className="font-bold">Plataforma</p>
          <Link className="block text-muted hover:text-text" href="/registro">Crear cuenta</Link>
          <Link className="block text-muted hover:text-text" href="/ingresar">Ingresar</Link>
          <Link className="block text-muted hover:text-text" href="/#guardianes">Los Guardianes</Link>
        </nav>
        <nav aria-label="Legal" className="space-y-2 text-sm">
          <p className="font-bold">Confianza</p>
          <Link className="block text-muted hover:text-text" href="/privacidad">Privacidad y datos</Link>
          <Link className="block text-muted hover:text-text" href="/terminos">Términos de uso</Link>
          <Link className="block text-muted hover:text-text" href="/verificar">Verificar una constancia</Link>
        </nav>
      </div>
      <div className="border-t border-line/40 py-5 text-center text-xs text-muted">© {new Date().getFullYear()} Umbral. Todos los derechos reservados.</div>
    </footer>
  );
}
