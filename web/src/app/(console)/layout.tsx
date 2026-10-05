import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { ConsoleNav } from "@/components/console-nav";
import { Emblem } from "@/components/logo";
import { requireAdmin } from "@/lib/auth";

/** Consola de administración: diseño propio, sobrio y sin elementos del juego. */
export default async function ConsoleLayout({ children }: LayoutProps<"/">) {
  const viewer = await requireAdmin("/admin");
  return (
    <div className="theme-console">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="Academia Virtual Umbral · Consola de administración">
            <Emblem size={26} />
            <span className="sr-only">UMBRAL</span>
            <span className="rounded-md border border-line px-1.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">Consola</span>
          </Link>
          <nav aria-label="Salidas" className="ml-auto flex items-center gap-1 text-sm">
            <Link href="/" className="rounded-md px-2.5 py-1.5 text-muted hover:bg-white/5 hover:text-text">Ver el sitio</Link>
            <Link href="/nueva-contrasena" className="hidden rounded-md px-2.5 py-1.5 text-muted hover:bg-white/5 hover:text-text sm:inline">Cambiar contraseña</Link>
            <span className="hidden px-2 text-muted md:inline">{viewer.displayName}</span>
            <form action={logoutAction}><button type="submit" className="btn btn-ghost btn-sm">Salir</button></form>
          </nav>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[12.5rem_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start"><ConsoleNav /></aside>
        <main id="contenido" className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
