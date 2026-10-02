# Prompts de ilustración — Sora, Kuro, Aria y Leo (v0.1)

Complementa `biblia-de-personajes.md` (etapa B). Los prompts están en **inglés** porque los generadores de imágenes (Midjourney, Leonardo, Firefly, DALL·E, Stable Diffusion/Flux, etc.) responden mejor así. Las notas están en español.

---

## 1. Cómo usar este documento

1. Pega el **BLOQUE DE ESTILO** (§2) al final de cada prompt de personaje. Así todo el elenco se ve del mismo mundo.
2. Genera primero la **hoja de modelo** (model sheet) de cada personaje (§3 a §6) y elige una versión.
3. Con esa imagen elegida como **referencia** (`--cref` / `--oref` en Midjourney, "Character Reference" en Leonardo, "Reference image" en Firefly), genera expresiones y poses (§7).
4. Para animar con Rive/Spine hay que separar el personaje por capas; ver §8.
5. Regla de oro: **cambia una cosa a la vez** al iterar. Si cambias todo, pierdes la consistencia.

> **Antes de publicar:** revisa los términos de uso comercial del generador elegido y conserva tus prompts y versiones como evidencia de autoría.

---

## 2. Bloques reutilizables

### 2.1 BLOQUE DE ESTILO (añadir a todo prompt)

```
anime style character design, clean cel-shading with two-tone shadows, crisp confident line art, vibrant saturated colors, soft rim light in cyan, friendly and heroic mood suitable for children and teenagers, high readability silhouette, original character, flat neutral light-gray background, full body, no text
```

### 2.2 PALETA (referencia para todo prompt)

```
color palette: deep indigo #14123B, midnight purple #241F5C, portal cyan #2EE6D6, arcane violet #8A5CFF, solar gold #FFC83D, vital coral #FF6B6B, moon white #F4F2FF
```

### 2.3 BLOQUE DE HOJA DE MODELO

```
character model sheet, turnaround: front view, three-quarter view, side view and back view, same character in the same neutral standing pose, consistent proportions and details across all views, plain background, evenly spaced
```

### 2.4 NEGATIVE PROMPT (en generadores que lo admiten)

```
blood, gore, realistic weapons, guns, sexualized, revealing clothing, scary, creepy, photorealistic, 3d render, extra fingers, deformed hands, extra limbs, text, watermark, logo, signature, blurry, low quality, inconsistent outfit between views, cropped
```

En Midjourney se escribe con `--no blood, gore, guns, sexualized, photorealistic, extra fingers, text, watermark, cropped`.

---

## 3. SORA — Maestra del Gremio

**Datos de diseño:** mujer adulta joven (~28 años), cabello plateado largo con un mechón cian, túnica blanca-índigo con bordes dorados, báculo con cristal-portal. Serena, cálida, alentadora. Proporción ~7 cabezas.

### 3.1 Hoja de modelo

```
Sora, a serene and kind young adult woman guild mentor, about 28 years old, long straight silver hair with one bright cyan lock in front, warm brown eyes with a gentle encouraging smile, wearing a long white and deep indigo ceremonial tunic with gold trim and embroidered portal-arch rune patterns, a short cyan cape on one shoulder, soft leather boots, holding a tall wooden staff topped with a floating glowing cyan crystal shaped like a small portal ring, 7-head tall proportions, dignified but approachable, [BLOQUE DE HOJA DE MODELO], [BLOQUE DE ESTILO], [PALETA]
```

### 3.2 Pose de presentación (hero pose)

```
Sora welcoming a visitor, one hand open toward the viewer in a friendly gesture, the other holding her staff, slight smile, gentle wind moving her hair and cape, a few cyan sparkles around the crystal, [BLOQUE DE ESTILO]
```

### 3.3 Variaciones útiles
- **Versión inclusiva/alternativa de piel:** cambia a `warm medium-brown skin` y mantén el resto; así podrás ofrecer variantes si el equipo lo desea. Mantén siempre silueta, mechón cian y báculo como rasgos de reconocimiento.
- **Primer plano para retrato de diálogo:** `bust portrait of Sora, front view, gentle smile, looking at viewer, [BLOQUE DE ESTILO]`

---

## 4. KURO — Compañero (lobo-dragón)

**Datos de diseño:** pequeño lobo-dragón, pelaje índigo, ojos cian grandes, cola con punta de fuego violeta, orejas grandes expresivas. Etapas: cachorro → joven → majestuoso. Proporción ~3 cabezas en etapa 1 (tipo "chibi").

### 4.1 Etapa 1 — Cachorro (hoja de modelo)

```
Kuro, an adorable baby wolf-dragon companion creature, deep indigo fur with a lighter midnight-purple belly, large expressive pointed ears with cyan inner glow, big round bright cyan eyes, tiny stubby wings folded on its back, small rounded horns, fluffy tail that ends in a gentle violet flame, small paws with golden claws, chibi proportions about 3 heads tall, playful and loyal personality, cute not scary, [BLOQUE DE HOJA DE MODELO], [BLOQUE DE ESTILO], [PALETA]
```

### 4.2 Etapa 2 — Joven (rango C–B)

```
Kuro as a young wolf-dragon, same face and markings as the baby version, taller and athletic, wings now open and larger with violet membranes, ears longer, small cyan rune markings glowing along the shoulders, tail flame bigger and brighter violet, confident posture but still friendly eyes, [BLOQUE DE HOJA DE MODELO], [BLOQUE DE ESTILO], [PALETA]
```

### 4.3 Etapa 3 — Majestuoso (rango A–S)

```
Kuro as a majestic grown wolf-dragon guardian, same face and markings as previous versions, large and noble, deep indigo fur with glowing golden constellation patterns, large spread wings with luminous violet and gold membranes, elegant curved horns, long tail with a radiant violet and gold flame, warm wise cyan eyes, heroic yet kind expression, [BLOQUE DE HOJA DE MODELO], [BLOQUE DE ESTILO], [PALETA]
```

> **Consistencia:** en las etapas 2 y 3 usa como referencia la imagen del cachorro y pide "same face and markings". Conservar ojos cian y punta de cola violeta es lo que hará reconocible a Kuro.

---

## 5. ARIA — Avatar base 1

**Datos de diseño:** chica adolescente (~14–15 años), cabello corto azul, chaqueta con capucha, pulsera cian. Proporción ~6 cabezas. Rango E: ropa de aprendiz, sin aura.

### 5.1 Hoja de modelo (rango E)

```
Aria, a cheerful determined teenage girl apprentice adventurer, about 14 years old, short bob haircut in bright blue with a slightly messy fringe, large hazel eyes, light brown skin, wearing a simple indigo hooded jacket with the hood down, a plain white shirt, dark practical leggings, sturdy sneakers-style boots, a glowing cyan bracelet on her left wrist shaped like a tiny portal ring, small cross-body satchel, optimistic curious expression, 6-head tall proportions, beginner rank look with no armor and no aura, [BLOQUE DE HOJA DE MODELO], [BLOQUE DE ESTILO], [PALETA]
```

### 5.2 Evolución por rango (usar la imagen de 5.1 como referencia)

| Rango | Prompt (añadir tras "same character as reference, same face and hair") |
|---|---|
| D | `adds a short green-trimmed cape and small green accents on the jacket, light sparkles around her` |
| C | `light armor pieces over the jacket, cyan glowing runes on the shoulder plates, soft cyan aura` |
| B | `longer cape, shoulder guards, violet rune lines on the armor, violet aura with floating particles` |
| A | `ornate armor with coral red details, small energy wings made of light behind her, strong coral aura` |
| S | `legendary golden armor, floating crown of light above her head, radiant golden aura and a golden shadow companion behind her` |

Ejemplo completo (rango C):
```
same character as reference image, Aria, same face and short blue hair, rank C look: light silver and indigo armor pieces over her hooded jacket, glowing cyan runes on shoulder plates, soft cyan aura, confident pose, [BLOQUE DE HOJA DE MODELO], [BLOQUE DE ESTILO]
```

---

## 6. LEO — Avatar base 2

**Datos de diseño:** chico adolescente (~14–15 años), cabello oscuro rizado, bufanda, bolsa de pergaminos. Proporción ~6 cabezas. Rango E.

### 6.1 Hoja de modelo (rango E)

```
Leo, a friendly curious teenage boy apprentice adventurer, about 14 years old, short dark curly hair, dark brown skin, warm dark eyes, wide cheerful smile, wearing a long soft violet scarf, a simple sleeveless-vest over a long-sleeve cream shirt, dark brown trousers with a cloth belt, worn adventurer boots, a leather bag full of rolled scrolls hanging at his hip, a small gold pendant shaped like a portal arch, energetic and kind expression, 6-head tall proportions, beginner rank look with no armor and no aura, [BLOQUE DE HOJA DE MODELO], [BLOQUE DE ESTILO], [PALETA]
```

### 6.2 Evolución por rango (usar la imagen de 6.1 como referencia)

| Rango | Prompt (añadir tras "same character as reference, same face and hair") |
|---|---|
| D | `adds green trim on the vest and a small scroll-case with a green gem, light sparkles` |
| C | `lightweight leather armor with cyan rune lines, scarf glowing softly at the edges, soft cyan aura` |
| B | `reinforced coat with shoulder guards, violet runes, violet aura with floating scroll pages` |
| A | `ornate armor with coral red details, scarf turned into flowing energy, strong coral aura` |
| S | `legendary golden armor, glowing golden scarf, floating crown of light, radiant golden aura and golden shadow companion` |

---

## 7. Expresiones y poses (para los 4 personajes)

Usa la hoja de modelo elegida como referencia de personaje y sustituye `[NOMBRE]` por Sora, Kuro, Aria o Leo.

### 7.1 Hoja de 6 expresiones

```
[NOMBRE], same character as reference image, expression sheet with six head-and-shoulders portraits in a 3x2 grid: neutral, happy, sad, surprised, angry (mild, not scary), thoughtful, consistent face and hair, [BLOQUE DE ESTILO]
```

### 7.2 Hoja de poses clave (mapea a las animaciones del §7 de la biblia)

```
[NOMBRE], same character as reference image, pose sheet with five full-body poses in a row: standing relaxed, talking with an expressive hand gesture, celebrating with arms raised and golden sparkles, running, defeated kneeling but starting to get back up, consistent proportions, [BLOQUE DE ESTILO]
```

### 7.3 Poses individuales por animación

| Animación | Fragmento de prompt |
|---|---|
| Reposo | `relaxed standing pose, slight smile, weight on one leg` |
| Hablar | `mid-sentence, mouth open, one hand gesturing, friendly eyes` |
| Levantar la mano | `raising one hand high as if asking to answer, eager expression` |
| Caminar | `mid-stride walking pose, side view, natural arm swing` |
| Celebrar | `jumping with both fists in the air, big smile, golden confetti sparkles` |
| Asombro | `wide eyes, mouth open, leaning back, small exclamation mark floating above head` |
| Derrota | `kneeling on one knee, head down, one hand on the ground, determined glimmer in the eyes` |
| Activar poder | `hands forward channeling energy, glowing cyan circle at the palms, hair and clothes lifting in the wind` |
| Especial | ver §7 de la biblia (ej.: Aria/Leo = transformación de rango; Sora = traza un portal; Kuro = evolución) |

> **Kuro:** adapta los fragmentos a cuadrúpedo (ej. `crouching play-bow pose with tail up`, `howling with head raised`, `tilting head curiously`).

---

## 8. Preparación para animación por capas (Rive / Spine)

Los generadores no entregan capas separadas de forma fiable. Dos caminos:

**Camino A (recomendado):**
1. Genera el personaje en **pose neutra A/T** con los brazos separados del cuerpo para facilitar el recorte.
2. Recorta en un editor (Photoshop, Krita, Figma o Photopea) en capas: cabeza, cabello delantero/trasero, ojos (abiertos/cerrados), cejas, boca (6 visemas), torso, brazo y antebrazo y mano (izq./der.), piernas, calzado, capa, accesorios.
3. Rellena con pintura las zonas ocultas (cuello bajo el cabello, torso bajo los brazos).
4. Nombra las capas con el estándar: `aria_cabello_frente`, `aria_brazo_der`, etc.

**Camino B:** pedir las partes ya separadas en el generador:

```
[NOMBRE], character in a neutral A-pose with arms slightly away from the body, no overlapping limbs, hands open, clear gaps between arms and torso, easy to cut into layers for 2D rigging, front view, [BLOQUE DE ESTILO]
```

Después se rehacen las zonas ocultas a mano.

**Hojas de boca (visemas) para "hablar":**

```
[NOMBRE], close-up of the mouth shape set, six mouth positions in a row for lip sync: closed, A, E, O, U, M/B/P, consistent style, [BLOQUE DE ESTILO]
```

---

## 9. Checklist de aprobación de cada personaje

- [ ] La silueta se reconoce en sombra negra.
- [ ] Mantiene sus 2–3 rasgos de identidad en todas las vistas.
- [ ] Usa solo colores de la paleta oficial (tolerancia de tono leve).
- [ ] Manos y proporciones sin errores.
- [ ] Sin elementos violentos ni sexualizados; apto para niños.
- [ ] Hoja de modelo, 6 expresiones y 5 poses completas.
- [ ] Prompts finales y versión elegida guardados en el repositorio (`/assets/personajes/<nombre>/`).

---

## 10. Registro de versiones (llenar al generar)

| Personaje | Herramienta | Fecha | Semilla / ID | Archivo elegido | Notas |
|---|---|---|---|---|---|
| Sora | | | | | |
| Kuro (cachorro) | | | | | |
| Aria (E) | | | | | |
| Leo (E) | | | | | |
