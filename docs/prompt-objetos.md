# Prompt para crear objetos, poderes e insignias (v0.1)

Para pegar en la conversación donde vive el artefacto **«Elenco del gremio»**. Crea una pestaña nueva **«Objetos»** con el mismo diseño que el resto. Son tres tandas; en cada una se pega el **PROMPT PRINCIPAL** y se sustituye el bloque `TANDA`.

| Tanda | Contenido | Por qué en este orden |
|---|---|---|
| **A** | Poderes, objetos de ayuda, monedas y recursos, interfaz del juego, cofres | Es lo que necesita el primer bucle de juego |
| **B** | Recompensas de los 8 Guardianes, insignias, sellos de portal, marcos, certificado | Es lo que se gana y se muestra en el perfil |
| **C** | Equipo y cosméticos (probables sobre el avatar), armas, compañeros | Es la tienda; puede esperar a la segunda versión de la web |

---

## PROMPT PRINCIPAL

```
Continúa el artefacto «Elenco del gremio». Añade (o amplía, si ya existe) una pestaña llamada «Objetos» (id sec-objetos, prefijo de clases o_) con el catálogo ilustrado de lo que el estudiante gana, usa y equipa. Esta vez haz solo la TANDA indicada abajo.

PASO 0 — Lee el artefacto primero y respeta su técnica y diseño de página: SVG inline + @keyframes CSS, sin imágenes externas, mismos tokens de color y tipografías, escenario/vitrina arriba con panel de controles, tabla «Cuándo usar», guía de estilo, paleta aplicada, lista de ids y bloque «Uso en la web». Reutiliza el sistema de exportación SVG/zip de las pestañas «Jefes» y «Escenarios» (archivos sueltos + zip + LEEME).

1. FORMATO
- Cada objeto es un SVG de viewBox 256×256, centrado, con margen de 16 px, sin fondo (transparente).
- Cada objeto tiene tres estados: reposo (bucle suave), destacado (al pasar el puntero o al recibirlo: brilla y rebota) y bloqueado (silueta gris con candado, sin animación).
- Los poderes llevan además una animación de activación de 1,5 a 2 s sobre un lienzo de 640×480 para superponerla al avatar,, con ids poder_<nombre>_efecto.
- ids: obj_<categoria>_<nombre> (por ejemplo obj_ayuda_pista, obj_poder_rayo, obj_insignia_racha7, obj_cofre_epico).
- Cada objeto lleva datos en atributos data-*: data-id, data-nombre, data-categoria, data-rareza, data-precio, data-desbloqueo.

2. RAREZA (marco, brillo y partículas distintos)
- Común: gris piedra #9AA0B4, sin brillo.
- Poco común: verde brote #4ADE80, destello leve.
- Raro: cian portal #2EE6D6, brillo suave que respira.
- Épico: violeta arcano #8A5CFF, partículas que orbitan.
- Legendario: oro solar #FFC83D, rayos y corona de destellos.
La rareza se ve incluso en miniatura (32 px): el marco y el color deben leerse.

3. REGLAS DE ESTILO (heredadas del elenco)
- Misma paleta: índigo #14123B y #241F5C, violeta #8A5CFF, cian #2EE6D6, oro #FFC83D, coral #FF6B6B, luna #F4F2FF.
- Contorno índigo #0E0C2B de 3,5 px (2,4 px en detalles pequeños), luz arriba a la izquierda, sombra con borde definido y luz de borde cian a la derecha.
- Siluetas muy legibles: cada icono se reconoce en 32 px y en sombra negra.
- Todo con el emblema del umbral (arco con chispa) como sello de la casa, sin abusar.
- Apto para niños: nada de armas realistas, sangre ni calaveras. Las «armas» son focos mágicos, báculos, libros y espadas de luz estilizadas.
- Ligero: cada objeto menos de 8 KB; cada poder menos de 25 KB.

4. TANDA
(sustituye este bloque por el de la tanda que toque)

5. QUÉ ENTREGAR EN LA PESTAÑA
- Vitrina con filtros por categoría y rareza y una cuadrícula de objetos; al pulsar uno se muestra grande con sus tres estados y su ficha (qué hace, cómo se consigue, precio sugerido).
- Interruptor «ver en miniatura» (32, 48, 64 px) para comprobar legibilidad.
- Para poderes: botón «Probar en avatar» que superpone el efecto sobre Aria, Leo, Tomás o Nuri (reutiliza sus SVG).
- Tabla «Catálogo» con id, nombre, categoría, rareza, precio sugerido y cómo se desbloquea.
- Guía de estilo con 6 reglas propias, paleta aplicada con HEX y lista de ids.
- Exportación: SVG por objeto, zip por categoría, zip total y un catalogo.json con todos los datos (id, nombre, categoría, rareza, precio, desbloqueo, archivo).
- Bloque «Uso en la web»: cómo mostrar un objeto en sus tres estados y cómo leer el catalogo.json.

6. COMPROBACIONES ANTES DE ENTREGAR
- Renderiza el catálogo en 360, 768 y 1280 px y revisa que no hay desbordes.
- Comprueba cada objeto a 32 px.
- Revisa que con «reducir movimiento» no hay animaciones.
- Muéstrame capturas antes de seguir con la siguiente tanda.
```

---

## TANDA A — Poderes, ayudas, recursos, interfaz y cofres

```
TANDA A (≈ 30 elementos)

A1. PODERES (8). Icono + efecto de activación sobre el avatar.
1. Rayo de Claridad (cian) — un rayo de luz recto aclara la zona; para acertar una pista.
2. Escudo de Calma (violeta) — burbuja de ondas suaves que protege del error.
3. Aura de Concentración (oro) — anillos que giran alrededor del avatar.
4. Lluvia de Estrellas (oro y cian) — estrellas que caen; celebración de acierto.
5. Sombra Dorada (oro) — una silueta dorada acompaña al avatar (rango S).
6. Invocación de Kuro (violeta) — círculo de runas del que sale Kuro.
7. Pulso de Memoria (cian) — onda que revela las pistas ya vistas.
8. Segundo Aliento (coral) — corazón de luz que devuelve un intento.
Rareza sugerida: 1 y 2 poco comunes, 3 y 4 raros, 6 y 7 épicos, 5 y 8 legendarios.

A2. OBJETOS DE AYUDA (6). Consumibles.
Pista (linterna cian) · 50/50 (cristal partido) · Escudo contra error (escudo del emblema) · Tiempo extra (reloj de arena dorada) · Pluma de fénix (revive un intento) · Doble XP (poción con estrella).

A3. MONEDAS Y RECURSOS (5).
Moneda del gremio (oro con el emblema) · Gema (cian, moneda premium) · Orbe de XP (violeta, flota y se absorbe) · Llave de portal (abre un curso) · Sello de portal vacío (para el certificado).
Cada recurso con una animación «sumar» (+1 que sube) y otra «gastar».

A4. INTERFAZ DEL JUEGO (6).
Barra de XP con relleno animado · Corazones/gemas de vida (lleno, medio, vacío, recuperándose) · Contador de monedas con tintineo · Emblema de rango E a S (6 versiones) · Marcador de racha con llama · Insignia de nivel.

A5. COFRES (4) con animación de apertura de 2 s y «nuevo objeto».
Cofre común (madera gris) · Raro (cian) · Épico (violeta) · Legendario (oro, con rayos).
Estados: cerrado, abriéndose, abierto con destello. Pensado para premios de misión.
```

---

## TANDA B — Recompensas de Guardianes, insignias y perfil

```
TANDA B (≈ 50 elementos)

B1. RECOMPENSAS DE LOS 8 GUARDIANES (todos legendarios o épicos; cada uno recuerda a su Guardián).
Capa de Musgo (Petrox) · Aura de Brasas (Ignaris) · Linterna de Memoria (Brumalis) · Pluma de Marea (Mirelle) · Hilo de Cometa (Quimax) · Reloj de Arena Dorada (Sandrael) · Espejo Sincero (Eclipsa) · Corona del Gremio (Zhaal).
Cada una con el título que otorga: Constructor, Valiente, Memorioso, Narrador, Conector, Estratega, Seguro de sí, Maestro del Saber.

B2. SELLOS DE PORTAL (7): uno por elemento (luz, sombra, fuego, agua, naturaleza, éter) y uno dorado «portal completado». Sirven como certificado de curso. Estados: sin ganar, ganado y recién ganado (se estampa con onda).

B3. INSIGNIAS DE RANGO (6): E a S, con el color del rango.

B4. INSIGNIAS DE LOGROS (24), agrupadas:
- Inicio: Primera misión, Primer portal, Primer Guardián.
- Constancia: Racha de 3, 7 y 30 días.
- Habilidad: Sin errores, Repasador, Explicador, Planificador, Conector de ideas, Pensamiento valiente (se atrevió a reintentar).
- Comunidad: Ayudante, Compañero de equipo, Mentor.
- Exploración: Explorador de las 6 mazmorras, Coleccionista (10 objetos), Cazador de cofres.
- Especiales: Madrugador, Noche de estudio, Cumpleaños del gremio, Evento.
Cada insignia en rareza común a legendaria y con descripción corta.

B5. MARCOS DE PERFIL (6) por rareza, más 1 de evento.
Y 8 títulos como cintas de texto (las de B1) más 8 títulos de exploración.

B6. CERTIFICADO «SELLO DEL PORTAL» (1): diploma horizontal 1123×794 con espacio para nombre, curso y fecha, el emblema del gremio, firma de Sora y un sello. Versión para imprimir en blanco y negro.
```

---

## TANDA C — Equipo, cosméticos, armas y compañeros

```
TANDA C (≈ 60 elementos)

C1. EQUIPO POR RANGO (6 conjuntos E a S, ya existen sobre el avatar): crea el icono de cada conjunto (cabeza, torso, capa) y su pieza suelta para la tienda.

C2. COSMÉTICOS PARA EL AVATAR (24), con vista previa sobre Aria, Leo, Tomás y Nuri (botón «Probar en avatar»):
- Capas (6), bufandas (3), gafas (4), sombreros y cintas (4), alas de luz (3), auras (4).
- Define los puntos de anclaje (cabeza, cuello, espalda, mano) en un LEEME, y comprueba que no tapan la silla de Tomás ni los audífonos de Nuri.

C3. FOCOS MÁGICOS Y ARMAS ESTILIZADAS (8): báculo de runas, varita estelar, libro de hechizos, espada de luz (no afilada), escudo del umbral, lira de cristal, linterna del explorador, pluma-espada.

C4. COMPAÑEROS (8):
- 6 pieles de Kuro (cian, dorado, coral, verde bosque, medianoche, arcoíris), en sus tres etapas (reutiliza el esqueleto de Kuro y cambia solo la paleta).
- 2 mascotas nuevas pequeñas: zorro estelar y búho de páginas, con animaciones de reposo, celebrar y dormir.

C5. DECORACIÓN DE LA TERRAZA (6) para el hogar del avatar: macetas, banderines, mesita, farol, telescopio, cojín del umbral.
```

---

## Datos del catálogo (propuesta, para ajustar)

| Rareza | Precio en monedas | Cómo se consigue |
|---|---|---|
| Común | 10 – 40 | Misiones y cofres comunes |
| Poco común | 50 – 120 | Rangos D y C, cofres |
| Raro | 150 – 300 | Rangos B, tienda |
| Épico | 400 – 800 | Guardianes de rango B/A, eventos |
| Legendario | No se compra | Guardianes, logros especiales, rango S |

Las gemas se reservan para cosméticos y eventos; nunca para ventajas de aprendizaje, para no convertir el juego en «pagar para ganar».

---

## Principios de diseño del catálogo (aplican a las tres tandas)

1. **Lo que da ventaja de aprendizaje** (pistas, 50/50, tiempo extra) tiene un tope diario y nunca se vende con gemas.
2. **Lo cosmético** nunca altera el contenido educativo.
3. **Los logros reconocen esfuerzo**, no solo resultado (racha, reintento, ayudar).
4. **Todo objeto tiene un texto alternativo** para lectores de pantalla.
5. **El docente y la familia** pueden ver y otorgar insignias de comunidad.
