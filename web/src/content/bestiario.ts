/**
 * Bestiario del Archivo: lo que Eon sabe de las criaturas de las mazmorras (biblia §4.6).
 * Son graciosas, nunca temibles: cada una encarna un tropiezo pequeño al aprender.
 */
export interface BeastLore { slug: string; role: string; lore: string; special: string; howTo: string }

export const BEASTS: readonly BeastLore[] = [
  {
    slug: "slime-confuso", role: "Custodia las preguntas fáciles",
    lore: "Nació de una gota de la niebla de la Confusión. Es blandito y se aplasta con cara de sorpresa cuando alguien responde bien.",
    special: "Confundir: hace burbujas que mezclan las palabras de la pregunta.",
    howTo: "Lee la pregunta despacio, palabra por palabra. Las burbujas se revientan solas.",
  },
  {
    slug: "duende-enredador", role: "Custodia las preguntas medias",
    lore: "Un bromista que vive entre los estantes. Se ríe, esquiva y tira cuerdas para que tropieces con las respuestas parecidas.",
    special: "Enredar: ata dos opciones para que parezcan la misma.",
    howTo: "Busca la diferencia entre las opciones que se parecen. Al encontrarla, la cuerda se suelta.",
  },
  {
    slug: "sombrita", role: "Custodia las preguntas de repaso",
    lore: "Una sombra pequeña que se esconde en lo que ya aprendiste y reaparece cuando menos la esperas. Es pariente lejana de Brumalis.",
    special: "Desvanecer: se esconde y borra un recuerdo por un momento.",
    howTo: "Repasa lo que ya viste. Lo que se recuerda no se puede desvanecer.",
  },
  {
    slug: "cofre-mimico", role: "Aparece en la última pregunta de las misiones largas",
    lore: "Parece un cofre de premio… hasta que abre la tapa y muestra los dientes. Le encanta sorprender a los Despertados distraídos.",
    special: "Engañar: muestra una respuesta brillante que no es la correcta.",
    howTo: "No te dejes llevar por lo que brilla. Piensa antes de elegir: la sorpresa no dura.",
  },
];
