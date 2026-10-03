# Biblia de Personajes y Universo — v0.2

> Nombre provisional del universo: **UMBRAL — Cazadores del Saber**
> (se puede cambiar; todo el documento usa este nombre como referencia)

Documento de diseño visual, narrativo y de animación. Es la fuente única de verdad para ilustradores, animadores y desarrolladores. El sitio web se construye después, a partir de este documento.

---

## Estado actual (v0.2): lo que ya está producido

La parte visual está completa y vive en el artefacto **«Elenco del gremio»** (12 pestañas). Los 1.057 SVG están exportados en [`assets/`](../assets/README.md). Donde esta tabla y el resto del documento difieran, **manda esta tabla**.

| Área | Estado | Cambios respecto a v0.1 |
|---|---|---|
| Guías | Kuro (3 etapas) y Sora | — |
| Aliados | Eon, Brann, Kael | — |
| Avatares del jugador | **4**: Aria, Leo, Tomás y Nuri, con **personalizador** (piel, ojos, peinado, cabello, ropa) y rangos E–S | Mei, Kai, Zuri y Dani se sustituyen por el personalizador. Tomás usa silla con aros de energía; Nuri, audífonos y bastón de runas |
| Docentes y familias | 4 Maestros del Gremio y 4 Guardianes del Hogar (madre, padre, abuela, abuelo) | Las familias incluyen abuelos |
| Enemigos menores | Slime Confuso, Duende Enredador, Sombrita, Cofre Mímico | — |
| **Jefes** | **8 Guardianes** (Petrox, Ignaris, Brumalis, Mirelle, Quimax, Sandrael, Eclipsa, Zhaal) con fases de calma, furia y purificado; 15–22 animaciones cada uno | Cada Guardián encarna un obstáculo de aprendizaje, no una materia (ver §4) |
| **Escenarios** | **7**: Gremio (día/noche), Sala de Portales, Mazmorra (fuego/agua/sombra), Arena del Guardián, Tienda y Arsenal, Archivo de Crónicas, Terraza del Hogar; 4 capas y marcadores `slot_*` | Se añade la Terraza para el panel de familias |
| **Objetos** | **156** en 17 categorías y 5 rarezas, con 3 estados y `catalogo.json` | Incluye poderes, ayudas, recursos, interfaz, cofres, recompensas de Guardianes, insignias, sellos de portal, marcos, títulos, certificado, equipo, cosméticos, focos, compañeros y decoración |

### Decisiones que siguen abiertas
- Nombre definitivo del universo («UMBRAL» es provisional).
- Sonido: música, efectos y voz.
- Validar la animación de señas de Nuri con una persona usuaria de Lengua de Señas Colombiana.
- Definir los cursos y asignar a cada uno el Guardián cuyo obstáculo mejor encaje (§4.4).

### Pendiente para la web
Registro y perfil, Sala de Portales conectada a los cursos, misiones y evaluaciones, XP y rangos, inventario y tienda, y paneles para docentes y familias.

---

## 1. Concepto

**Premisa.** Hace siglos el Conocimiento se fracturó en dimensiones llamadas **Portales**. Cada portal está custodiado por un **Guardián**: una criatura nacida del *Olvido* y la *Confusión*. Quienes pueden cruzarlos se llaman **Despertados** (los estudiantes). Al superar un portal recuperan un fragmento del Saber, ganan poder y suben de rango.

**Tono.** Épico pero cálido. Misterioso, no aterrador. Humor suave. Los niños deben sentir aventura, los adolescentes deben sentir progreso y estatus, y docentes y padres deben sentir confianza.

**Reglas de contenido (público infantil y adolescente):**
- Nada de sangre, armas realistas ni muerte. Las criaturas **se purifican, se liberan o se desvanecen en luz**.
- Perder una batalla es "**Reagruparse**", no un castigo. Se reintenta con pistas.
- El error es parte del juego: los personajes reaccionan con ánimo, nunca con burla.
- Diversidad real en el elenco (géneros, tonos de piel, cuerpos, capacidades).

**Equivalencias con los proyectos educativos:**

| Proyecto | En el universo |
|---|---|
| Curso | **Portal** dimensional |
| Módulo / unidad | **Piso** de la mazmorra |
| Lección o actividad | **Misión** |
| Evaluación final del curso | **Batalla contra el Guardián** |
| Evaluación parcial | **Prueba de Umbral** (mini-jefe) |
| Storytelling | **Crónicas** (historia que se desbloquea) |
| Juegos educativos | **Desafíos** y salas de entrenamiento |
| Certificado | **Sello del Portal** |
| Docente | **Maestro del Gremio** |
| Padre / madre / tutor | **Guardián del Hogar** |

---

## 2. Dirección de arte

### 2.1 Estilo
- **Anime/cel-shading limpio** con contornos definidos, sombras en 2 niveles y brillos puntuales.
- Siluetas muy legibles (cada personaje se reconoce en negro sólido).
- Proporciones: protagonistas ~6 cabezas (adolescente), mascotas y niños ~4 cabezas. Guardianes más estilizados y "tiernos-épicos".
- Efectos mágicos con **partículas, líneas de energía y runas** (símbolo recurrente: un **umbral**, un arco con una chispa en el centro).

### 2.2 Paleta oficial

Elegida para: buen contraste y legibilidad en pantalla, atractivo para niños, adolescentes y adultos, y sensación "mágica de noche" sin ser oscura ni deprimente.

| Rol | Nombre | HEX | Uso |
|---|---|---|---|
| Fondo base | Noche Índigo | `#14123B` | Fondos, paneles |
| Fondo secundario | Medianoche | `#241F5C` | Tarjetas, capas de profundidad |
| Primario (poder) | Cian Portal | `#2EE6D6` | Portales, botones, XP, brillo de héroe |
| Secundario (magia) | Violeta Arcano | `#8A5CFF` | Poderes, aura, enlaces |
| Acento (recompensa) | Oro Solar | `#FFC83D` | Logros, rango, monedas, celebración |
| Acento cálido | Coral Vital | `#FF6B6B` | Vida, alertas amables, Guardianes |
| Éxito | Verde Brote | `#4ADE80` | Aciertos |
| Texto claro | Luna | `#F4F2FF` | Texto sobre fondo oscuro |
| Texto oscuro | Tinta | `#1B1740` | Texto sobre fondo claro |

**Colores por rango:**

| Rango | Color | HEX |
|---|---|---|
| E | Gris Piedra | `#9AA0B4` |
| D | Verde Brote | `#4ADE80` |
| C | Cian Portal | `#2EE6D6` |
| B | Violeta Arcano | `#8A5CFF` |
| A | Coral Vital | `#FF6B6B` |
| S | Oro Solar | `#FFC83D` |

**Modo claro** (para docentes y padres que lo prefieran): fondo `#F4F2FF`, texto `#1B1740`, mismos acentos. Los colores se verifican con contraste mínimo AA (4.5:1) para texto.

### 2.3 Tipografía sugerida
- Títulos: *Fredoka* o *Baloo 2* (amigable, legible para niños) — alternativa más épica: *Rajdhani*.
- Cuerpo: *Nunito* o *Inter*.
- Números y rangos: *Orbitron* o *Rajdhani* (aspecto "sistema").

### 2.4 Elementos de interfaz con identidad del universo
- **Ventana de Sistema:** paneles semitransparentes con borde cian brillante (guiño al "sistema" del anime, sin copiarlo).
- Barra de XP, barra de Vida (corazones o gemas) y Rango en forma de **emblema**.

---

## 3. Elenco principal

### 3.1 Protagonista: el Despertado (el usuario)

Personaje personalizable. No tiene nombre fijo: se llama como el usuario.

**Avatares base (8):** se eligen al registrarse, todos con rango E.

| # | Código | Descripción | Rasgo distintivo |
|---|---|---|---|
| 1 | **Aria** | Chica, cabello corto azul, chaqueta con capucha | Pulsera cian |
| 2 | **Leo** | Chico, cabello oscuro rizado, bufanda | Bolsa de pergaminos |
| 3 | **Mei** | Chica, dos trenzas, gafas redondas | Libreta brillante |
| 4 | **Kai** | Chico, cabello rubio despeinado, capa corta | Guantes de energía |
| 5 | **Zuri** | Chica, cabello afro con cintas, falda-armadura ligera | Cinta de luz |
| 6 | **Dani** | Neutro/andrógino, cabello medio, abrigo largo | Broche en forma de umbral |
| 7 | **Tomás** | Chico en silla de ruedas con ruedas de energía | Escudo ligero |
| 8 | **Nuri** | Chica con audífonos/implante coclear estilizado | Bastón de runas |

**Sistema de piezas intercambiables (capas separadas):** cabello, rostro, cuerpo, ropa superior, ropa inferior, capa, calzado, accesorio, arma/foco, aura. Se desbloquean por misión, rango o logro.

**Evolución visual por rango (apariencia base):**

| Rango | Estilo de equipo | Aura |
|---|---|---|
| E | Ropa de aprendiz, sin brillos | Ninguna |
| D | Capa corta y detalles verdes | Destellos leves |
| C | Armadura ligera, runas cian | Aura cian suave |
| B | Capa larga, hombreras, runas violeta | Aura violeta con partículas |
| A | Armadura ornamentada, alas de energía pequeñas | Aura coral intensa |
| S | Armadura legendaria, corona de luz | Aura dorada + sombra dorada que lo acompaña |

### 3.2 Aliados

#### **Maestra Sora** — Guía del Gremio (presentadora principal)
- **Rol:** da la bienvenida, explica misiones, entrega recompensas, narra tutoriales.
- **Aspecto:** mujer adulta joven, cabello plateado largo con mechón cian, túnica blanca-índigo con bordes dorados, báculo con un cristal-portal.
- **Personalidad:** serena, alentadora, sabe cuándo ser divertida. Frase: *"Todo Despertado tropieza. Los grandes se levantan."*
- **Animaciones clave:** hablar con gestos, saludo, señalar, celebrar, preocupación amable.

#### **Kuro** — Compañero (mascota)
- **Rol:** acompaña siempre al usuario; reacciona a aciertos y errores; da pistas.
- **Aspecto:** pequeño lobo-dragón de pelaje índigo, ojos cian, cola con punta de fuego violeta, orejas grandes expresivas.
- **Personalidad:** juguetón, leal, algo torpe.
- **Evolución:** cachorro (E-D) → joven (C-B) → majestuoso (A-S). Cambia de color y tamaño.
- **Animaciones clave:** reposo (mueve la cola), correr, saltar de alegría, ladrar/aullar, inclinar la cabeza, esconderse, dormir.

#### **Archivista Eon** — Narrador de Crónicas
- **Rol:** voz del storytelling; presenta las historias de cada portal.
- **Aspecto:** anciano de barba larga con constelaciones, túnica con libros flotando alrededor, ojos que brillan al narrar.
- **Personalidad:** sabio, teatral, dulce.
- **Animaciones clave:** narrar, abrir libro, hacer aparecer ilusiones, reír.

#### **Forjadora Brann** — Tienda y Arsenal
- **Rol:** canje de monedas por objetos, mejoras y cosméticos.
- **Aspecto:** mujer robusta, delantal de herrera, gafas con lentes de aumento, martillo con runas.
- **Personalidad:** directa, orgullosa de su oficio, cariñosa con los novatos.
- **Animaciones clave:** golpear yunque, mostrar objeto, aprobar, regatear (divertida).

#### **Kael** — Rival amistoso
- **Rol:** reta al usuario a superar su puntaje; aparece en rankings y duelos de práctica.
- **Aspecto:** adolescente de cabello rojo, capa corta, sonrisa confiada, espada de luz estilizada (sin filo realista).
- **Personalidad:** competitivo pero justo; con el tiempo se vuelve aliado.
- **Animaciones clave:** brazos cruzados, desafío, asombro por la derrota, apretón de manos.

### 3.3 Roles de adultos (docentes y familias)

#### **Maestro del Gremio** (docente)
- Panel propio: crea misiones, ve el progreso de la clase y asigna portales.
- **Avatar:** versión adulta con túnica azul-índigo y emblema del Gremio; 4 variantes para elegir.
- Tono de interfaz más sobrio, mismo universo.

#### **Guardián del Hogar** (padre, madre o tutor)
- Panel de seguimiento: logros, tiempo, rangos desbloqueados.
- **Avatar:** capa verde con emblema de escudo; 4 variantes.
- Mensajes de apoyo que se pueden enviar al estudiante ("Hoy conquistaste un portal, ¡orgullo!").

---

## 4. Antagonistas: Sistema de Guardianes por curso

Los cursos todavía no están diseñados, así que **no se define un jefe por materia**. En su lugar se establece un **sistema modular**: cuando nazca un curso, se genera su Guardián combinando las piezas de abajo en menos de un día de diseño.

### 4.1 La receta de un Guardián

Cada curso define 5 datos y de ahí sale su Guardián:

1. **Idea central del curso** → concepto simbólico del Guardián.
2. **Familia de criatura** (tabla 4.2).
3. **Elemento / color dominante** (tabla 4.3).
4. **Debilidad = objetivo de aprendizaje.** Se vence demostrando la habilidad central del curso.
5. **Fase del jefe** (cuántas formas tiene, según la duración del curso).

### 4.2 Familias de criaturas

| Familia | Silueta | Ejemplos de uso | Tono |
|---|---|---|---|
| **Dracónidos** | Alas, cola, cuernos | Cursos largos o "épicos" | Majestuoso |
| **Golems** | Bloques, runas, cuerpo grande | Estructura, procesos, lógica | Imponente-torpe |
| **Bestias Arcanas** | Lobos, felinos, aves mitológicas | Cursos de práctica o fluidez | Ágil |
| **Espectros** | Capas de humo, máscaras, ojos | Memoria, repaso, creatividad | Misterioso |
| **Quimeras** | Mezcla de 2-3 animales | Cursos interdisciplinarios | Extravagante |
| **Colosos Acuáticos / Celestes** | Kraken, medusas, nubes con ojos | Exploración, ciencia, expresión | Etéreo |
| **Duendes y Slimes** | Pequeños, redondos, graciosos | **Enemigos menores** de preguntas | Cómico |

### 4.3 Elementos y colores

| Elemento | Color principal | Sensación |
|---|---|---|
| Luz | Oro / blanco | Claridad, inicio |
| Sombra | Violeta profundo | Misterio, olvido |
| Fuego | Coral / naranja | Energía, desafío |
| Agua / Hielo | Cian / azul | Calma, flujo |
| Naturaleza | Verde | Crecimiento |
| Éter (arcano) | Magenta / violeta | Magia, creatividad |

**Regla:** el Guardián nunca usa los colores de la interfaz de éxito (verde brote) como color dominante de peligro, para no confundir al estudiante.

### 4.4 Diseño de cada Guardián (plantilla de ficha)

```
Nombre del Guardián:
Curso / Portal:
Familia + Elemento:
Idea central (lo que simboliza):
Debilidad (objetivo de aprendizaje):
Aspecto (silueta, 3 rasgos distintivos, paleta):
Personalidad / frase característica:
Fases (1, 2, 3):
Animaciones especiales:
Recompensa al vencerlo (objeto, avatar o poder):
```

### 4.5 Guardianes de ejemplo (curso por definir)

Solo ilustran el sistema; se reemplazarán cuando existan los cursos.

| Guardián (provisional) | Familia + Elemento | Idea central | Aspecto en una línea |
|---|---|---|---|
| **Ignaris** | Dracónido + Fuego | "Atreverse a empezar" | Dragón joven de escamas coral con crin de llamas violetas |
| **Brumalis** | Espectro + Sombra | "El Olvido" | Figura de niebla con máscara blanca y ojos cian |
| **Petrox** | Golem + Naturaleza | "Construir paso a paso" | Gigante de piedra con musgo y runas doradas en el pecho |
| **Mirelle** | Coloso Acuático + Agua | "Fluir y expresarse" | Medusa-nube con tentáculos de cintas luminosas |
| **Quimax** | Quimera + Éter | "Conectar ideas" | León con alas de búho y cola de serpiente-cometa |
| **Zhaal, el Vacío** | Dracónido + Sombra/Luz | **Jefe final del Gremio** (evaluación global) | Dragón de cristal oscuro con una fisura de luz dorada |

### 4.6 Enemigos menores (comunes para todas las preguntas)

| Criatura | Rol | Detalle |
|---|---|---|
| **Slime Confuso** | Pregunta fácil | Se aplasta con cara de sorpresa |
| **Duende Enredador** | Pregunta media | Se ríe, esquiva, tira cuerdas |
| **Sombrita** | Pregunta de repaso | Se esconde y reaparece |
| **Cofre Mímico** | Pregunta sorpresa o bonus | Parece cofre, se transforma |

### 4.7 Cómo se "vence" a un Guardián
- Barra de vida del Guardián = progreso de respuestas correctas.
- Un error no daña al estudiante: el Guardián se **fortalece brevemente** y Kuro ofrece una pista.
- Al vencerlo: el Guardián se **purifica** (pierde la oscuridad, revela su forma luminosa) y entrega su recompensa. Nunca desaparece de forma violenta.

---

## 5. Escenografías

Cada escenario se entrega en **4 capas** (fondo, plano medio, primer plano, partículas) para efecto parallax.

| # | Escenario | Función | Atmósfera |
|---|---|---|---|
| 1 | **El Gremio** | Pantalla principal / hub | Gran sala circular de piedra con ventanales, estandartes, cristales flotando; luz cálida dorada y cian |
| 2 | **Sala de Portales** | Catálogo de cursos | Corredor con arcos; cada portal es un anillo con color y símbolo propio |
| 3 | **Mazmorra** (3 variantes de color) | Misiones del curso | Pasillos y plataformas; paleta cambia según el elemento del portal |
| 4 | **Arena del Guardián** | Evaluaciones | Plataforma circular flotante en el vacío, runas en el piso |
| 5 | **Tienda y Arsenal** | Objetos, avatares, poderes | Herrería-taller acogedora con vitrinas de luz |
| 6 | **Archivo de Crónicas** | Storytelling | Biblioteca infinita con libros que flotan |
| 7 | **Terraza del Hogar** (opcional) | Panel de padres | Mirador tranquilo al atardecer |

---

## 6. Objetos, poderes y desbloqueables

### 6.1 Categorías
- **Avatares** (base + variantes de rango).
- **Piezas de equipo** (cabello, ropa, capas, accesorios).
- **Compañeros** (skins de Kuro, otras mascotas).
- **Poderes** (efectos visuales al responder correctamente).
- **Objetos de ayuda** (pista, 50/50, escudo contra error, tiempo extra).
- **Títulos** (texto bajo el nombre).
- **Marcos y fondos de perfil.**

### 6.2 Rareza

| Rareza | Color |
|---|---|
| Común | Gris Piedra |
| Poco común | Verde Brote |
| Raro | Cian Portal |
| Épico | Violeta Arcano |
| Legendario | Oro Solar |

### 6.3 Poderes (efectos activables)
Rayo de Claridad, Escudo de Calma, Aura de Concentración, Lluvia de Estrellas, Sombra Dorada (S), Invocación de Kuro. Cada poder tiene su **animación de activación** (ver §7).

---

## 7. Biblia de animación

### 7.1 Set esencial (todos los personajes con voz)

| # | Animación | Duración | Loop | Notas |
|---|---|---|---|---|
| 1 | **Reposo (idle)** | 2–4 s | Sí | Respiración, parpadeo, leve movimiento de ropa |
| 2 | **Hablar** | 1–2 s | Sí | Boca sincronizada con 5–6 formas (visemas) + gestos suaves |
| 3 | **Levantar la mano** | 1 s | No | Pide la palabra o responde |
| 4 | **Caminar** | 1 s | Sí | Ciclo de 8 fotogramas/huesos |
| 5 | **Celebrar** | 1.5–2 s | No | Salto, puños arriba, partículas doradas |
| 6 | **Asombro** | 1 s | No | Ojos grandes, retroceso, signo "!" opcional |
| 7 | **Derrota / Reagruparse** | 1.5 s | No | Se agacha, rodillas, **se levanta** (final positivo) |
| 8 | **Activar poder** | 1.5 s | No | Carga, destello, aura, efecto |
| 9 | **Animación especial** | 3–4 s | No | Única por personaje (ver §7.3) |

### 7.2 Set adicional recomendado

| Animación | Para quién |
|---|---|
| **Pensar / dudar** (mano en barbilla, signo "?") | Protagonista, Kuro |
| **Atacar** (lanzar poder) | Protagonista, Kael, Guardianes |
| **Recibir daño / tropiezo** | Todos |
| **Subir de rango** (columna de luz) | Protagonista, Kuro |
| **Entrar al portal** | Protagonista |
| **Recibir objeto** (abrir cofre) | Protagonista |
| **Saludar / despedirse** | Sora, Eon, Brann, Kael |
| **Dormir / aburrido** (inactividad > 30 s) | Protagonista, Kuro |

### 7.3 Animación especial por personaje

| Personaje | Animación especial |
|---|---|
| Despertado (por rango) | **Transformación de rango:** destello, aparece el equipo nuevo, aura |
| Maestra Sora | **Apertura de portal:** traza un círculo en el aire y el portal se abre |
| Kuro | **Evolución:** envuelto en luz, crece, aullido |
| Archivista Eon | **Crónica viva:** los libros se abren y proyectan una escena |
| Forjadora Brann | **Forja legendaria:** martillazo, lluvia de chispas |
| Kael | **Duelo:** pose de reto con ráfaga de energía |
| Guardianes | **Fase 2 / Furia:** cambian de color, rugido, aumentan partículas |

### 7.4 Animaciones de Guardianes y enemigos

| Animación | Detalle |
|---|---|
| Aparición | Entrada dramática (humo, grieta, portal) |
| Reposo amenazante | Loop lento y respirado |
| Hablar / provocar | Boca + gesto, frase corta |
| Atacar | Telegráfico (el niño ve que "viene") |
| Recibir golpe | Destello blanco + retroceso |
| Furia (cambio de fase) | Cambio de color y tamaño |
| **Purificación** (derrota) | Se disuelve en luz dorada y revela su forma luminosa |

### 7.5 Reglas de movimiento (principios)
- **Anticipación, acción, reacción:** cada animación tiene preparación, ejecución y asentamiento.
- **Siluetas claras** durante la acción.
- **Duración corta:** nada que bloquee al estudiante más de 2 s, excepto animaciones especiales (se pueden saltar).
- **Accesibilidad:** opción "reducir movimiento" (versión estática o simplificada); sin destellos que superen 3 por segundo.
- **Consistencia:** todos los personajes comparten la misma "curva" de rebote para sentirse del mismo mundo.

### 7.6 Especificaciones técnicas (recomendadas)

- **Técnica:** personajes 2D por capas con rig de huesos (**Rive** o **Spine**), con respaldo en **Lottie** o sprite sheets para efectos puntuales.
- **Tamaño de trabajo:** lienzo de 2048 × 2048 px por personaje, exportación optimizada para web.
- **Nomenclatura de capas:** `personaje_parte_variante` (ejemplo: `aria_cabello_01`, `aria_capa_rango_c`).
- **Estados de animación (state machine):** `idle`, `talk`, `walk`, `raise_hand`, `celebrate`, `amazed`, `defeat`, `power`, `special`, con transiciones definidas.
- **Peso:** objetivo menor de 300 KB por personaje animado.
- **Formatos de entrega:** archivo fuente (PSD/Figma/Rive), SVG o PNG por capas, hoja de modelo (model sheet).

---

## 8. Hojas de modelo requeridas por personaje

Cada personaje debe tener antes de animarse:

1. Vista frontal, 3/4, lateral y espalda.
2. Paleta de colores con HEX.
3. 6 expresiones faciales (neutra, feliz, triste, sorprendida, enojada, pensativa).
4. 5 poses clave (de pie, hablando, celebrando, corriendo, derrotado).
5. Comparativa de tamaño con los demás personajes.
6. Variantes por rango (para el protagonista, Kuro y Guardianes con fases).

---

## 9. Flujo de producción y prioridades

| Etapa | Entrega | Prioridad |
|---|---|---|
| **A** | Biblia aprobada (este documento) y moodboard | Ahora |
| **B** | Model sheets: Sora, Kuro, 2 avatares (Aria y Leo), 1 Guardián de ejemplo | Alta |
| **C** | Escenarios: El Gremio y Sala de Portales | Alta |
| **D** | Set esencial de animaciones de Sora y Kuro | Alta |
| **E** | Resto de avatares y animaciones del protagonista | Media |
| **F** | Aliados restantes (Eon, Brann, Kael) | Media |
| **G** | Guardianes de los primeros cursos (al definirlos) | Cuando existan los cursos |
| **H** | Objetos, poderes y piezas de equipo | Continuo |

---

## 10. Decisiones abiertas

- [ ] Nombre definitivo del universo.
- [ ] Aprobar o ajustar la paleta oficial.
- [ ] Aprobar los 8 avatares base (¿algún cambio?).
- [ ] Elegir técnica de animación (Rive/Spine/Lottie).
- [ ] ¿Se usará voz grabada o solo texto/globos de diálogo?
- [ ] Definir si habrá música y efectos de sonido por escenario.
- [ ] Cuando se diseñen los cursos: asignar un Guardián a cada portal con la ficha de §4.4.
