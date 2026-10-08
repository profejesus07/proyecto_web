// Preguntas frecuentes de las páginas públicas. Cada página elige cuáles muestra, pero el texto vive solo aquí,
// para que la misma pregunta diga lo mismo en todas partes. Los pagos aún no están abiertos al público: no se
// mencionan pasarelas ni medios de pago.
export const PREGUNTAS = {
  equivocarse: {
    q: "¿Qué pasa si me equivoco?",
    a: "Equivocarse es parte del juego. Repites la lección las veces que quieras y queda tu mejor nota.",
  },
  costo: {
    q: "¿Cuánto cuesta?",
    a: "Crear la cuenta es gratis, y también la primera lección de cada curso. En cada curso verás si es gratis o cuánto cuesta.",
  },
  edades: {
    q: "¿Para qué edades es?",
    a: "Para niñas, niños, adolescentes y adultos. Si eres menor de edad, tu acudiente debe autorizar el uso de la plataforma, y puede acompañarte desde una cuenta de familia.",
  },
  instalar: {
    q: "¿Necesito instalar algo?",
    a: "No. Funciona en el navegador del celular, la tableta o el computador. Tu avance se guarda en tu cuenta.",
  },
  constancias: {
    q: "¿Qué valor tienen las constancias?",
    a: "Los cursos cortos son educación informal (Ley 115 de 1994 y Decreto 1075 de 2015). Al terminarlos se expide una constancia de asistencia que cualquiera puede verificar en línea con su código. No conduce a título.",
  },
} as const;

export type PreguntaId = keyof typeof PREGUNTAS;
