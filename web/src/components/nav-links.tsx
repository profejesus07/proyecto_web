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

const TEACHER_LINK = { href: "/maestro", label: "Mi clase", icon: "🧑‍🏫" };
const ADMIN_LINK = { href: "/admin", label: "Admin", icon: "🛠️" };

export function NavLinks({ className = "", mobile = false, teacher = false, admin = false }: { className?: string; mobile?: boolean; teacher?: boolean; admin?: boolean }) {
  const pathname = usePathname();
  // El docente ve «Mi clase» en lugar de la tienda, para que el menú quepa en el celular.
  const links = teacher ? [...LINKS.filter((l) => l.href !== "/tienda"), TEACHER_LINK, ...(admin ? [ADMIN_LINK] : [])] : LINKS;
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
      <nav aria-label="Principal" className={`fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md ${className}`}>
        {items}
      </nav>
    );
  }
  return <nav aria-label="Principal" className={`items-center gap-1 ${className}`}>{items}</nav>;
}
