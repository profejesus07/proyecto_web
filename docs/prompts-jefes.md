# Prompts de ilustración — Los ocho Guardianes (jefes de mazmorra) v0.1

Complementa `biblia-de-personajes.md` (§4) y `prompts-ilustracion.md` (mismos bloques de estilo y paleta). Prompts en **inglés** para el generador; notas en español.

---

## 1. Cómo usarlo

1. Pega el **BLOQUE DE ESTILO DE JEFES** (§2.1) y la **PALETA** (§2.2) al final de cada prompt.
2. Genera primero la **hoja de modelo** de cada Guardián (§3). Elige una versión.
3. Usa esa imagen como **referencia de personaje** (`--cref`/`--oref` en Midjourney, "Character Reference" en Leonardo, "Reference image" en Firefly) para la fase de furia, la forma purificada y las poses (§4).
4. Cambia **una cosa a la vez** al iterar.
5. Genera todos en el mismo lote y con la misma herramienta, para que compartan el trazo.

---

## 2. Bloques reutilizables

### 2.1 BLOQUE DE ESTILO DE JEFES

```
anime style boss creature design for a children's and teen educational game, clean cel-shading with two-tone shadows, thick dark indigo outline (#0E0C2B), crisp line art, angular silhouette with pointed shapes, mischievous or solemn but never scary, big readable shapes, glowing eyes, soft cyan rim light on the right side, no blood, no gore, no realistic weapons, original creature, flat neutral gray background, full body, front view, no text
```

### 2.2 PALETA

```
color palette: deep indigo #14123B, midnight purple #241F5C, portal cyan #2EE6D6, arcane violet #8A5CFF, solar gold #FFC83D, vital coral #FF6B6B, moon white #F4F2FF
```

### 2.3 HOJA DE MODELO

```
creature model sheet turnaround: front view, three-quarter view, side view and back view, same creature in the same neutral idle pose, consistent proportions and details across all views, plain background, evenly spaced
```

### 2.4 NEGATIVE PROMPT

```
blood, gore, wounds, realistic weapons, guns, skulls, horror, creepy, grotesque, sexualized, photorealistic, 3d render, text, watermark, logo, signature, blurry, low quality, cropped, inconsistent design between views
```

Midjourney: `--no blood, gore, skulls, horror, photorealistic, text, watermark, cropped`

### 2.5 Reglas que todos los Guardianes cumplen (resumen)

- Silueta única: se reconoce en sombra negra.
- Ojos amarillo ácido `#E8F24A` en calma y coral `#FF5A5A` en furia (excepciones: Brumalis cian, Eclipsa luna blanca, Sandrael coral).
- Cuerpos oscuros; coral y amarillo solo para ojos y ataques. El verde de éxito no es color dominante.
- Tamaño grande, tono pícaro o solemne, nunca de terror.

---

## 3. Los ocho prompts (hoja de modelo)

### 3.1 PETROX — Golem de naturaleza · rango E

Idea: «es demasiado grande». Se vence dividiendo en pasos pequeños.

```
Petrox, a gentle giant stone golem guardian, body made of angular violet-gray stone blocks, broad shoulders, big blocky fists, short thick legs, a small block head with a stern V-shaped brow and square glowing acid-yellow eyes, muted moss green patches on the head and shoulders, a glowing golden arch-shaped rune on the chest, three small stone cubes floating around him, clumsy and tender personality, looks big but not mean, [HOJA DE MODELO], [ESTILO DE JEFES], [PALETA]
```

Fase 2 (furia): `same creature as reference, 7% bigger, cracks between the blocks glowing coral red, three separate stone block parts floating slightly apart, eyes coral red`

### 3.2 IGNARIS — Dracónido de fuego · rango D

Idea: miedo a empezar y a equivocarse. Se vence probando, errando y reintentando.

```
Ignaris, a young dragon guardian, deep coral-red scales with a cream-orange belly with horizontal plates, small bat wings in magenta-purple, short curved bone-colored horns, a mane of three violet flames on top of the head, wide muzzle with small teeth, acid-yellow slit-pupil eyes with a worried-but-proud brow, a tail ending in a violet flame, sitting upright, small claws, cute and a little scared, [HOJA DE MODELO], [ESTILO DE JEFES], [PALETA]
```

Fase 2: `same creature as reference, larger violet and coral flames on the head and shoulders, flames from the wing tips, eyes coral red, confident expression`

### 3.3 BRUMALIS — Espectro de sombra · rango C

Idea: el olvido. Se vence repasando y recordando.

```
Brumalis, a floating mist spirit guardian, a tall hooded tattered cloak made of deep violet fog with jagged torn hem and no legs, a white angular porcelain mask inside the hood with glowing cyan angled eye slits and a small zigzag mouth, long pale lavender clawed hands floating at its sides, small cloud wisps drifting around, small violet diamond emblem on the chest, mysterious and teasing, [HOJA DE MODELO], [ESTILO DE JEFES], [PALETA]
```

Fase 2: `same creature as reference, cloak breaking into separate wisps and shreds, mask slightly cracked, eyes coral red, more fog around`

Forma purificada: `a small friendly child made of warm golden light, same hood outline softened, smiling, floating`

### 3.4 MIRELLE — Coloso acuático · rango C

Idea: no saber expresarse. Se vence explicando con las propias palabras.

```
Mirelle, a giant jellyfish-cloud guardian, a large blue dome bell with fluffy light-blue cloud puffs on top, scalloped hem, five long luminous ribbon tentacles in cyan and pale blue, two almond acid-yellow eyes with a stern brow, a small dark mouth with a coral tongue, floating speech bubbles with letters around her, playful and chatty, [HOJA DE MODELO], [ESTILO DE JEFES], [PALETA]
```

Fase 2: `same creature as reference, darker stormy blue bell, tentacles tangled with many noisy letter bubbles, eyes coral red`

### 3.5 QUIMAX — Quimera de éter · rango B

Idea: ideas sueltas. Se vence conectando conceptos.

```
Quimax, a chimera guardian made of three animals: a lion body and face with ochre fur and a spiky violet-magenta mane, large round owl-like eyes in acid yellow with feathered brows, two big owl wings in navy blue with golden spots and curved feather lines, a long teal snake as a tail with a small snake head and a comet star at the tip, fangs showing, extravagant and proud, [HOJA DE MODELO], [ESTILO DE JEFES], [PALETA]
```

Fase 2: `same creature as reference, the three parts connected by glowing cyan threads of light, mane brighter violet, eyes coral red`

### 3.6 SANDRAEL — Bestia arcana de arena · rango B

Idea: la procrastinación. Se vence planificando y priorizando.

```
Sandrael, a mythical bird guardian made of golden sand, rounded angular body in gold with darker amber shadow, two large spread wings with pointed feathers, a round white clock face with golden hands embedded in the chest, a crested head with a sharp beak and coral red eyes, tail shaped like an hourglass with sand falling, small clock-shaped feathers, calm and teasing, [HOJA DE MODELO], [ESTILO DE JEFES], [PALETA]
```

Fase 2: `same creature as reference, clock face glowing, feathers turning into small clocks, sand streaming faster from the tail, wings wider`

### 3.7 ECLIPSA — Espectro de éter gris · rango A

Idea: la duda en uno mismo. Se vence reconociendo el propio progreso. Para los más pequeños se presenta como «el espejo que dice mentiras».

```
Eclipsa, a mysterious mirror spirit guardian, an ornate angular silver-gray mirror frame with pale glass, a faceless smooth gray humanoid figure emerging from the mirror, two glowing white crescent-moon shaped eyes and no mouth, long thin arms, floating glass shards around, soft violet ether glow on the edges, quiet and unsettling but gentle, never horror, [HOJA DE MODELO], [ESTILO DE JEFES], [PALETA]
```

Fase 2: `same creature as reference, two mirror reflections of the figure side by side facing each other, cracks in the glass, eyes coral red`

Forma purificada: `a warm golden mirror reflecting a smiling child silhouette with a star`

### 3.8 ZHAAL, EL VACÍO — Dracónido de sombra y luz · rango S · jefe final

Idea: todo lo anterior. Se vence dominando todas las habilidades.

```
Zhaal, the Void, a huge dark crystal dragon final boss guardian, body made of faceted deep indigo crystals with lighter violet facet edges, large angular crystal wings, long curved crystal horns, a glowing golden crack of light running across the chest and up the neck, solemn serious face with coral red eyes, a long crystal tail, imposing but majestic, not scary, [HOJA DE MODELO], [ESTILO DE JEFES], [PALETA]
```

Fase 2: `same creature as reference, extra crystal spikes on the back and wings, the golden crack wider and brighter`
Fase 3: `same creature as reference, a floating golden crown of light above the head, the crack open like a radiant doorway in the chest`
Forma purificada: `the dragon turned into transparent clear crystal full of golden light, peaceful expression`

---

## 4. Variantes para cada Guardián

Sustituye `[NOMBRE]` y usa la hoja de modelo elegida como referencia.

| Entrega | Prompt |
|---|---|
| Expresiones | `[NOMBRE], same creature as reference, expression sheet of six head close-ups in a 3x2 grid: neutral, taunting, angry (mild), surprised, defeated, purified and peaceful` |
| Poses de combate | `[NOMBRE], same creature as reference, pose sheet of five full-body poses: idle, appearing, attacking, hit and recoiling, special attack` |
| Forma purificada | usar el texto de cada Guardián; si no tiene, `[NOMBRE] transformed into a small friendly spirit of warm golden light, cute, floating, same silhouette softened` |
| Retrato de diálogo | `bust portrait of [NOMBRE], front view, looking at viewer, [ESTILO DE JEFES]` |

### Poses por animación

| Animación | Fragmento |
|---|---|
| Aparecer | `landing from above with squash, dust cloud, dramatic entrance` |
| Reposo | `idle pose, relaxed but imposing` |
| Provocar | `head tilted, smug expression, mocking gesture` |
| Atacar | `leaning back to charge, then lunging toward the viewer` |
| Especial | ver ficha de cada Guardián (aplastar bloques, llamarada, borrar pistas, burbujas, cola cometa, plumas-reloj, eco de dudas, rayo de la grieta) |
| Recibir golpe | `flash white, recoiling, hit star` |
| Furia | `fase 2 variant, larger, red eyes, glowing aura` |
| Purificación | `dissolving into golden light and sparkles` |

---

## 5. Preparación para animación por capas (Rive/Spine)

- Pide una versión en **pose neutra y simétrica** con brazos y alas separados del cuerpo:
  `[NOMBRE], neutral symmetrical pose, wings and arms slightly away from the body, no overlapping parts, easy to cut into layers for 2D rigging, front view, [ESTILO DE JEFES]`
- Recorta y nombra las capas con el estándar de la biblia (`petrox_brazo_izq`, `ignaris_ala_der`…).
- Las listas de capas de cada Guardián están en `plan-siguientes-personajes.md` y en la pestaña «Jefes» del artefacto.
- Estados de animación: `idle`, `appear`, `taunt`, `attack`, `special`, `hit`, `rage`, `defeat`.

---

## 6. Checklist de aprobación

- [ ] La silueta se reconoce en sombra negra y no se parece a la de otro Guardián.
- [ ] Cumple las reglas de §2.5 (ojos, colores, tono).
- [ ] Sin elementos violentos, aterradores ni sexualizados.
- [ ] Hoja de modelo, 6 expresiones, 5 poses de combate, fase 2 y forma purificada.
- [ ] Prompts finales y versión elegida guardados en `/assets/jefes/<nombre>/`.

## 7. Registro de versiones

| Guardián | Herramienta | Fecha | Semilla / ID | Archivo elegido | Notas |
|---|---|---|---|---|---|
| Petrox | | | | | |
| Ignaris | | | | | |
| Brumalis | | | | | |
| Mirelle | | | | | |
| Quimax | | | | | |
| Sandrael | | | | | |
| Eclipsa | | | | | |
| Zhaal | | | | | |
