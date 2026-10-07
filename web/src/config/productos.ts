// Productos de UNEX Education: el ÚNICO lugar donde se definen sus nombres y direcciones.
//
// Copia de src/config/productos.ts del sitio principal (unex-education-web), con las URL relativas
// cambiadas por las completas. Si cambia allá (por ejemplo, Gestión o Evaluación ya tienen dirección),
// cópialo de nuevo y repite ese cambio.
//
// Cuando un producto tenga dirección, cambia su `url` de null a la dirección completa
// (por ejemplo "https://unex-academy.vercel.app"). Mientras sea null, el sitio lo muestra
// como "Próximamente" y no enlaza a ningún lado.
//
// Al copiar este archivo a otro proyecto (Academy, Gestión o Evaluación), cambia las URL
// relativas ("/" y "/apps") por las completas del sitio principal.

export type PlataformaId = "academy" | "gestion" | "evaluacion" | "apps";

export interface Producto {
  id: PlataformaId;
  /** Nombre completo, por ejemplo "UNEX Academy". */
  nombre: string;
  /** Nombre corto para menús, por ejemplo "Academy". */
  nombreCorto: string;
  /** Público al que va dirigido. */
  para: string;
  /** Una frase que explica el producto. */
  frase: string;
  /** Dirección del producto, o null si aún no existe. */
  url: string | null;
  /** Colores de la plataforma (tokens de docs/marca/tokens.css). */
  colores: {
    /** Solo para elementos gráficos: puntos, franjas, íconos. */
    base: string;
    /** Texto y botones sobre fondo claro. */
    oscuro: string;
    /** Texto sobre fondo Cosmos. */
    claro: string;
  };
}

export const sitioPrincipal = {
  nombre: "UNEX Education",
  url: "https://unexeducation.vercel.app",
  /** Dirección pública del sitio, para los enlaces que se comparten. Cambiará a unexeducation.co. */
  urlPublica: "https://unexeducation.vercel.app",
};

export const productos: Producto[] = [
  {
    id: "academy",
    nombre: "UNEX Academy",
    nombreCorto: "Academy",
    para: "Estudiantes",
    frase: "Cursos cortos que se viven como una historia: cada tema es un universo con misiones y logros.",
    url: "https://unex-academia.vercel.app",
    colores: {
      base: "var(--unex-aurora)",
      oscuro: "var(--unex-aurora-oscuro)",
      claro: "var(--unex-aurora)",
    },
  },
  {
    id: "gestion",
    nombre: "UNEX Gestión",
    nombreCorto: "Gestión",
    para: "Rectores y coordinadores",
    frase: "Matrículas, notas, asistencia y reportes de tu colegio en un solo lugar.",
    url: null,
    colores: {
      base: "var(--unex-indigo)",
      oscuro: "var(--unex-indigo-oscuro)",
      claro: "var(--unex-indigo-claro)",
    },
  },
  {
    id: "evaluacion",
    nombre: "UNEX Evaluación",
    nombreCorto: "Evaluación",
    para: "Docentes e instituciones",
    frase: "Crea exámenes y conoce los resultados al instante.",
    url: null,
    colores: {
      base: "var(--unex-nebulosa)",
      oscuro: "var(--unex-nebulosa-oscuro)",
      claro: "var(--unex-nebulosa-clara)",
    },
  },
  {
    id: "apps",
    nombre: "UNEX Apps",
    nombreCorto: "Apps",
    para: "Toda la comunidad",
    frase: "Pequeñas herramientas listas para usar en clase y en casa.",
    url: "https://unexeducation.vercel.app/apps",
    colores: {
      base: "var(--unex-plasma)",
      oscuro: "var(--unex-plasma-oscuro)",
      claro: "var(--unex-plasma-claro)",
    },
  },
];
