# assets/ — Biblioteca de ilustraciones SVG

Exportada del artefacto **«Elenco del gremio»** (12 pestañas). 1.057 SVG animados con CSS propio, fondo transparente y sin JavaScript. Se usan con `<img src="…">` o pegándolos en línea para controlarlos con `data-*`.

| Carpeta | Contenido | Archivos |
|---|---|---|
| `guias/` | Kuro (cachorro, joven, majestuoso) y Sora, con sus animaciones | 36 |
| `personajes/` | Eon, Brann y Kael | 32 |
| `maestros/` | 4 Maestros del Gremio (docentes) | 36 |
| `familia/` | 4 Guardianes del Hogar (madre, padre, abuela, abuelo) | 36 |
| `avatares/` | Aria, Leo, Tomás y Nuri: rangos E–S (reposo y subir de rango) y animaciones | 74 |
| `enemigos/` | Slime Confuso, Duende Enredador, Sombrita, Cofre Mímico | 28 |
| `jefes/` | Los 8 Guardianes con 15–22 animaciones cada uno (calma, furia, purificado) | 127 |
| `escenarios/` | 7 escenarios: completo, vertical 9:16, cuadrado 1:1 y una capa por archivo, con `demo.html` y `LEEME.txt` | 161 |
| `companeros/` | Pieles de Kuro | 18 |
| `objetos/` | 156 objetos con 3 estados cada uno, efectos de poderes y `catalogo.json` | 525 |

## Cómo usarlos
- **Como imagen:** `<img src="assets/jefes/petrox/petrox-reposo.svg" alt="Petrox">`. Los archivos sin bucle terminan en su última pose.
- **En línea:** pega el SVG en el HTML y cambia atributos: `data-act`, `data-state`, `data-phase`.
- **Catálogo de objetos:** `objetos/catalogo.json` trae id, nombre, categoría, rareza, precio, desbloqueo, descripción, texto alternativo y archivos de cada estado.
- **Escenarios en capas:** `escenarios/<nombre>/<nombre>-capa-fondo|medio|frente|particulas.svg`. Los marcadores de posición (`slot_*`) están en cada `LEEME.txt`.

## Notas
- Las animaciones respetan «reducir movimiento».
- Peso total ≈ 22 MB sin comprimir; ningún archivo supera 150 KB.
- **Corregido al importar:** 18 archivos de `objetos/companero/` (pieles de Kuro) traían la declaración `<?xml …?>` repetida y no abrían como imagen suelta. Hay que corregirlo también en el generador del artefacto para no repetirlo.
- La animación de señas de Nuri es ilustrativa y debe validarse con una persona usuaria de Lengua de Señas Colombiana antes de publicar.
- Para regenerar la biblioteca: abrir el artefacto y pulsar «Descargar todo (.zip)».
