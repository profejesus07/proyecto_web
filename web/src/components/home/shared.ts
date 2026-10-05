import type { IconName } from "@/components/icons";
import type { loadCatalog } from "@/lib/data/queries";

/** Datos comunes a las portadas en prueba (atrevida y sobria). */
export type Catalog = Awaited<ReturnType<typeof loadCatalog>>;

export const VALUES: { icon: IconName; title: string; text: string }[] = [
  { icon: "play", title: "Primera lección gratis", text: "Prueba antes de decidir." },
  { icon: "seal", title: "Constancias verificables", text: "Se comprueban en línea." },
  { icon: "people", title: "Acompañamiento real", text: "Docentes y familias ven el avance." },
  { icon: "feedback", title: "Retroalimentación al instante", text: "Cada respuesta se explica." },
];

export function categoriesFor(catalog: Catalog): { label: string; href: string; detail: string; icon: IconName }[] {
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return [
    { label: "Cursos cortos", href: "/programas?tipo=curso", detail: count(catalog.filter((c) => c.kind === "curso").length, "programa", "programas"), icon: "lesson" },
    { label: "Clases anuales", href: "/programas?tipo=clase", detail: count(catalog.filter((c) => c.kind === "clase").length, "clase", "clases"), icon: "clock" },
    { label: "Gratis", href: "/programas?tipo=gratis", detail: count(catalog.filter((c) => c.isFree).length, "programa", "programas"), icon: "play" },
    { label: "Para instituciones", href: "/servicios", detail: "Plataformas a la medida", icon: "people" },
  ];
}
