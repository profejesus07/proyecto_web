/**
 * Las Crónicas del Archivo: la historia de UMBRAL, narrada por el Archivista Eon.
 * Cada capítulo se desbloquea al avanzar en los portales. El texto no es secreto
 * (no contiene respuestas), pero la web solo muestra los capítulos ya desbloqueados.
 */

export type Unlock =
  | { kind: "inicio" }
  /** Se abre al aprobar por primera vez esa misión (posición dentro del portal). */
  | { kind: "mision"; course: string; position: number };

export interface Chapter {
  id: string;
  /** Portal al que pertenece (null = historia general del Gremio). */
  course: string | null;
  title: string;
  /** Una línea para la lista, sin destripar el capítulo. */
  teaser: string;
  /** Escenario del Archivo de Crónicas que acompaña al capítulo. */
  scene: "calma" | "cronica" | "descubrimiento";
  /** Personaje que aparece junto a Eon en la ilustración (Guardián, Kuro…). */
  guest?: { src: string; alt: string };
  unlock: Unlock;
  /** Cómo se desbloquea, para mostrarlo mientras está cerrado. */
  hint: string;
  pages: string[];
}

export const CHAPTERS: readonly Chapter[] = [
  {
    id: "prologo",
    course: null,
    title: "Prólogo: La Gran Fractura",
    teaser: "Antes de los portales, todo el Saber vivía en un solo lugar.",
    scene: "cronica",
    unlock: { kind: "inicio" },
    hint: "Disponible desde el primer día.",
    pages: [
      "Acércate, Despertado. Soy Eon, guardián de este Archivo. Cada libro que ves flotar guarda una historia… y la primera que debes conocer es la tuya.",
      "Hace mucho tiempo, todo el Saber del mundo vivía en un solo lugar: la Gran Biblioteca de Luz. Allí, las ideas brillaban juntas y cualquiera podía aprender lo que quisiera.",
      "Pero un día llegaron dos nieblas: el Olvido y la Confusión. Se colaron entre los estantes y la Biblioteca se partió en mil pedazos. A eso lo llamamos la Gran Fractura.",
      "Cada pedazo se convirtió en un Portal: un mundo pequeño con un fragmento del Saber dentro. Y en cada portal, la niebla se enredó con un guardián antiguo y lo volvió gruñón, temeroso o confundido. Así nacieron los Guardianes.",
      "Los Guardianes no son malvados. Están atrapados. Cada uno carga con un obstáculo que todos conocemos: creer que algo es demasiado grande, tener miedo a equivocarse, olvidar lo aprendido…",
      "Solo los Despertados pueden cruzar los portales. No vencen con fuerza, sino con lo que aprenden. Cuando un Despertado supera las pruebas de un portal, su Guardián se purifica y el fragmento del Saber vuelve a brillar.",
      "Tú eres uno de ellos. Kuro te encontró en cuanto despertaste, y la Maestra Sora te espera en el Gremio. Ve, cruza tu primer portal… y vuelve a contarme lo que descubras.",
    ],
  },

  // ===== Portal de los Pasos Pequeños · Petrox =====
  {
    id: "petrox-1",
    course: "primer-portal",
    title: "El gólem que no se atrevía",
    teaser: "Un constructor de puentes que dejó de construir.",
    scene: "calma",
    guest: { src: "/assets/jefes/petrox/petrox-reposo.svg", alt: "Petrox, el gólem de piedra" },
    unlock: { kind: "inicio" },
    hint: "Disponible desde el primer día.",
    pages: [
      "Antes de la Fractura, Petrox era el mejor constructor de la Biblioteca. Levantaba puentes entre las ideas, piedra a piedra, y nunca tenía prisa.",
      "Cuando llegó la niebla de la Confusión, le susurró al oído: «Mira todo lo que falta. Es demasiado grande. Jamás lo terminarás».",
      "Petrox miró el puente entero, de una sola vez… y se quedó quieto. Tan quieto que el musgo le creció en los hombros. Desde entonces repite lo mismo a quien se acerca: «Es demasiado grande. No se puede».",
      "Dicen que su portal está lleno de caminos a medio hacer. Si quieres llegar hasta él, tendrás que aprender lo que él olvidó: cómo se empieza algo enorme.",
    ],
  },
  {
    id: "petrox-2",
    course: "primer-portal",
    title: "Piedra a piedra",
    teaser: "Kuro encuentra algo enterrado en el polvo.",
    scene: "descubrimiento",
    guest: { src: "/assets/guias/kuro-cachorro/kuro-cachorro-senalar.svg", alt: "Kuro señala un hallazgo" },
    unlock: { kind: "mision", course: "primer-portal", position: 3 },
    hint: "Se abre al superar la misión 3 del Portal de los Pasos Pequeños.",
    pages: [
      "Mientras cruzabas las salas del portal, Kuro no dejaba de olfatear el suelo. De pronto empezó a escarbar… y sacó un rollo de papel antiguo.",
      "Eran los planos de Petrox. El gran puente no estaba dibujado de una sola vez: estaba dividido en cien pasos diminutos, cada uno con una casilla para marcar.",
      "Las primeras casillas estaban marcadas. Las demás, vacías. Petrox no había fallado: solo había dejado de mirar el siguiente paso.",
      "Guarda bien estos planos, Despertado. Puede que el gólem necesite verlos más de lo que cree.",
    ],
  },
  {
    id: "petrox-3",
    course: "primer-portal",
    title: "El constructor despierta",
    teaser: "Lo que pasó cuando el musgo cayó al suelo.",
    scene: "cronica",
    guest: { src: "/assets/jefes/petrox/petrox-purificado.svg", alt: "Petrox purificado" },
    unlock: { kind: "mision", course: "primer-portal", position: 4 },
    hint: "Se abre al purificar a Petrox.",
    pages: [
      "Con cada respuesta tuya, un bloque de niebla se desprendía de Petrox. Al final le mostraste los planos y le dijiste: «No hay que hacerlo todo hoy. Solo el siguiente paso».",
      "El gólem miró la primera casilla vacía. Tomó una piedra pequeña, la colocó… y sonrió por primera vez en siglos. El musgo cayó de sus hombros como una capa.",
      "Esa capa es la que ahora llevas tú. Y el fragmento del Saber que custodiaba volvió a brillar en este Archivo: «Todo lo grande está hecho de cosas pequeñas».",
      "Pero escucha… al fondo del Gremio se ha abierto un portal de fuego. Dentro hay un dragón muy joven cuyas llamas se apagan cada vez que intenta algo nuevo. Creo que te necesita.",
    ],
  },

  // ===== Portal del Primer Intento · Ignaris =====
  {
    id: "ignaris-1",
    course: "portal-del-primer-intento",
    title: "La llama que tiembla",
    teaser: "Un dragón que nunca ha echado a volar.",
    scene: "calma",
    guest: { src: "/assets/jefes/ignaris/ignaris-reposo.svg", alt: "Ignaris, el dragón joven" },
    unlock: { kind: "inicio" },
    hint: "Disponible desde el primer día.",
    pages: [
      "Ignaris nació en el nido más alto de la Biblioteca, donde los dragones aprendían a encender las lámparas del Saber. Su fuego era el más brillante de todos.",
      "Pero el día de su primer vuelo, la niebla del Olvido le hizo una pregunta: «¿Y si te caes? ¿Y si todos te ven fallar?».",
      "Ignaris no saltó. Ni ese día ni los siguientes. Y cada vez que pensaba en intentarlo, sus llamas violetas temblaban un poco más.",
      "Ahora custodia su portal enroscado sobre sí mismo, sin moverse. Dicen que cuando alguien se equivoca cerca de él, ruge con fuerza… porque le recuerda su propio miedo.",
    ],
  },
  {
    id: "ignaris-2",
    course: "portal-del-primer-intento",
    title: "Lo que dejó el humo",
    teaser: "Huellas de intentos en las paredes del portal.",
    scene: "descubrimiento",
    guest: { src: "/assets/guias/kuro-cachorro/kuro-cachorro-alerta.svg", alt: "Kuro alerta" },
    unlock: { kind: "mision", course: "portal-del-primer-intento", position: 3 },
    hint: "Se abre al superar la misión 3 del Portal del Primer Intento.",
    pages: [
      "Las paredes de este portal están cubiertas de manchas de hollín. Al principio parecían quemaduras sin sentido… hasta que Kuro se puso a contarlas.",
      "Eran intentos. Cientos de pequeñas llamaradas: Ignaris sí había practicado, a escondidas, de noche, cuando nadie podía verlo.",
      "Algunas manchas eran torpes y otras casi perfectas. Las últimas, las más recientes, eran las mejores de todas.",
      "Ignaris no había dejado de mejorar. Solo nunca se había dado cuenta, porque cada vez miraba el error y no el camino.",
    ],
  },
  {
    id: "ignaris-3",
    course: "portal-del-primer-intento",
    title: "El fuego valiente",
    teaser: "El primer vuelo de Ignaris.",
    scene: "cronica",
    guest: { src: "/assets/jefes/ignaris/ignaris-purificado.svg", alt: "Ignaris purificado" },
    unlock: { kind: "mision", course: "portal-del-primer-intento", position: 4 },
    hint: "Se abre al purificar a Ignaris.",
    pages: [
      "En la Arena, Ignaris rugía cada vez que te equivocabas. Pero tú no te ibas: leías la explicación, respirabas y volvías a intentarlo.",
      "Poco a poco el dragón dejó de rugir y empezó a mirarte. «¿No te da miedo fallar?», preguntó. «Sí», le dijiste. «Pero cada error me enseñó la siguiente respuesta».",
      "Entonces Ignaris abrió las alas, temblando… y saltó. Cayó una vez, dos veces. A la tercera, voló. Sus llamas se volvieron doradas y el humo del portal se convirtió en brasas que bailaban.",
      "Te regaló un aura de esas brasas, y el título de Valiente. El fragmento del Saber volvió al Archivo: «Equivocarse es parte de aprender».",
      "Y ahora, Despertado, presta atención: en los estantes más oscuros del Archivo, algunas páginas se están quedando en blanco. Alguien está borrando lo que ya aprendimos…",
    ],
  },
];

export function chapterById(id: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

/** Clave estable de una misión: «portal:posición». */
export const missionKey = (course: string, position: number) => `${course}:${position}`;

export function isUnlocked(ch: Chapter, completed: ReadonlySet<string>): boolean {
  return ch.unlock.kind === "inicio" || completed.has(missionKey(ch.unlock.course, ch.unlock.position));
}

/** Capítulos que se abren justo al aprobar por primera vez esta misión. */
export function chaptersUnlockedBy(course: string, position: number): Chapter[] {
  return CHAPTERS.filter((c) => c.unlock.kind === "mision" && c.unlock.course === course && c.unlock.position === position);
}
