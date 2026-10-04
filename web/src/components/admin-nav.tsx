import Link from "next/link";

/** Pestañas del panel de administración. */
export function AdminNav({ current }: { current: "general" | "contenido" }) {
  const tabs = [
    { key: "general", href: "/admin", label: "Personas, accesos y precios" },
    { key: "contenido", href: "/admin/contenido", label: "Contenido: clases y cursos" },
  ] as const;
  return (
    <nav aria-label="Secciones de administración" className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} aria-current={current === t.key ? "page" : undefined}
          className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition ${current === t.key ? "border-cyan bg-cyan/15 text-cyan" : "border-line text-muted hover:border-[#5a52b8] hover:text-text"}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
