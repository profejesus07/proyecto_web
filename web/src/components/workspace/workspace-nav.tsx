"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

export interface WorkspaceLink {
  href: string;
  label: string;
  icon: IconName;
  /** Texto pequeño a la derecha (por ejemplo, cuántos estudiantes tiene una clase). */
  meta?: string;
  /** true: activo solo en esa ruta exacta. */
  exact?: boolean;
  /** Otras rutas que también lo marcan como activo. */
  match?: string[];
}

export interface WorkspaceGroup { title?: string; links: WorkspaceLink[] }

/** Menú lateral del panel (en celular, una fila desplazable). Marca la sección donde está la persona. */
export function WorkspaceNav({ groups, label }: { groups: WorkspaceGroup[]; label: string }) {
  const path = usePathname();
  const under = (base: string) => path === base || path.startsWith(`${base}/`);
  const isActive = (l: WorkspaceLink) => (l.exact ? path === l.href : under(l.href) || !!l.match?.some(under));
  return (
    <nav aria-label={label} className="ws-nav flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0">
      {groups.map((g, i) => (
        <div key={g.title ?? i} className="flex gap-1 lg:flex-col">
          {g.title && <p className="hidden px-3 pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted lg:block">{g.title}</p>}
          {g.links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l) ? "page" : undefined}>
              <Icon name={l.icon} />
              <span className="min-w-0 flex-1 truncate">{l.label}</span>
              {l.meta && <span className="hidden text-xs font-medium text-muted lg:inline">{l.meta}</span>}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
