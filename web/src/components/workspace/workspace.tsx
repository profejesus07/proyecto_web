import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { ROLE_LABEL } from "@/lib/roles";
import type { Profile } from "@/lib/data/types";
import { WorkspaceNav, type WorkspaceGroup } from "./workspace-nav";

/** Iniciales para el círculo de la cuenta. */
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
}

/**
 * Marco de los paneles de trabajo (consola de administración y panel docente): tema claro y
 * profesional, barra superior con la cuenta y menú lateral por secciones.
 */
export function Workspace({ viewer, badge, home, groups, navLabel, children }: {
  viewer: Profile; badge: string; home: string; groups: WorkspaceGroup[]; navLabel: string; children: React.ReactNode;
}) {
  return (
    <div className="theme-panel">
      <header data-fija="arriba" className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <Logo href={home} size="h-10" compact />
          <span className="badge badge-brand hidden sm:inline-flex">{badge}</span>
          <nav aria-label="Cuenta" className="ml-auto flex items-center gap-1">
            <Link href="/" className="btn btn-ghost btn-sm hidden md:inline-flex"><Icon name="external" className="size-4" /> Ver el sitio</Link>
            <Link href="/nueva-contrasena" className="btn btn-ghost btn-sm hidden md:inline-flex"><Icon name="key" className="size-4" /> Contraseña</Link>
            <span className="mx-1 hidden h-6 w-px bg-line md:block" aria-hidden="true" />
            <span className="flex items-center gap-2 pl-1">
              <span className="grid size-8 place-items-center rounded-full bg-[#15103f] text-xs font-bold text-white" aria-hidden="true">{initials(viewer.displayName)}</span>
              <span className="hidden leading-tight sm:block">
                <span className="block max-w-40 truncate text-sm font-semibold">{viewer.displayName}</span>
                <span className="block text-xs text-muted">{ROLE_LABEL[viewer.role]}</span>
              </span>
            </span>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost btn-sm" aria-label="Salir" title="Salir"><Icon name="logout" className="size-4" /><span className="hidden sm:inline">Salir</span></button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto grid max-w-[90rem] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[15rem_1fr] lg:gap-10 lg:py-8">
        <aside className="min-w-0 print:hidden lg:sticky lg:top-24 lg:self-start">
          <WorkspaceNav groups={groups} label={navLabel} />
        </aside>
        <main id="contenido" className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
