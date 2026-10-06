import Link from "next/link";
import { Footer } from "@/components/footer";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { AvatarFace } from "@/components/avatar-face";
import { GuideFace } from "@/components/guide-face";
import { guideFor } from "@/lib/guides";
import { getViewer } from "@/lib/auth";
import { rankProgress } from "@/lib/game/ranks";
import { homePath, isAdmin, isStaff } from "@/lib/roles";
import { NavLinks } from "./nav-links";
import { SoundControl } from "./sound";
import { SiteNav } from "./site-nav";

export async function SiteHeader() {
  const viewer = await getViewer();
  const rank = viewer ? rankProgress(viewer.xp).rank : null;
  // Docentes y familias se ven con su Maestro o Guardián del Hogar.
  const adultGuide = viewer ? guideFor(viewer) : null;

  // El administrador no juega: en las pocas páginas compartidas (informes de grupo, constancias,
  // contraseña) ve una cabecera de administración, sin monedas, avatar ni menú del juego.
  if (viewer && isAdmin(viewer.role)) {
    return (
      <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-[4.5rem] max-w-6xl sm:h-20 items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href="/admin" compact />
          <nav aria-label="Administración" className="flex items-center gap-2">
            <Link href="/admin" className="btn btn-secondary btn-sm">← Volver a la consola</Link>
            <form action={logoutAction}>
              <button className="btn btn-ghost btn-sm" type="submit">Salir</button>
            </form>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-[4.5rem] max-w-6xl sm:h-20 items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href={viewer ? homePath(viewer.role) : "/"} compact={!!viewer} />

          {viewer ? (
            <>
              <NavLinks className="hidden md:flex" teacher={isStaff(viewer.role)} admin={isAdmin(viewer.role)} family={viewer.role === "familia"} />
              <div className="flex items-center gap-1 sm:gap-3">
                <SoundControl />
                <span className="chip" title="Monedas del gremio" aria-label={`${viewer.coins} monedas`}>
                  <span aria-hidden="true">🪙</span> {viewer.coins}
                </span>
                <Link href="/perfil" className="flex items-center gap-2 rounded-full border border-line bg-panel/70 py-1 pl-1 pr-2 hover:border-cyan/60 sm:pr-3" aria-label={`Tu perfil: ${viewer.displayName}, rango ${rank?.key}`}>
                  {adultGuide ? <GuideFace guide={adultGuide} size={36} /> : <AvatarFace base={viewer.avatarBase} look={viewer.avatarLook} rank={rank?.key ?? "E"} size={36} />}
                  <span className="rounded-md px-1.5 text-xs font-extrabold" style={{ background: rank?.color, color: "#14123b" }}>{rank?.key}</span>
                </Link>
                <form action={logoutAction}>
                  <button className="btn btn-ghost btn-sm max-sm:px-2" type="submit" aria-label="Salir" title="Salir">
                    <span aria-hidden="true" className="sm:hidden">🚪</span>
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <nav className="flex items-center gap-2" aria-label="Cuenta">
              <Link href="/ingresar" className="btn btn-ghost btn-sm">Ingresar</Link>
              <Link href="/registro" className="btn btn-primary btn-sm">Crear cuenta</Link>
            </nav>
          )}
        </div>
      </header>
      {/* Fuera del <header>: su backdrop-blur haría que «fixed» se anclara a la cabecera y la tapara. */}
      {viewer && <NavLinks mobile className="md:hidden" teacher={isStaff(viewer.role)} admin={isAdmin(viewer.role)} family={viewer.role === "familia"} />}
    </>
  );
}

/** Cabecera del sitio público: no depende de quién mira, así las páginas se sirven estáticas desde la CDN.
 *  Solo el logo y las tres secciones; en celular, el menú baja a una segunda fila. */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md print:hidden">
      <div className="site-header-line" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr] items-center gap-4 px-4 py-2 sm:px-6 md:h-20 md:py-0">
        <Logo href="/" />
        <SiteNav className="hidden justify-self-end md:flex" />
      </div>
      <div className="px-4 pb-2.5 md:hidden"><SiteNav className="mx-auto flex max-w-md" /></div>
    </header>
  );
}

/** Envoltura del sitio público (tema claro y académico), con su cabecera y su pie. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-site">
      <PublicHeader />
      <main id="contenido">{children}</main>
      <Footer />
    </div>
  );
}
