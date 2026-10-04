"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Resumen", icon: "◧" },
  { href: "/admin#pagos-t", label: "Pagos", icon: "$" },
  { href: "/admin#docente-t", label: "Docentes", icon: "＋" },
  { href: "/admin#personas-t", label: "Personas", icon: "◎" },
  { href: "/admin#precios-t", label: "Precios", icon: "¤" },
  { href: "/admin#clases-t", label: "Grupos y códigos", icon: "#" },
  { href: "/admin#const-t", label: "Constancias", icon: "✓" },
  { href: "/admin/contenido", label: "Contenido", icon: "▤" },
];

/** Navegación lateral de la consola. */
export function ConsoleNav() {
  const path = usePathname();
  return (
    <nav aria-label="Consola" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
      {ITEMS.map((it) => {
        const active = it.href === path || (it.href === "/admin/contenido" && path.startsWith("/admin/contenido"));
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-white/[0.07] text-text" : "text-muted hover:bg-white/5 hover:text-text"}`}>
            <span aria-hidden="true" className="grid size-5 place-items-center rounded bg-white/5 text-[0.7rem]">{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
