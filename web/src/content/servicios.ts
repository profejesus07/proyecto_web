/** Portafolio de servicios para docentes, directivos e instituciones educativas. */
export interface Service {
  id: string;
  title: string;
  /** Una línea: qué resuelve. */
  lead: string;
  features: string[];
  /** Servicio principal (los cursos y clases). */
  main?: boolean;
  icon: "lesson" | "people" | "seal" | "target" | "play" | "feedback";
}

export const SERVICES: readonly Service[] = [
  {
    id: "cursos", main: true, icon: "play",
    title: "Cursos y clases con historia",
    lead: "Nuestro corazón: cursos cortos y clases anuales donde cada lección es parte de una aventura.",
    features: ["Cursos cortos con constancia verificable", "Clases por área, grado y periodos", "Universos con historia, personajes y retos", "Informes para docentes y acompañamiento de familias"],
  },
  {
    id: "gestion", icon: "people",
    title: "Plataformas de gestión docente",
    lead: "El trabajo administrativo del aula, en un solo lugar y sin papeles.",
    features: ["Asistencia diaria", "Notas, periodos y boletines", "Observador del estudiante", "Actas y seguimiento"],
  },
  {
    id: "examenes", icon: "seal",
    title: "Plataforma institucional de exámenes",
    lead: "Evaluaciones en línea para toda la institución, con resultados al instante.",
    features: ["Banco de preguntas por área y grado", "Aplicación en línea y segura", "Calificación automática", "Resultados por estudiante, grupo y pregunta"],
  },
  {
    id: "apps", icon: "target",
    title: "Aplicaciones a la medida",
    lead: "Herramientas web y móviles hechas para los procesos de tu institución.",
    features: ["Diagnóstico de la necesidad", "Diseño centrado en docentes y estudiantes", "Acceso por roles", "Acompañamiento después del lanzamiento"],
  },
  {
    id: "juegos", icon: "lesson",
    title: "Juegos educativos",
    lead: "Juegos diseñados para un área, una edad y un objetivo de aprendizaje.",
    features: ["Para el aula o para casa", "Retroalimentación inmediata", "Alineados con el plan de estudios", "En el navegador, sin instalar nada"],
  },
  {
    id: "gamificacion", icon: "feedback",
    title: "Gamificación educativa a la medida",
    lead: "Convertimos tu clase, proyecto o institución en una aventura con propósito.",
    features: ["Narrativa propia de tu institución", "Rangos, insignias y recompensas", "Retos colaborativos", "Indicadores para medir el avance"],
  },
];

export const AUDIENCES = [
  { title: "Docentes", text: "Herramientas que ahorran tiempo y clases que tus estudiantes quieren repetir." },
  { title: "Directivos docentes", text: "Información clara para decidir: asistencia, notas, evaluaciones y avance por grupo." },
  { title: "Instituciones educativas", text: "Soluciones completas, con la identidad de tu institución y acompañamiento real." },
];

export const PROCESS = [
  { title: "Escuchamos", text: "Entendemos tu institución, tus estudiantes y lo que quieres lograr." },
  { title: "Diseñamos", text: "Proponemos la solución y, si aplica, la historia que la hará memorable." },
  { title: "Construimos", text: "Desarrollamos, probamos con docentes reales y ajustamos." },
  { title: "Acompañamos", text: "Capacitamos a tu equipo y mejoramos con el uso." },
];

/** Proyectos que ya están funcionando (edita aquí los enlaces cuando quieras mostrarlos). */
export interface Project {
  title: string;
  kind: string;
  text: string;
  /** «proximamente»: la plataforma aún no tiene dirección y se muestra como «Próximamente», sin enlace. */
  estado: "disponible" | "proximamente";
  /** Dirección pública (solo si está disponible). */
  href?: string;
}

export const PROJECTS: readonly Project[] = [
  { title: "UNEX Academy", kind: "Cursos y clases con historia", text: "Esta plataforma: cursos cortos y clases gamificadas, con informes para docentes, panel para familias y constancias verificables.", estado: "disponible", href: "/programas" },
  { title: "UNEX Gestión", kind: "Gestión docente", text: "Asistencia, notas, observador y actas en una sola herramienta para el docente y la coordinación.", estado: "proximamente" },
  { title: "UNEX Evaluación", kind: "Evaluación", text: "Plataforma para aplicar y calificar evaluaciones de toda una institución, con resultados al instante.", estado: "proximamente" },
];
