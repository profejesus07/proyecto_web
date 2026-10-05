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

/** Cabecera de la portada: no depende de quién mira, así la portada se sirve estática y rápida desde la CDN. */
const PUBLIC_NAV = [
  { href: "/programas", label: "Cursos y clases" },
  { href: "/servicios", label: "Para instituciones" },
  { href: "/#filosofia", label: "Filosofía" },
];

export function PublicHeader({ bold = false }: { bold?: boolean }) {
  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md print:hidden ${bold ? "bg-bg/70" : "border-b border-line/70 bg-bg/85"}`}>
      <div className="mx-auto flex h-[4.5rem] max-w-6xl sm:h-20 items-center justify-between gap-4 px-4 sm:px-6">
        <Logo href="/" />
        <nav aria-label="Academia" className="hidden items-center gap-1 lg:flex">
          {PUBLIC_NAV.map((l) => (
            <Link key={l.href} href={l.href} className={`rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-text ${bold ? "text-[0.95rem] font-bold text-text hover:underline underline-offset-8" : "text-sm font-medium text-muted"}`}>{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-2" aria-label="Cuenta">
            <Link href="/ingresar" className="btn btn-ghost btn-sm hidden sm:inline-flex">Ingresar</Link>
            <Link href="/registro" className={`btn btn-sm ${bold ? "btn-white" : "btn-primary"}`}>Crear cuenta</Link>
          </nav>
          <details className="group relative lg:hidden">
            <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-lg border border-line text-muted hover:text-text [&::-webkit-details-marker]:hidden" aria-label="Menú">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </summary>
            <nav aria-label="Academia" className="absolute right-0 top-11 w-56 rounded-xl border border-line bg-bg-2 p-2 shadow-2xl">
              {PUBLIC_NAV.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-white/5 hover:text-text">{l.label}</Link>
              ))}
              <Link href="/ingresar" className="mt-1 block rounded-lg border-t border-line px-3 py-2 text-sm font-semibold hover:bg-white/5 sm:hidden">Ingresar</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

/** Envoltura del sitio principal: tema editorial claro, con su cabecera y su pie. */
/** variant: estilos de portada en prueba. «atrevido» = oscuro y moderno; «sobrio» = blanco y elegante. */
export function SiteShell({ children, variant }: { children: React.ReactNode; variant?: "atrevido" | "sobrio" }) {
  const theme = variant === "atrevido" ? "theme-bold" : variant === "sobrio" ? "theme-sobrio" : "theme-site";
  return (
    <div className={theme}>
      <PublicHeader bold={variant === "atrevido"} />
      <main id="contenido">{children}</main>
      <Footer />
    </div>
  );
}
