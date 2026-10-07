import Link from "next/link";
import { EncabezadoPublico } from "@/components/encabezado/EncabezadoPublico";
import { FranjaUnex } from "@/components/encabezado/FranjaUnex";
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

export async function SiteHeader() {
  const viewer = await getViewer();
  const rank = viewer ? rankProgress(viewer.xp).rank : null;
  // Las familias se ven con su Guardián del Hogar.
  const adultGuide = viewer ? guideFor(viewer) : null;

  // Docentes y administración no juegan: en las pocas páginas compartidas (constancias, contraseña)
  // ven una cabecera sencilla, sin monedas, avatar ni menú del juego.
  if (viewer && isStaff(viewer.role)) {
    return (
      <>
        <FranjaUnex />
        <header data-fija="arriba" className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-md print:hidden">
          <div className="mx-auto flex h-[4.5rem] max-w-6xl sm:h-20 items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
            <Logo href={homePath(viewer.role)} compact size="h-14 lg:h-[4.5rem]" />
            <nav aria-label="Administración" className="flex items-center gap-2">
              <Link href={homePath(viewer.role)} className="btn btn-secondary btn-sm">{isAdmin(viewer.role) ? "← Volver a la consola" : "← Volver a mi panel"}</Link>
              <form action={logoutAction}>
                <button className="btn btn-ghost btn-sm" type="submit">Salir</button>
              </form>
            </nav>
          </div>
        </header>
      </>
    );
  }

  return (
    <>
      {/* Franja UNEX solo sin sesión (ingresar, registro…): en el Gremio el acceso está en el pie. */}
      {!viewer && <FranjaUnex />}
      <header data-fija="arriba" className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-2 px-4 sm:h-20 sm:gap-4 sm:px-6">
          <Logo href={viewer ? homePath(viewer.role) : "/"} compact size="h-14 lg:h-[4.5rem]" />

          {viewer ? (
            <>
              {/* El menú cabe en la cabecera desde lg; en celular y tableta va abajo, en la barra con ícono y texto. */}
              <NavLinks className="hidden lg:flex" family={viewer.role === "familia"} />
              <div className="flex items-center gap-1 sm:gap-3">
                <SoundControl />
                <span className="chip" title="Monedas del gremio" aria-label={`${viewer.coins} monedas`}>
                  <span aria-hidden="true">🪙</span> {viewer.coins}
                </span>
                <Link href="/perfil" className="flex items-center gap-2 rounded-full border border-line bg-panel/70 py-1 pl-1 pr-2 hover:border-cyan/60 sm:pr-3" aria-label={`Tu perfil: ${viewer.displayName}, rango ${rank?.key}`}>
                  {adultGuide ? <GuideFace guide={adultGuide} size={36} /> : <AvatarFace base={viewer.avatarBase} look={viewer.avatarLook} rank={rank?.key ?? "E"} size={36} />}
                  <span className="rounded-md px-1.5 text-xs font-extrabold" style={{ background: rank?.color, color: "var(--ink)" }}>{rank?.key}</span>
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
      {viewer && <NavLinks mobile className="lg:hidden" family={viewer.role === "familia"} />}
    </>
  );
}

/** Envoltura del sitio público, con su cabecera y su pie, en el estilo del Gremio (el mismo de ingresar y registro). */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-gremio">
      <EncabezadoPublico />
      <main id="contenido">{children}</main>
      <Footer />
    </div>
  );
}
