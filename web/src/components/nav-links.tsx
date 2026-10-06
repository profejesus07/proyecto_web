"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/gremio", label: "Gremio", icon: "🏰" },
  { href: "/portales", label: "Portales", icon: "🌀" },
  { href: "/cronicas", label: "Crónicas", icon: "📜" },
  { href: "/tienda", label: "Tienda", icon: "🛡️" },
  { href: "/perfil", label: "Perfil", icon: "⭐" },
];

const FAMILY_LINK = { href: "/familia", label: "Mi familia", icon: "👪" };

export function NavLinks({ className = "", mobile = false, family = false }: { className?: string; mobile?: boolean; family?: boolean }) {
  const pathname = usePathname();
  // La familia ve «Mi familia» en lugar de la tienda, para que el menú quepa en el celular.
  const links = family ? [FAMILY_LINK, ...LINKS.filter((l) => l.href !== "/tienda")] : LINKS;
  const items = links.map((l) => {
    const active = pathname === l.href || pathname.startsWith(l.href + "/");
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={active ? "page" : undefined}
        className={
          mobile
            ? `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold ${active ? "text-cyan" : "text-muted"}`
            : `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? "bg-cyan/15 text-cyan" : "text-muted hover:bg-white/5 hover:text-text"}`
        }
      >
        {mobile && <span aria-hidden="true" className="text-lg leading-none">{l.icon}</span>}
        {l.label}
      </Link>
    );
  });
  if (mobile) {
    return (
      <nav aria-label="Principal" className={`fixed inset-x-0 bottom-0 z-40 flex print:hidden border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md ${className}`}>
        {items}
      </nav>
    );
  }
  return <nav aria-label="Principal" className={`items-center gap-1 ${className}`}>{items}</nav>;
}
