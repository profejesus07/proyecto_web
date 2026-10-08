// Secciones del menú público de UNEX Academy (encabezado y pie). Agregar una sección = agregar una línea.
// /servicios sigue existiendo, pero ya no está en el menú. /proyectos redirige a /programas (next.config.ts).
export const SECCIONES_PUBLICAS: { href: string; label: string }[] = [
  { href: "/programas", label: "Cursos" },
  { href: "/como-se-juega", label: "Cómo se juega" },
  { href: "/familias-y-docentes", label: "Familias y docentes" },
];
