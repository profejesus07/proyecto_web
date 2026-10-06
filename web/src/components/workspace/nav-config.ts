import type { WorkspaceGroup } from "./workspace-nav";

/** Secciones de la consola de administración. */
export const ADMIN_GROUPS: WorkspaceGroup[] = [
  { links: [{ href: "/admin", label: "Resumen", icon: "grid", exact: true }] },
  { title: "Comunidad", links: [
    { href: "/admin/personas", label: "Personas", icon: "people" },
    { href: "/admin/grupos", label: "Grupos y códigos", icon: "hash" },
  ] },
  { title: "Ventas", links: [
    { href: "/admin/pagos", label: "Pagos", icon: "coins" },
    { href: "/admin/cursos", label: "Cursos y precios", icon: "tag" },
  ] },
  { title: "Académico", links: [
    { href: "/admin/contenido", label: "Contenido", icon: "lesson" },
    { href: "/admin/constancias", label: "Constancias", icon: "seal" },
    { href: "/maestro", label: "Informes de grupos", icon: "chart" },
  ] },
];
