"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

/** Las tres secciones del sitio público. */
export const SITE_SECTIONS: { href: string; label: string; icon: IconName }[] = [
  { href: "/programas", label: "Cursos", icon: "cap" },
  { href: "/servicios", label: "Servicios", icon: "briefcase" },
  { href: "/proyectos", label: "Proyectos", icon: "layers" },
];

/** Menú segmentado de la cabecera: la sección activa se pinta en índigo con una estrella dorada. */
export function SiteNav({ className = "" }: { className?: string }) {
  const path = usePathname();
  return (
    <nav aria-label="Secciones" className={`site-nav ${className}`}>
      {SITE_SECTIONS.map((s) => (
        <Link key={s.href} href={s.href} aria-current={path === s.href || path.startsWith(`${s.href}/`) ? "page" : undefined}>
          <Icon name={s.icon} /> {s.label}
        </Link>
      ))}
    </nav>
  );
}
