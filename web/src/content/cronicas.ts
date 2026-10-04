/**
 * Las Crónicas del Archivo: la historia de UMBRAL, narrada por el Archivista Eon.
 * Cada capítulo se desbloquea al avanzar en los portales. El texto no es secreto
 * (no contiene respuestas), pero la web solo muestra los capítulos ya desbloqueados.
 */

/**
 * Cuándo se abre un capítulo. Los capítulos van ligados al Guardián (no a un curso concreto):
 * cualquier clase o curso con ese Guardián los abre, también los que se creen en el editor.
 *  - inicio: disponible desde el primer día (en cuanto exista un portal con ese Guardián).
 *  - medio: al superar la penúltima misión del portal.
 *  - purificado: al vencer al Guardián (la última misión).
 */
export type Stage = "medio" | "purificado";
export type Unlock = { kind: "inicio" } | { kind: "guardian"; stage: Stage };

export interface Chapter {
  id: string;
  /** Guardián al que pertenece (null = historia general del Gremio). */
  guardian: string | null;
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
    guardian: null,
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
    guardian: "petrox",
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
    guardian: "petrox",
    title: "Piedra a piedra",
    teaser: "Kuro encuentra algo enterrado en el polvo.",
    scene: "descubrimiento",
    guest: { src: "/assets/guias/kuro-cachorro/kuro-cachorro-senalar.svg", alt: "Kuro señala un hallazgo" },
    unlock: { kind: "guardian", stage: "medio" },
    hint: "Se abre a mitad del portal de Petrox.",
    pages: [
      "Mientras cruzabas las salas del portal, Kuro no dejaba de olfatear el suelo. De pronto empezó a escarbar… y sacó un rollo de papel antiguo.",
      "Eran los planos de Petrox. El gran puente no estaba dibujado de una sola vez: estaba dividido en cien pasos diminutos, cada uno con una casilla para marcar.",
      "Las primeras casillas estaban marcadas. Las demás, vacías. Petrox no había fallado: solo había dejado de mirar el siguiente paso.",
      "Guarda bien estos planos, Despertado. Puede que el gólem necesite verlos más de lo que cree.",
    ],
  },
  {
    id: "petrox-3",
    guardian: "petrox",
    title: "El constructor despierta",
    teaser: "Lo que pasó cuando el musgo cayó al suelo.",
    scene: "cronica",
    guest: { src: "/assets/jefes/petrox/petrox-purificado.svg", alt: "Petrox purificado" },
    unlock: { kind: "guardian", stage: "purificado" },
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
    guardian: "ignaris",
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
    guardian: "ignaris",
    title: "Lo que dejó el humo",
    teaser: "Huellas de intentos en las paredes del portal.",
    scene: "descubrimiento",
    guest: { src: "/assets/guias/kuro-cachorro/kuro-cachorro-alerta.svg", alt: "Kuro alerta" },
    unlock: { kind: "guardian", stage: "medio" },
    hint: "Se abre a mitad del portal de Ignaris.",
    pages: [
      "Las paredes de este portal están cubiertas de manchas de hollín. Al principio parecían quemaduras sin sentido… hasta que Kuro se puso a contarlas.",
      "Eran intentos. Cientos de pequeñas llamaradas: Ignaris sí había practicado, a escondidas, de noche, cuando nadie podía verlo.",
      "Algunas manchas eran torpes y otras casi perfectas. Las últimas, las más recientes, eran las mejores de todas.",
      "Ignaris no había dejado de mejorar. Solo nunca se había dado cuenta, porque cada vez miraba el error y no el camino.",
    ],
  },
  {
    id: "ignaris-3",
    guardian: "ignaris",
    title: "El fuego valiente",
    teaser: "El primer vuelo de Ignaris.",
    scene: "cronica",
    guest: { src: "/assets/jefes/ignaris/ignaris-purificado.svg", alt: "Ignaris purificado" },
    unlock: { kind: "guardian", stage: "purificado" },
    hint: "Se abre al purificar a Ignaris.",
    pages: [
      "En la Arena, Ignaris rugía cada vez que te equivocabas. Pero tú no te ibas: leías la explicación, respirabas y volvías a intentarlo.",
      "Poco a poco el dragón dejó de rugir y empezó a mirarte. «¿No te da miedo fallar?», preguntó. «Sí», le dijiste. «Pero cada error me enseñó la siguiente respuesta».",
      "Entonces Ignaris abrió las alas, temblando… y saltó. Cayó una vez, dos veces. A la tercera, voló. Sus llamas se volvieron doradas y el humo del portal se convirtió en brasas que bailaban.",
      "Te regaló un aura de esas brasas, y el título de Valiente. El fragmento del Saber volvió al Archivo: «Equivocarse es parte de aprender».",
      "Y ahora, Despertado, presta atención: en los estantes más oscuros del Archivo, algunas páginas se están quedando en blanco. Alguien está borrando lo que ya aprendimos…",
    ],
  },
  // ===== Brumalis · el olvido =====
  {
    id: "brumalis-1",
    guardian: "brumalis",
    title: "La niebla que borra",
    teaser: "Algo está dejando en blanco las páginas del Archivo.",
    scene: "calma",
    guest: { src: "/assets/jefes/brumalis/brumalis-reposo.svg", alt: "Brumalis, la figura de niebla" },
    unlock: { kind: "inicio" },
    hint: "Disponible desde el primer día.",
    pages: [
      "Acércate, Despertado, y mira este estante. ¿Ves cómo algunas páginas están en blanco? Ayer tenían historias. Hoy, nada.",
      "Fue Brumalis. Hace siglos era mi aprendiz: cuidaba la sala de los recuerdos y conocía cada libro por su olor. Pero tenía un miedo enorme: olvidar.",
      "La niebla del Olvido le prometió que, si dejaba de mirar atrás, ya no sufriría. Él aceptó… y se volvió niebla. Ahora borra las pistas que ya viste, para que nadie tenga que recordarlas.",
      "No es malvado: está asustado. En su portal todo lo aprendido se desvanece si no se vuelve a mirar. Prepárate, porque allí aprenderás el arte más antiguo del Archivo: repasar.",
    ],
  },
  {
    id: "brumalis-2",
    guardian: "brumalis",
    title: "Surcos en la pared",
    teaser: "Kuro descubre marcas que la niebla no puede borrar.",
    scene: "descubrimiento",
    guest: { src: "/assets/guias/kuro-cachorro/kuro-cachorro-alerta.svg", alt: "Kuro alerta" },
    unlock: { kind: "guardian", stage: "medio" },
    hint: "Se abre a mitad del portal de Brumalis.",
    pages: [
      "En lo más hondo del portal, Kuro empezó a rascar la pared con la pata. Debajo de la niebla había palabras grabadas, profundas como surcos.",
      "Eran lecciones que algún Despertado había repetido una y otra vez. La niebla pasaba por encima… y no conseguía borrarlas.",
      "Ahí está el secreto: lo que se mira una sola vez es tinta que se evapora. Lo que se repasa se vuelve surco, y el Olvido no tiene uñas para tanto.",
      "Kuro te miró con los ojos muy abiertos. Ya sabes qué hacer cuando llegues ante Brumalis: no le temas a volver atrás.",
    ],
  },
  {
    id: "brumalis-3",
    guardian: "brumalis",
    title: "Lo que se repasa no se olvida",
    teaser: "La sala de los recuerdos vuelve a brillar.",
    scene: "cronica",
    guest: { src: "/assets/jefes/brumalis/brumalis-purificado.svg", alt: "Brumalis purificado" },
    unlock: { kind: "guardian", stage: "purificado" },
    hint: "Se abre al purificar a Brumalis.",
    pages: [
      "Cuando le respondiste a Brumalis cosas que ya habías aprendido antes, la niebla empezó a temblar. Cada recuerdo tuyo era una lámpara que se encendía.",
      "«¿Cómo puedes recordar tanto?», susurró. «Porque vuelvo a mirar», le dijiste. «Olvidar un poco es normal. Lo importante es regresar».",
      "La niebla se aclaró y apareció mi viejo aprendiz, con una linterna en la mano. Me la entregó para ti: la Linterna de Memoria. Y el Archivo recuperó su fragmento: «Lo que se repasa, se queda».",
      "Pero escucha… del portal del mar llegan burbujas llenas de letras revueltas. Alguien allí quiere decir algo importante y no le salen las palabras.",
    ],
  },

  // ===== Mirelle · no saber expresarse =====
  {
    id: "mirelle-1",
    guardian: "mirelle",
    title: "Burbujas de letras",
    teaser: "Una cuentacuentos que ya no puede contar.",
    scene: "calma",
    guest: { src: "/assets/jefes/mirelle/mirelle-reposo.svg", alt: "Mirelle, la medusa-nube" },
    unlock: { kind: "inicio" },
    hint: "Disponible desde el primer día.",
    pages: [
      "Mirelle era la cuentacuentos de las mareas. Cuando hablaba, las olas se quedaban quietas para escucharla.",
      "La niebla de la Confusión se le metió entre las palabras y se las revolvió. Ahora, cuando abre la boca, solo salen burbujas con letras desordenadas.",
      "Ella sabe lo que quiere decir. Lo siente clarito por dentro. Pero cuando intenta explicarlo, todo sale al revés… y se esconde en el fondo del agua, avergonzada.",
      "Su portal está lleno de esas burbujas. Para llegar hasta ella tendrás que aprender a decir las cosas con tus propias palabras.",
    ],
  },
  {
    id: "mirelle-2",
    guardian: "mirelle",
    title: "El cuaderno de Kuro",
    teaser: "Explicar algo es la mejor forma de entenderlo.",
    scene: "descubrimiento",
    guest: { src: "/assets/guias/kuro-cachorro/kuro-cachorro-hablar.svg", alt: "Kuro hablando" },
    unlock: { kind: "guardian", stage: "medio" },
    hint: "Se abre a mitad del portal de Mirelle.",
    pages: [
      "A mitad del portal, Kuro quiso contarle a una burbuja lo que había aprendido. Se enredó, empezó otra vez, y lo dijo más despacio, con sus palabras de cachorro.",
      "¡Pop! La burbuja estalló y sus letras se acomodaron solas, formando una frase clara.",
      "Así descubrimos la debilidad de la Confusión: cuando explicas algo a tu manera, tu cabeza ordena las ideas. No hace falta decirlo perfecto; hace falta decirlo tuyo.",
      "Kuro guardó la frase en su cuaderno. Mirelle no necesita que le hablen bonito: necesita que alguien le muestre que sí se puede explicar.",
    ],
  },
  {
    id: "mirelle-3",
    guardian: "mirelle",
    title: "La voz de la marea",
    teaser: "Mirelle vuelve a contar historias.",
    scene: "cronica",
    guest: { src: "/assets/jefes/mirelle/mirelle-purificado.svg", alt: "Mirelle purificada" },
    unlock: { kind: "guardian", stage: "purificado" },
    hint: "Se abre al purificar a Mirelle.",
    pages: [
      "Frente a Mirelle, respondiste una pregunta tras otra entendiendo el porqué, no solo la respuesta. Cada burbuja que estallaba ordenaba sus letras.",
      "Al final, Mirelle se atrevió a hablar. Las primeras palabras le temblaron. Luego, una frase entera. Luego, una historia.",
      "Te regaló una de sus plumas, la Pluma de Marea, y el título de Narrador. El fragmento volvió a brillar en el Archivo: «Lo que sabes explicar, lo entiendes de verdad».",
      "Pero ahora oigo un rugido raro desde el portal del éter: tres voces a la vez, discutiendo. Me temo que una bestia se ha quedado partida en ideas sueltas.",
    ],
  },

  // ===== Quimax · ideas sueltas =====
  {
    id: "quimax-1",
    guardian: "quimax",
    title: "Tres cabezas, tres caminos",
    teaser: "Una bestia que no se entiende a sí misma.",
    scene: "calma",
    guest: { src: "/assets/jefes/quimax/quimax-reposo.svg", alt: "Quimax, la quimera" },
    unlock: { kind: "inicio" },
    hint: "Disponible desde el primer día.",
    pages: [
      "Quimax tiene cabeza de león, alas de búho y cola de serpiente. Cada parte guarda un saber distinto: el león, la fuerza; el búho, los números; la serpiente, las palabras.",
      "Antes, las tres partes conversaban y juntas resolvían cualquier acertijo. Pero la Confusión les susurró que cada saber era una isla, sin puentes.",
      "Desde entonces las tres cabezas discuten, cada una por su lado. Saben muchísimo… y no logran usar nada, porque nunca juntan lo que saben.",
      "En su portal te espera un reto distinto: no basta con aprender. Tendrás que descubrir cómo se conectan las ideas.",
    ],
  },
  {
    id: "quimax-2",
    guardian: "quimax",
    title: "El hilo dorado",
    teaser: "Brann encuentra algo brillante entre dos ideas.",
    scene: "descubrimiento",
    guest: { src: "/assets/personajes/brann/brann-mostrar.svg", alt: "La Forjadora Brann muestra un hilo dorado" },
    unlock: { kind: "guardian", stage: "medio" },
    hint: "Se abre a mitad del portal de Quimax.",
    pages: [
      "La Forjadora Brann vino a buscarte con algo en la mano: un hilo dorado que encontró enredado entre dos piedras del portal.",
      "«Mira», dijo. «En una piedra está escrito algo de números, y en la otra algo de palabras. El hilo las une. Alguien descubrió que las dos ideas hablaban de lo mismo».",
      "Ese hilo es lo que Quimax perdió. Cada vez que relacionas algo nuevo con algo que ya sabías, tejes un hilo así. Y las ideas unidas pesan menos y se recuerdan más.",
      "Brann lo forjó en un nudo resistente y te lo dio. «Para la quimera», guiñó. «Que se acuerde de que sus tres cabezas son un solo animal».",
    ],
  },
  {
    id: "quimax-3",
    guardian: "quimax",
    title: "La bestia que se entiende",
    teaser: "Las tres cabezas vuelven a conversar.",
    scene: "cronica",
    guest: { src: "/assets/jefes/quimax/quimax-purificado.svg", alt: "Quimax purificado" },
    unlock: { kind: "guardian", stage: "purificado" },
    hint: "Se abre al purificar a Quimax.",
    pages: [
      "Ante Quimax, cada respuesta tuya unía lo que había aprendido en distintos lugares. El león escuchó al búho. El búho escuchó a la serpiente.",
      "Por primera vez en siglos, las tres cabezas se miraron y se rieron juntas: llevaban todo ese tiempo discutiendo sobre lo mismo con distintas palabras.",
      "Quimax te entregó el Hilo de Cometa y el título de Conector. El Archivo recuperó su fragmento: «Las ideas valen más cuando se dan la mano».",
      "Y ahora, Despertado, escucha ese sonido: arena que cae, muy despacio. En el portal dorado hay un ave que repite una sola palabra: «mañana».",
    ],
  },

  // ===== Sandrael · dejarlo para después =====
  {
    id: "sandrael-1",
    guardian: "sandrael",
    title: "El ave que dice «mañana»",
    teaser: "Un reloj de arena que nunca termina de caer.",
    scene: "calma",
    guest: { src: "/assets/jefes/sandrael/sandrael-reposo.svg", alt: "Sandrael, el ave de arena" },
    unlock: { kind: "inicio" },
    hint: "Disponible desde el primer día.",
    pages: [
      "Sandrael cuidaba los relojes de arena del Gremio. Gracias a él, cada tarea tenía su momento y cada momento su tarea.",
      "Un día, el Olvido le regaló una palabra suave como una almohada: «mañana». Sandrael la probó una vez, y le gustó. La probó otra, y otra más.",
      "Ahora lleva un reloj en el pecho que nunca termina de caer, y a todo el que se acerca le susurra: «Tranquilo, hazlo mañana». La arena se amontona y las tareas se vuelven montañas.",
      "Su portal no se vence con fuerza ni con prisa. Se vence con algo más sencillo y más difícil: decidir qué hacer primero, y hacerlo hoy.",
    ],
  },
  {
    id: "sandrael-2",
    guardian: "sandrael",
    title: "Kael también lo deja para después",
    teaser: "Tu rival tiene un secreto.",
    scene: "descubrimiento",
    guest: { src: "/assets/personajes/kael/kael-pensar.svg", alt: "Kael pensativo" },
    unlock: { kind: "guardian", stage: "medio" },
    hint: "Se abre a mitad del portal de Sandrael.",
    pages: [
      "A mitad del portal te encontraste con Kael, sentado sobre una duna. Por primera vez, no te retó a nada.",
      "«Llevo tres días diciendo que mañana entreno», confesó, rascándose la cabeza. «Y cada día la duna es más alta».",
      "Juntos dibujaron un plan en la arena: tres pasos pequeños, uno para hoy, otro para el día siguiente y otro para después. Al terminar el primero, la duna bajó un palmo.",
      "Kael sonrió de lado. «No le digas a nadie que me ayudaste», dijo. Pero se fue entrenando… hoy, no mañana.",
    ],
  },
  {
    id: "sandrael-3",
    guardian: "sandrael",
    title: "El reloj vuelve a girar",
    teaser: "La arena cae otra vez, al ritmo justo.",
    scene: "cronica",
    guest: { src: "/assets/jefes/sandrael/sandrael-purificado.svg", alt: "Sandrael purificado" },
    unlock: { kind: "guardian", stage: "purificado" },
    hint: "Se abre al purificar a Sandrael.",
    pages: [
      "Cada vez que Sandrael te susurraba «mañana», tú respondías una pregunta más, ahora. La montaña de arena empezó a bajar.",
      "Al final, el reloj de su pecho dio la vuelta solo. La arena cayó con el ritmo justo: ni con prisa, ni detenida.",
      "Te regaló el Reloj de Arena Dorada y el título de Estratega. El fragmento volvió al Archivo: «Un plan pequeño hoy vale más que uno enorme mañana».",
      "Ahora debo advertirte de algo serio. Hay un espejo en el portal gris que dice mentiras. Y lo peor es que miente sobre ti.",
    ],
  },

  // ===== Eclipsa · la duda en uno mismo =====
  {
    id: "eclipsa-1",
    guardian: "eclipsa",
    title: "El espejo que miente",
    teaser: "Un reflejo que se quedó en tu primer día.",
    scene: "calma",
    guest: { src: "/assets/jefes/eclipsa/eclipsa-reposo.svg", alt: "Eclipsa, el espejo" },
    unlock: { kind: "inicio" },
    hint: "Disponible desde el primer día.",
    pages: [
      "Eclipsa no ruge ni lanza fuego. Es un espejo alto y elegante, y su arma es una sola frase: «No has avanzado nada».",
      "Cuando un Despertado se mira en él, no ve quién es hoy. Ve quién era el primer día, con el rango E y la mochila vacía.",
      "Muchos se lo creen y dejan de intentar. ¿Para qué, si el espejo dice que siguen igual? Así, sin tocar a nadie, Eclipsa detiene a los más valientes.",
      "No te diré todavía cómo vencerla. Solo te pido una cosa: guarda bien todo lo que has ganado. Te hará falta.",
    ],
  },
  {
    id: "eclipsa-2",
    guardian: "eclipsa",
    title: "La colección del Despertado",
    teaser: "Kuro trae pruebas.",
    scene: "descubrimiento",
    guest: { src: "/assets/guias/kuro-cachorro/kuro-cachorro-senalar.svg", alt: "Kuro señala tu colección" },
    unlock: { kind: "guardian", stage: "medio" },
    hint: "Se abre a mitad del portal de Eclipsa.",
    pages: [
      "A mitad del portal, el espejo te había dejado callado. Entonces Kuro llegó arrastrando tu mochila con los dientes.",
      "La volcó en el suelo: insignias, sellos de portal, recompensas de Guardianes, tu primera misión superada… Todo lo que habías conseguido, una prueba al lado de otra.",
      "«El espejo te muestra cómo empezaste», dijo Eon desde lejos, «pero tu colección muestra todo lo que caminaste. ¿A cuál le vas a creer?».",
      "Kuro se sentó encima de la insignia de rango más alta que tenías y movió la cola, orgulloso. Él ya había decidido a quién creerle.",
    ],
  },
  {
    id: "eclipsa-3",
    guardian: "eclipsa",
    title: "Lo que ya lograste",
    teaser: "El espejo por fin dice la verdad.",
    scene: "cronica",
    guest: { src: "/assets/jefes/eclipsa/eclipsa-purificado.svg", alt: "Eclipsa purificada" },
    unlock: { kind: "guardian", stage: "purificado" },
    hint: "Se abre al purificar a Eclipsa.",
    pages: [
      "Frente a Eclipsa no discutiste. Le mostraste lo que habías logrado, una cosa tras otra, y respondiste sus preguntas con todo lo aprendido.",
      "El espejo empezó a resquebrajarse… y detrás de las grietas apareció un reflejo nuevo: tú, como eres hoy. Más alto, más sabio, con la mirada firme.",
      "Eclipsa se volvió un espejo sincero, y te regaló un trozo de sí misma: el Espejo Sincero, con el título de Seguro de sí. El fragmento brilló: «Mira cuánto has avanzado antes de juzgarte».",
      "Despertado… ha llegado la hora. Todas las nieblas vienen de un mismo lugar: una grieta en el corazón del Archivo. Y algo enorme está despertando allí.",
    ],
  },

  // ===== Zhaal · el Vacío =====
  {
    id: "zhaal-1",
    guardian: "zhaal",
    title: "La grieta del Vacío",
    teaser: "De dónde vienen todas las nieblas.",
    scene: "cronica",
    guest: { src: "/assets/jefes/zhaal/zhaal-reposo.svg", alt: "Zhaal, el dragón de cristal" },
    unlock: { kind: "inicio" },
    hint: "Disponible desde el primer día.",
    pages: [
      "En el centro del Archivo hay una puerta que nunca te mostré. Detrás duerme Zhaal, un dragón de cristal tan antiguo como la Gran Biblioteca de Luz.",
      "Zhaal guardaba el corazón de la Biblioteca. Cuando llegó la Gran Fractura, una grieta lo atravesó, y por esa grieta empezaron a salir el Olvido y la Confusión.",
      "Por eso Zhaal lleva dentro todos los obstáculos: el «es demasiado grande», el miedo a equivocarse, el olvido, las palabras revueltas, las ideas sueltas, el «mañana» y la duda.",
      "Solo un Despertado que haya aprendido a vencerlos todos podrá llegar hasta él. No te pido que vayas hoy. Te pido que no olvides el camino que te trajo hasta aquí.",
    ],
  },
  {
    id: "zhaal-2",
    guardian: "zhaal",
    title: "Nadie llega solo",
    teaser: "Los Guardianes purificados vuelven.",
    scene: "descubrimiento",
    guest: { src: "/assets/personajes/kael/kael-dar-la-mano.svg", alt: "Kael te tiende la mano" },
    unlock: { kind: "guardian", stage: "medio" },
    hint: "Se abre a mitad del portal de Zhaal.",
    pages: [
      "A mitad del último portal, el cristal se volvió tan frío que te costaba avanzar. Entonces oíste pasos detrás de ti.",
      "Petrox traía sus planos. Ignaris iluminaba el camino. Brumalis sostenía la linterna, Mirelle cantaba, Quimax olfateaba el rumbo, Sandrael marcaba el ritmo y Eclipsa te devolvía tu reflejo de hoy.",
      "Y al final de la fila, con la capa roja ondeando, Kael. «Esta vez no es un duelo», dijo, tendiéndote la mano. «Vamos juntos».",
      "Aprendiste algo que ningún libro dice tan claro: los obstáculos se enfrentan uno por uno, pero el camino se recorre en compañía.",
    ],
  },
  {
    id: "zhaal-3",
    guardian: "zhaal",
    title: "La Biblioteca de Luz",
    teaser: "El final… y un nuevo comienzo.",
    scene: "cronica",
    guest: { src: "/assets/jefes/zhaal/zhaal-purificado.svg", alt: "Zhaal purificado" },
    unlock: { kind: "guardian", stage: "purificado" },
    hint: "Se abre al purificar a Zhaal.",
    pages: [
      "Cada respuesta tuya cerraba un poco la grieta de Zhaal. Usaste todo: pasos pequeños, valentía, repaso, tus propias palabras, ideas conectadas, un plan para hoy y la certeza de lo que ya lograste.",
      "La grieta se llenó de luz. Zhaal abrió los ojos, y ya no eran oscuros: eran del color del amanecer. Las nieblas se disolvieron como un mal sueño.",
      "Los estantes del Archivo se unieron otra vez en la Gran Biblioteca de Luz. Zhaal te coronó con la Corona del Gremio y te dio el título de Maestro del Saber.",
      "Pero escucha, Despertado: la Biblioteca nunca deja de crecer. Cada día se abren portales nuevos y llegan nuevos aprendices. Ahora eres tú quien puede guiarlos. Y yo seguiré aquí, escribiendo tus Crónicas.",
    ],
  },

];

export function chapterById(id: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

/** Clave de un hito alcanzado: «guardián:etapa». */
export const stageKey = (guardian: string, stage: Stage) => `${guardian}:${stage}`;

/**
 * Hitos que alcanza un portal según las misiones superadas (posiciones) y cuántas tiene:
 * «medio» con la penúltima, «purificado» con la última (el Guardián).
 */
export function stagesReached(guardian: string, completed: Iterable<number>, total: number): string[] {
  const done = new Set(completed);
  const out: string[] = [];
  if (total < 1) return out;
  if ([...done].some((p) => p >= Math.max(1, total - 1))) out.push(stageKey(guardian, "medio"));
  if (done.has(total)) out.push(stageKey(guardian, "purificado"));
  return out;
}

export function isUnlocked(ch: Chapter, reached: ReadonlySet<string>): boolean {
  return ch.unlock.kind === "inicio" || (ch.guardian !== null && reached.has(stageKey(ch.guardian, ch.unlock.stage)));
}

/** Capítulos que se abren justo al aprobar por primera vez la misión `position` de un portal de `total` misiones. */
export function chaptersUnlockedBy(guardian: string, position: number, total: number): Chapter[] {
  const now = new Set(stagesReached(guardian, [position], total));
  const before = new Set(position > 1 ? stagesReached(guardian, [position - 1], total) : []);
  return CHAPTERS.filter((c) => c.guardian === guardian && c.unlock.kind === "guardian" && now.has(stageKey(guardian, c.unlock.stage)) && !before.has(stageKey(guardian, c.unlock.stage)));
}
