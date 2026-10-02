# Plan para los siguientes personajes (v0.1)

Continúa la etapa del elenco. Ya están animados **Sora, Kuro, Aria y Leo** (artefacto "Elenco del gremio", ilustración vectorial en SVG + animaciones CSS, con capas nombradas para Rive/Spine). Este documento resume las reglas que ya funcionan, define el orden de producción y deja un brief listo para pegar por cada personaje nuevo.

---

## 1. Técnica ya validada (se mantiene)

- **Formato:** un `<svg>` inline por personaje con grupos por parte + `@keyframes` CSS. Cada personaje usa un prefijo propio para no chocar: `k_` Kuro, `s_` Sora, `a_` Aria/Leo. **Nuevos:** `e_` Eon, `b_` Brann, `r_` Kael.
- **Capas:** `personaje_parte_variante` (ej. `sora_brazo_izq_alzado`). Efectos con `_fx_`. Boca en 4–5 formas + visemas A/E/O/M.
- **Ficha por personaje:** escena de demostración, expresiones base, tabla "Cuándo usar cada animación" (momento en la app, qué hace, duración), reglas de estilo, paleta aplicada con HEX, lista de capas.

## 2. Reglas heredadas (todo personaje nuevo las cumple)

| Regla | Valor |
|---|---|
| Contorno | Índigo casi negro `#0E0C2B`, 3,5 px |
| Luz | Principal arriba a la izquierda; sombra con borde definido; **luz de borde cian en el lado derecho** |
| Ojos | Iris con degradado, pupila grande, **3 brillos** (uno grande arriba, dos pequeños abajo) |
| Proporción humana | ~5 cabezas (cabeza ≈ 20 % del alto); manos simplificadas, 4 dedos solo si está abierta |
| Emblema del gremio | Medallón con gema cian y ribete dorado (collar de Kuro, fajín de Sora). Dorado = acento del gremio |
| Movimiento | Entradas con rebote suave, salidas rápidas; **toda reacción < 3 s**; reposo en bucle de 3,6–4 s |
| Tono | Nunca regañar; el error se acompaña con ánimo |
| Interacción | Sigue el cursor con la mirada; al tocarlo, celebra; tras 30 s sin actividad, se duerme o se aburre |
| Accesibilidad | Opción "reducir movimiento"; sin destellos de más de 3 por segundo |
| Paleta base | Índigo `#14123B`/`#2B2670`, cian `#2EE6D6`, violeta `#8A5CFF`, oro `#FFC83D`, coral `#FF6B6B`, luna `#F4F2FF` |

**Ritmo por personalidad** (para que no se muevan todos igual): Kuro 3,6 s y nervioso · Sora 4 s y pausado · Eon 5 s y solemne · Brann 3,2 s y enérgica · Kael 3 s y vivaz.

## 3. Orden de producción recomendado

| Orden | Entrega | Por qué en este orden |
|---|---|---|
| 1 | **Archivista Eon** | Narra las Crónicas; hace falta pronto para el storytelling |
| 2 | **Forjadora Brann** | Necesaria para tienda y objetos |
| 3 | **Kael** (rival) | Da vida a rankings y duelos |
| 4 | **Maestro y Maestra del Gremio** (docentes, 4 variantes) | Reutilizan el esqueleto de Sora |
| 5 | **Guardianes del Hogar** (familias, 4 variantes) | Reutilizan el esqueleto de Sora |
| 6 | **6 avatares restantes**: Mei, Kai, Zuri, Dani, Tomás, Nuri | Reutilizan el esqueleto de Aria/Leo; solo cambian capas |
| 7 | **Kuro etapas 2 y 3** (joven, majestuoso) | Misma estructura, se amplía |
| 8 | **Enemigos menores**: Slime Confuso, Duende Enredador, Sombrita, Cofre Mímico | Antes de los jefes, para probar los combates |
| 9 | **Guardianes de curso** | Cuando se definan los cursos (plantilla §4.4 de la biblia) |

Los pasos 4 a 6 son rápidos porque se reutiliza un esqueleto: se cambian capas de cabello, ropa y accesorios, no las animaciones.

---

## 4. Plantilla maestra (pegar en Claude para cada personaje nuevo)

```
Continúa el artefacto "Elenco del gremio" añadiendo a [PERSONAJE].

Léelo primero y respeta su técnica: SVG inline + @keyframes CSS, prefijo de clases "[prefijo]_", contorno #0E0C2B de 3,5 px, luz arriba-izquierda, luz de borde cian a la derecha, ojos con 3 brillos, emblema del gremio (medallón con gema cian y ribete dorado), reacciones de menos de 3 s.

Personaje: [descripción de la biblia + datos del brief].
Proporción: [..]. Rasgo de identidad: [..]. Ritmo: [..].
Animaciones (con duración): [lista del brief].
Expresiones base: [4].
Paleta con HEX: [lista].
Capas con nombres: [lista].

Entrega: la escena interactiva (sigue la mirada, al tocarlo celebra, a los 30 s [se duerme/aburre]), la tabla "Cuándo usar cada animación", la guía de estilo con 4 reglas propias, la paleta aplicada y la lista de capas para Rive/Spine. Mantén el mismo diseño de página que Kuro y Sora.
```

---

## 5. Briefs listos

### 5.1 Archivista Eon — Narrador de Crónicas (prefijo `e_`)

- **Rol:** voz del storytelling; presenta cada Crónica y proyecta escenas.
- **Aspecto:** anciano de estatura media, ~5 cabezas, ligeramente encorvado. Barba larga y plateada con **pequeñas constelaciones brillantes**; cejas pobladas expresivas; lentes de media luna. Túnica larga azul medianoche con estrellas doradas bordadas, esclavina con el emblema del gremio, 3 o 4 **libros pequeños que flotan** a su alrededor, pluma-estilete en la mano.
- **Rasgo de identidad:** barba con constelaciones + libros flotantes.
- **Ritmo:** 5 s, solemne; gestos amplios, casi teatrales.
- **Animaciones:**

| Animación | Qué hace | Duración |
|---|---|---|
| Reposo | Respira, la barba se mece, los libros orbitan, las constelaciones titilan | bucle 5 s |
| Hablar | Boca sincronizada, mano con pluma que dirige el ritmo, cejas expresivas | según texto |
| Saludar | Inclina el torso con una reverencia breve | 2,4 s |
| Señalar | La pluma apunta y un libro se abre en esa dirección | 2,6 s |
| Pensar | Se acaricia la barba y mira hacia arriba | 3 s o bucle |
| Alerta | Cejas arriba, un libro cae al suelo con chispas | 2,2 s |
| Celebrar | Aplaude con los libros girando en espiral | 2,4 s |
| Dar ánimo | Asiente, un libro le muestra una página con un corazón | 2,8 s |
| **Crónica viva** (especial) | Abre un libro grande y proyecta una escena en luz cian sobre él | 3 s, saltable |
| Dormir | Cabeza hacia abajo sobre un libro, zetas | bucle |

- **Expresiones:** Narrando, Sonriente, Asombrado, Pensativo.
- **Paleta:** túnica `#241F5C` · sombra `#14123B` · barba `#E8E6FA` · constelaciones `#2EE6D6` · bordados y gafas `#FFC83D` · libros `#8A5CFF` y `#FF6B6B` · piel `#C99A74` · ojos `#5B3A29`.
- **Capas:** `eon_barba`, `eon_constelaciones`, `eon_cejas`, `eon_cara`, `eon_ojo_izq`, `eon_ojo_der`, `eon_ojos_cerrados`, `eon_lentes`, `eon_boca_x4`, `eon_visemas_a_e_o_m`, `eon_sombrero` (opcional), `eon_tunica`, `eon_esclavina`, `eon_fajin`, `eon_brazo_der`, `eon_brazo_izq_reposo`, `eon_brazo_izq_alzado`, `eon_pluma`, `eon_libro_1..4`, `eon_libro_grande`, `eon_fx_escena`, `eon_fx_idea`, `eon_fx_alerta`, `eon_fx_corazon`, `eon_fx_zzz`.
- **Cuidado:** la barba cubre la boca; hay que dibujar los visemas **encima** de la barba y mover la barba junto con la mandíbula.

### 5.2 Forjadora Brann — Tienda y Arsenal (prefijo `b_`)

- **Rol:** canje de monedas por objetos, mejoras y cosméticos.
- **Aspecto:** mujer robusta y fuerte, ~5 cabezas, hombros anchos; cabello castaño recogido en un moño con un lápiz; gafas protectoras subidas a la frente; delantal de cuero sobre blusa corta; guantes; martillo con runas; **lentes de aumento** en el monóculo.
- **Rasgo de identidad:** gafas protectoras en la frente + martillo con runas cian.
- **Ritmo:** 3,2 s, enérgica y práctica; golpea el pie, balancea el martillo.
- **Animaciones:**

| Animación | Qué hace | Duración |
|---|---|---|
| Reposo | Respira, apoya el martillo en el hombro, mueve el pie, chispas del yunque al fondo | bucle 3,2 s |
| Hablar | Boca sincronizada, gesto con el martillo | según texto |
| Saludar | Levanta el martillo y guiña | 2 s |
| **Mostrar objeto** | Saca un objeto de la mesa y lo muestra con brillo | 2,6 s |
| **Aprobar compra** | Pulgar arriba y el objeto vuela al inventario | 2,2 s |
| **Rechazar con cariño** | Niega con el dedo, sonrisa, señala el precio | 2,4 s |
| Pensar | Se rasca la cabeza y mira el inventario | 3 s |
| Celebrar | Golpea el yunque; lluvia de chispas doradas | 2,2 s |
| Dar ánimo | Palmada en el hombro (hacia el jugador) | 2,6 s |
| **Forja legendaria** (especial) | Martillazo, chispas, aparece un objeto dorado | 3 s |
| Aburrirse | Se apoya en el yunque, se limpia las manos | bucle |

- **Expresiones:** Amable, Orgullosa, Sorprendida, Pícara.
- **Paleta:** piel `#8D5A3B` · cabello `#4A2C1E` · delantal `#7A4A2B` · blusa `#F4F2FF` · guantes `#3A2B24` · martillo `#9AA0B4` + runas `#2EE6D6` · hebillas `#FFC83D` · chispas `#FF6B6B`/`#FFC83D`.
- **Capas:** `brann_cabello_atras`, `brann_mono`, `brann_lapiz`, `brann_cara`, `brann_ojo_izq`, `brann_ojo_der`, `brann_ojos_felices`, `brann_cejas`, `brann_boca_x4`, `brann_visemas_a_e_o_m`, `brann_gafas_frente`, `brann_monoculo`, `brann_cuello`, `brann_blusa`, `brann_delantal`, `brann_cinturon`, `brann_falda`, `brann_botas`, `brann_brazo_der_martillo`, `brann_brazo_izq_reposo`, `brann_brazo_izq_mostrando`, `brann_brazo_izq_pulgar`, `brann_martillo`, `brann_yunque`, `brann_objeto_demo`, `brann_fx_chispas`, `brann_fx_brillo`, `brann_fx_idea`, `brann_fx_corazon`.
- **Cuidado:** el martillo es un arma estilizada (nunca se usa contra criaturas ni personas).

### 5.3 Kael — Rival amistoso (prefijo `r_`)

- **Rol:** reta al jugador a superar su puntaje; aparece en rankings y duelos de práctica; con el tiempo se vuelve aliado.
- **Aspecto:** adolescente, ~5 cabezas, delgado y ágil; cabello rojo despeinado hacia atrás; sonrisa confiada con un colmillo; capa corta roja y negra; **espada de luz estilizada** (hoja de energía cian-coral, sin filo realista); guante en una sola mano.
- **Rasgo de identidad:** cabello rojo en punta + sonrisa de lado.
- **Ritmo:** 3 s, vivaz; se mueve siempre, nunca queda quieto del todo.
- **Animaciones:**

| Animación | Qué hace | Duración |
|---|---|---|
| Reposo | Brazos cruzados, rebota sobre los pies, la capa ondea | bucle 3 s |
| Hablar | Boca sincronizada, mano en la cadera, cabeza que se ladea | según texto |
| Saludar | Dos dedos a la frente con guiño | 1,8 s |
| **Desafío** | Señala al jugador y enciende la espada | 2,4 s |
| **Asombro por la derrota** | Ojos grandes, cae la mandíbula, la espada se apaga | 2,2 s |
| **Apretón de manos** | Extiende la mano con una sonrisa sincera | 2,4 s |
| Pensar | Se rasca la nuca | 2,6 s |
| Celebrar | Salto con puño en alto y destello coral | 2,2 s |
| Dar ánimo | "¡Otra vez!", palmada al aire | 2,4 s |
| **Duelo** (especial) | Pose de reto con ráfaga de energía | 3 s |
| Aburrirse | Silba y balancea la espada | bucle |

- **Expresiones:** Confiado, Sonriente, Sorprendido, Frustrado (leve, nunca amenazante).
- **Paleta:** cabello `#E0453A` · capa `#FF6B6B` y `#14123B` · ropa `#2B2670` · espada `#2EE6D6` con núcleo `#F4F2FF` · piel `#E8B890` · ojos `#2E7D6B` · detalles `#FFC83D`.
- **Capas:** `kael_cabello_atras`, `kael_cabello_frente`, `kael_cara`, `kael_ojo_izq`, `kael_ojo_der`, `kael_ojos_felices`, `kael_cejas`, `kael_boca_x4`, `kael_visemas_a_e_o_m`, `kael_cuello`, `kael_torso`, `kael_capa`, `kael_cinturon`, `kael_pantalon`, `kael_botas`, `kael_brazo_der_cruzado`, `kael_brazo_izq_cruzado`, `kael_brazo_izq_cadera`, `kael_brazo_der_senalando`, `kael_brazo_der_mano_abierta`, `kael_espada`, `kael_fx_hoja`, `kael_fx_rafaga`, `kael_fx_exclamacion`, `kael_fx_idea`.

---

## 6. Variantes por esqueleto (pasos 4 a 6)

| Grupo | Esqueleto | Qué cambia |
|---|---|---|
| **Maestros del Gremio** (4) | Sora | Cabello, rostro, túnica azul-índigo con emblema, báculo o libro en lugar del cristal. Hay que mantener ropa sobria |
| **Guardianes del Hogar** (4) | Sora | Capa verde con escudo en lugar de la túnica; accesorio de cuidado (farol, libro de cuentos) |
| **Mei** | Aria | Dos trenzas, gafas redondas, libreta brillante |
| **Kai** | Leo | Rubio despeinado, capa corta, guantes de energía |
| **Zuri** | Aria | Cabello afro con cintas, falda-armadura ligera, cinta de luz |
| **Dani** | Leo | Neutro/andrógino, cabello medio, abrigo largo, broche en forma de umbral |
| **Tomás** | Leo | **Silla de ruedas con ruedas de energía**; animación "caminar" se sustituye por "rodar". Exige re-rigging de las piernas |
| **Nuri** | Aria | Audífonos / implante estilizado, bastón de runas. La animación "hablar" se acompaña con lengua de señas básica opcional |

> **Tomás y Nuri** son quienes más cambian el esqueleto. Conviene hacerlos con cuidado (consultar con personas con esa experiencia si es posible) y no dejarlos para el final.

## 7. Cómo seguimos

1. Pega la plantilla de §4 con el brief de Eon y revisamos el resultado.
2. Ajustamos las reglas de la sección 2 con lo que aprendamos.
3. Repetimos con Brann y Kael.
4. Cuando haya 3 personajes nuevos, armamos el **directorio unificado** del elenco en un solo artefacto.
