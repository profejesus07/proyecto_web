# Prompt para crear las escenografías (v0.1)

Para pegar en la conversación donde vive el artefacto **«Elenco del gremio»**. Crea una pestaña nueva «Escenarios» con el mismo diseño que el resto. Primera tanda: **El Gremio**, **Sala de Portales** y **Arena del Guardián**. Las demás se piden después con el mismo prompt cambiando la sección 4.

---

## PROMPT PRINCIPAL

```
Continúa el artefacto «Elenco del gremio». Añade una pestaña nueva llamada «Escenarios» (id sec-escenarios, prefijo de clases e_) con las escenografías del universo. Primera tanda: El Gremio, Sala de Portales y Arena del Guardián.

PASO 0 — Lee el artefacto primero y respeta su técnica y su diseño de página: SVG inline + @keyframes CSS, sin imágenes externas, tokens de color y tipografías de la página, cabecera con pestañas, escenario grande arriba con panel de controles, tabla «Cuándo usar», guía de estilo, paleta aplicada, lista de capas y bloque «Uso en la web». Reutiliza el mismo sistema de exportación SVG que usa la pestaña «Jefes» (archivos sueltos + zip).

1. FORMATO
- Cada escenario es un SVG de viewBox 1280×720 (16:9), sin fondo propio fuera del dibujo.
- Debe verse bien recortado a vertical (9:16) y a cuadrado: lo importante va en el centro y deja una «zona segura» de 640×720.
- Cuatro capas por escenario, con ids: esc_<nombre>_fondo, esc_<nombre>_medio, esc_<nombre>_frente, esc_<nombre>_particulas.
- Efecto de profundidad (parallax): cada capa se mueve según el puntero o la inclinación del dispositivo con distinta intensidad (fondo 0.2, medio 0.5, frente 1.0, partículas 1.4). Con «reducir movimiento» queda estático.
- Marcadores de posición (invisibles al exportar): slot_aliado_izq, slot_jugador, slot_guia, slot_jefe, slot_ui_arriba (zona para globos de diálogo). Cada uno con su altura de suelo, para colocar a Sora, Kuro, el avatar y los Guardianes a escala.

2. REGLAS DE ESTILO (heredadas del elenco)
- Misma paleta: índigo #14123B y #241F5C, violeta #8A5CFF, cian #2EE6D6, oro #FFC83D, coral #FF6B6B, luna #F4F2FF.
- Perspectiva atmosférica: el fondo sin contorno y con menos contraste; el plano medio con contorno suave; solo el primer plano lleva el contorno índigo de 3,5 px del elenco.
- Los personajes tienen contorno fuerte, así que los fondos nunca son más contrastados que ellos. Detrás de la zona de los personajes, un halo de luz suave.
- Formas: redondeadas y cálidas en el Gremio; anguladas en mazmorras y arena.
- Luz principal arriba a la izquierda, luz de borde cian a la derecha.
- Apto para niños: nada de sangre, calaveras ni ruinas amenazantes.
- Ligero: cada escenario menos de 150 KB, sin filtros pesados ni más de 3 desenfoques.

3. ANIMACIONES AMBIENTALES (bucle, sin JavaScript)
Cada escenario tiene al menos: partículas flotando, un elemento que respira (luz, llama o cristal), un elemento que se mece (estandartes, cadenas, cintas) y un acento que late (runas). Duraciones entre 3 y 12 s, desfasadas entre sí.
Interacción (con un poco de JavaScript en la pestaña): pasar el puntero resalta el elemento interactivo; pulsar un portal ejecuta la transición «entrar» (el portal se agranda, la escena se aclara y se funde).

4. LOS TRES ESCENARIOS

A) EL GREMIO (hub y pantalla principal)
- Gran sala circular de piedra cálida, techo con ventanal redondo por donde baja luz dorada y cian.
- Fondo: arcos altos, ventanales con vitrales en cian y violeta, cielo nocturno con estrellas.
- Medio: mesa de misiones con un pergamino brillante, tablón de rangos con las seis insignias (E a S), estandartes índigo con el emblema del umbral (arco con chispa), cristales flotantes.
- Frente: columnas redondeadas a los lados, hojas de libros en el suelo, una alfombra con el emblema, antorchas con llama cian.
- Variantes: «día» (luz dorada) y «noche» (luz cian) con un solo interruptor.
- Slots: guía (Sora) a la derecha, compañero (Kuro) cerca del jugador, jugador al centro-izquierda.

B) SALA DE PORTALES (catálogo de cursos)
- Corredor con arcos que se alejan en perspectiva, suelo reflectante con runas.
- Seis portales (anillos de piedra con runas) con un hueco central luminoso, cada uno de un color de elemento: luz (oro), sombra (violeta), fuego (coral), agua (cian), naturaleza (verde apagado), éter (magenta).
- Un portal central grande y gris «bloqueado» para el próximo curso.
- Cada portal tiene tres estados: bloqueado (gris con cadena de luz), disponible (brilla y respira) y completado (sello dorado).
- Portales como elementos separados con id esc_portal_<n>, para conectarlos luego a la lista de cursos.
- Slots: jugador al frente, guía al lado.

C) ARENA DEL GUARDIÁN (evaluaciones)
- Plataforma circular flotante en el vacío, runas en el suelo que se encienden por fases.
- Fondo: vacío violeta con estrellas, restos de islas flotantes, un portal enorme detrás del jefe.
- Medio: anillos de runas que giran, columnas rotas con cristales.
- Frente: bordes angulosos de la plataforma, esquirlas flotando.
- Estados: calma, combate (runas coral) y victoria (plataforma dorada, lluvia de luz).
- Slots: jugador a la izquierda, jefe a la derecha en escala grande (usa a Petrox como referencia de tamaño).

5. QUÉ ENTREGAR EN LA PESTAÑA
- Escenario grande con el selector de escenario y los interruptores de capa (fondo, medio, frente, partículas).
- Control de intensidad del parallax y botón «ver con personajes» que coloca a Sora, Kuro, Aria y a Petrox (reutiliza sus SVG) para comprobar escala y contraste.
- Estados: día/noche (Gremio), portal bloqueado/disponible/completado (Sala), calma/combate/victoria (Arena).
- Tabla «Cuándo usar cada escenario» (momento en la app, qué muestra, estados).
- Guía de estilo con 6 reglas propias, paleta aplicada con HEX y lista de capas con sus ids.
- Exportación: SVG compuesto por escenario y una capa por archivo (zip), además de la versión recortada vertical.
- Bloque «Uso en la web»: cómo apilar las capas con CSS para el parallax y cómo cambiar el estado con data-*.

6. COMPROBACIONES ANTES DE ENTREGAR
- Renderiza cada escenario en tres anchos (360, 768 y 1280) y revisa que la zona segura se mantiene.
- Verifica el contraste del fondo detrás de los personajes y del texto de los globos.
- Revisa que con «reducir movimiento» no haya ninguna animación.
- Muéstrame capturas del resultado antes de seguir con la siguiente tanda.
```

---

## Variante: prompts para un generador de imágenes

Úsala si quieres ilustraciones tipo concept art en lugar de SVG. Mismo bloque de estilo que `prompts-ilustracion.md`.

**Bloque de estilo de escenarios**
```
anime style environment background for a children's and teen educational game, clean cel-shading, soft atmospheric perspective, wide 16:9 composition, empty central space for characters, soft light behind the center, palette deep indigo #14123B, midnight purple #241F5C, portal cyan #2EE6D6, arcane violet #8A5CFF, solar gold #FFC83D, no characters, no text, no blood, no skulls
```

| Escenario | Prompt (añadir el bloque de estilo) |
|---|---|
| El Gremio | `grand circular guild hall of warm stone, round skylight with golden and cyan light, tall arches with stained glass windows, indigo banners with an arch-and-spark emblem, floating crystals, quest table with a glowing parchment, rank board with six badges, torches with cyan flames, welcoming and cozy` |
| Sala de Portales | `long hall with receding arches, reflective floor with glowing runes, six stone ring portals in a row each glowing a different color (gold, violet, coral, cyan, muted green, magenta), a large gray locked portal at the end, mysterious and inviting` |
| Arena del Guardián | `circular floating stone platform in a violet void with stars, glowing rune rings on the floor, giant portal in the background, broken floating islands, crystal shards, epic but not scary` |
| Mazmorra (variante fuego) | `angular dungeon corridor with warm coral lighting, torches, stone steps, floating embers, adventurous not scary` |
| Tienda y Arsenal | `cozy blacksmith workshop with an anvil, glowing display cases of magical items, warm orange light with cyan accents` |
| Archivo de Crónicas | `endless library with floating books, spiral stairs, golden dust particles, constellations on the ceiling` |
| Terraza del Hogar | `calm balcony at sunset overlooking the guild, warm golden light, soft clouds, cozy plants` |

**Negative prompt:** `characters, people, text, watermark, logo, gore, skulls, horror, photorealistic, 3d render, blurry, cropped, extremely dark`

---

## Orden de escenarios siguientes

1. Mazmorra (3 variantes de color según el elemento del portal).
2. Tienda y Arsenal.
3. Archivo de Crónicas.
4. Terraza del Hogar (panel de padres).

Para cada una, pega el prompt principal y sustituye la sección 4 por la nueva descripción.
