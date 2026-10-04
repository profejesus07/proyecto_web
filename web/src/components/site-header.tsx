import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { AvatarFace } from "@/components/avatar-face";
import { getViewer } from "@/lib/auth";
import { rankProgress } from "@/lib/game/ranks";
import { isAdmin, isStaff } from "@/lib/roles";
import { NavLinks } from "./nav-links";

export async function SiteHeader() {
  const viewer = await getViewer();
  const rank = viewer ? rankProgress(viewer.xp).rank : null;

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo href={viewer ? "/gremio" : "/"} />

        {viewer ? (
          <>
            <NavLinks className="hidden md:flex" teacher={isStaff(viewer.role)} admin={isAdmin(viewer.role)} />
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="chip" title="Monedas del gremio" aria-label={`${viewer.coins} monedas`}>
                <span aria-hidden="true">🪙</span> {viewer.coins}
              </span>
              <Link href="/perfil" className="flex items-center gap-2 rounded-full border border-line bg-panel/70 py-1 pl-1 pr-3 hover:border-cyan/60" aria-label={`Tu perfil: ${viewer.displayName}, rango ${rank?.key}`}>
                <AvatarFace base={viewer.avatarBase} rank={rank?.key ?? "E"} size={36} />
                <span className="rounded-md px-1.5 text-xs font-extrabold" style={{ background: rank?.color, color: "#14123b" }}>{rank?.key}</span>
              </Link>
              <form action={logoutAction} className="hidden sm:block">
                <button className="btn btn-ghost btn-sm" type="submit">Salir</button>
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
      {viewer && <NavLinks mobile className="md:hidden" teacher={isStaff(viewer.role)} admin={isAdmin(viewer.role)} />}
    </header>
  );
}

/** Cabecera de la portada: no depende de quién mira, así la portada se sirve estática y rápida desde la CDN. */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo href="/" />
        <nav className="flex items-center gap-2" aria-label="Cuenta">
          <Link href="/ingresar" className="btn btn-ghost btn-sm">Ingresar</Link>
          <Link href="/registro" className="btn btn-primary btn-sm">Crear cuenta</Link>
        </nav>
      </div>
    </header>
  );
}
