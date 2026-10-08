@AGENTS.md

## Marca UNEX

Esta plataforma es **UNEX Academy** (antes "Academia Virtual Umbral"), una de las cuatro plataformas de
UNEX Education: Academy, Gestión, Evaluación y Apps. La fuente de verdad de la marca está en el repositorio
del sitio principal (`unex-education-web/docs/marca/`): `manual-identidad.md`, `tokens.css` y `logo/`.
Léela antes de tocar colores, logos, fuentes o textos de marca.

### Tres capas
1. **El marco es UNEX**: nombre visible, logo, colores de interfaz, tipografía, encabezado, pie y metadatos.
2. **El mundo se conserva**: Kuro, el Gremio, los portales, los jefes, el bestiario, las crónicas, los avatares
   y todas las ilustraciones. **No se cambian los colores dentro del arte** (SVG de personajes, escenografías y
   objetos; `content/wearables.ts`, `lib/avatar-*.ts`, `content/guardians.ts`, `lib/game/ranks.ts`,
   `lib/catalog.ts`, `content/diploma-svg.ts`). "Umbral" es el nombre del mundo: el umbral por el que el
   estudiante entra al Gremio.
3. **No se toca sin aprobación explícita del usuario**: constancias ya emitidas, `NEXT_PUBLIC_SITE_URL`
   (`unex-academia.vercel.app`), autenticación de Supabase, webhooks y lógica de pagos (Wompi, Mercado Pago,
   incluido `statement_descriptor` y el título del cobro), la base de datos, la carpeta `supabase/`, y los
   textos de términos y privacidad (solo se proponen cambios).

### Nombre: dónde va "UNEX Academy" y dónde se queda "Umbral"
- **UNEX Academy**: `SITE_NAME`, metadatos, logo, pie, mensajes que hablan del producto ("tu cuenta de
  UNEX Academy"), `/verificar` (con "antes Academia Virtual Umbral" para las constancias antiguas).
- **Umbral (mundo)**: diploma "Sello del Portal" ("UMBRAL · GREMIO DE APRENDICES"), crónicas, universos,
  objetos como `obj_cosmetico_capa_umbral`, `catalogo.json`, la biblia de personajes.
- **Identificadores internos que nunca cambian**: `USERNAME_DOMAIN` (`usuarios.umbral.invalid`; cambiarlo
  impide entrar a los estudiantes creados en bloque), el prefijo `UMB-` de los códigos de constancia (está en
  una restricción de la base de datos), la cookie `umbral-vista`, la clave `umbral-sonido` de localStorage,
  `UMBRAL_PREVIEW` y los globales `__umbral*`.
- *Universo* se reserva para los mundos temáticos de los cursos; Academy, Gestión, Evaluación y Apps son
  *plataformas*.
- Los universos están en `src/content/universos.ts` (hoy solo «El Gremio de los Portales»; los demás se
  anuncian en el inicio con una tarjeta genérica «Próximamente»). La base de datos no guarda el universo de cada
  curso: `universoDeCurso` los asigna todos al Gremio. Cada universo puede tener su acento y su tipografía de
  títulos con `[data-universo="<id>"]` en `globals.css`; el archivo explica los pasos para agregar uno.

### Logo
- Nunca se redibuja ni se modifica. Los SVG se copian sin cambios a `public/brand/` y se usan con `<img>`.
- `unex-academy-negativo.svg` sobre fondos oscuros; `unex-academy.svg` sobre fondos claros.
- El logo horizontal **nunca por debajo de 160 px de ancho** en pantalla. Donde no quepa, el isotipo de
  Academy (`unex-academy-isotipo*.svg`, mínimo 24 px). `src/components/logo.tsx` aplica esta regla.
- Favicon: `unex-favicon-adaptativo.svg` (aprobado por la marca) en `src/app/icon.svg`, sin modificar. Es el
  favicon del manual para menos de 24 px con una regla interna `prefers-color-scheme`: trazos Cosmos en
  navegadores claros y Polvo en oscuros.
- Excepciones en documentos (constancias, diplomas, PDF), según el manual: marca de agua con el isotipo
  monocromo al 4–6 % de opacidad; en un documento escalado en pantalla cuenta el tamaño impreso (mínimo 40 mm).
- Los SVG `public/brand/academia-umbral-*` **no se borran**: los usan las constancias anteriores al cambio.

### Color
Los tokens de `src/app/globals.css` conservan sus nombres antiguos; sus valores son UNEX:

| Token | `:root` y `[data-tema="oscuro"]` (Gremio y zonas Cosmos) | `.theme-panel` y `[data-tema="claro"]` (consola, panel docente y sitio público) |
|---|---|---|
| `bg` | `#0D0F2B` (Fondo oscuro) | `#F5F4FB` (Polvo) |
| `bg-2` | `#15173F` (Cosmos) | `#FFFFFF` |
| `panel` | `#161941` (Superficie oscura) | `#FFFFFF` |
| `panel-2` | `#20234F` (derivado) | `#FAF9FD` (derivado) |
| `line` | `#2A2D5C` (decorativa) | `#DDDBEE` |
| `line-fuerte` | `#646AA6` (bordes de campos, ≥ 3:1) | `#85839F` (≥ 3:1) |
| `text` | `#EEEDF9` | `#15173F` (Cosmos) |
| `muted` | `#A3A5CB` | `#585A7E` |
| `cyan` y `accion` (acento) | `#1FBFA9` (Aurora) | `#137365` (Aurora oscuro) |
| `accion-fuerte` | — | `#0E5A4F` (hover; texto blanco 8,1:1) |
| `accion-suave` | — | `#E3F4F1` (fondos; `accion` encima 5,0:1) |
| `violet` (gráficos: barras, anillos) | `#1FBFA9` (Aurora base, 7,3:1 sobre panel) | `#137365` (Aurora oscuro, 4,9:1 sobre el riel) |
| `gold` | `#F8B630` (Nova) | `#A86A00` (ámbar oscuro, no es Nova) |
| `ink` (texto sobre Aurora o Nova) | `#15173F` | `#15173F` |
| `sobre-accion` (texto sobre un fondo `accion`) | `#15173F` (7,4:1) | `#FFFFFF` (5,7:1) |
| `coral`, `green`, `ok`, `warn`, `err` | estados, sin cambio | estados, sin cambio |

- `::selection` en modo oscuro: fondo `#137365` con texto blanco (5,7:1). **No uses `#137365` para gráficos
  sobre fondo oscuro**: sobre los paneles solo da 2,9:1 (WCAG 1.4.11 pide 3:1). Al revés en fondo claro:
  `#1FBFA9` da 2,0–2,3:1 sobre blanco, Polvo o el riel de la barra, así que los gráficos de la consola van en
  `#137365`.
- Aurora es el color de Academy. Color base solo para gráficos; para texto, el tono claro sobre Cosmos
  (`#1FBFA9`) o el oscuro sobre fondo claro (`#137365`).
- **Botón principal**: Aurora con texto Cosmos (7,4:1); en claro, Aurora oscuro con texto blanco (5,7:1). **Nova** solo para monedas, rangos, recompensas,
  logros y la estrella del menú activo. Nova nunca va como texto sobre fondo claro.
- Los colores de estado no reutilizan los colores de plataforma. El verde de éxito siempre va con ícono y texto.
- Sin colores escritos a mano en la interfaz: usa los tokens. El bloque `--unex-*` es copia literal de
  `tokens.css`. Sobre un fondo `bg-accion`, el texto va en `text-sobre-accion` (no en `text-ink` ni `text-white`).
  Lo que depende del fondo también es token: `--campo`, `--chip-fondo`, `--chip-borde`, `--riel`,
  `--hover-suave`, `--sombra-panel` y `--palomita` (casilla `.casilla`).

### Zonas y temas
- **Gremio** (estudiantes y familias): oscuro, tokens de `:root`.
- **Consola y panel docente**: `.theme-panel`, claro.
- **Sitio público** (inicio, cursos, ficha, verificar, legales, servicios, proyectos, Cómo se juega, Familias y
  docentes, y sin sesión ingresar, registro y recuperar): `[data-tema="claro"]`, como el sitio principal UNEX.
  Dentro, las zonas sobre Cosmos (encabezado, portada del inicio y pie) llevan `[data-tema="oscuro"]`, que
  vuelve a los tokens de `:root`. Cada página pública exporta `viewport = VIEWPORT_PUBLICO`
  (`src/config/viewport-publico.ts`, theme-color Cosmos `#15173F`).
- Cualquier cambio en `globals.css` se comprueba con una comparación píxel a píxel del Gremio, la consola y el
  panel docente antes y después: deben quedar idénticos.

### Tipografía
- **Unbounded** (títulos: h1 700, h2 600, h3 y h4 500) y **Lexend** (texto, 350), como archivos locales en
  `src/app/fonts/` con `next/font/local`. No se usa `next/font/google`.
- El tamaño base se queda en 16 px. La consola usa Lexend también en los títulos.
- Unbounded solo en títulos y etiquetas cortas. Lo que se lee va en Lexend aunque sea grande: la pregunta de
  la misión y las páginas de las Crónicas.
- **Fraunces** solo en las constancias. **Bricolage Grotesque y DM Sans** solo en el diploma "Sello del Portal"
  (y DM Sans en las constancias anteriores al cambio). Se cargan únicamente donde se usan, no en todo el sitio.

### Encabezado y pie
- **Sitio público**: `EncabezadoPublico` (`src/components/encabezado/`), una sola barra Cosmos, sólida y no fija,
  como la del sitio principal: logo, secciones (`src/config/secciones-publicas.ts`: Cursos, Cómo se juega,
  Familias y docentes), selector «Plataformas» con Academy marcada, Ingresar y Crear cuenta. Hasta 1079 px:
  logo, «Ingresar» siempre visible y un menú con lo demás. Los desplegables son `<details>` (`Desplegable`) y
  se cierran al cambiar de página, con Escape y al tocar fuera. Pie: `PiePublico`.
- **Consola, panel docente y páginas compartidas del personal**: la franja Cosmos `FranjaUnex` con
  "UNEX Education" y las cuatro plataformas.
- Las direcciones de las plataformas están en `src/config/productos.ts`; mientras una sea `null`, se muestra
  como "Próximamente".
- En el Gremio, el acceso a las otras plataformas está solo en el pie (`footer.tsx`).

### Constancias
- Cada constancia se dibuja con la marca con la que se emitió. `MARCA_UNEX_DESDE` (`src/lib/certificates.ts`)
  es la fecha de corte: antes, Academia Virtual Umbral (logo, sello, texto y fuentes de entonces); desde ese
  momento, UNEX Academy. No hay cambios en la base de datos.
- `CODE_PATTERN` y la URL de verificación del QR no cambian.
- Todo lo que depende de la marca está en `MARCAS` y `marcaDeConstancia()` (`src/lib/certificates.ts`): logo,
  sello, marca de agua y emisor de `/verificar`. Las de UNEX Academy usan `unex-academy.svg`, el isotipo
  monocromo al 4 % y texto en Lexend; las anteriores, exactamente lo de antes (DM Sans, logo y sello Umbral).
- El documento fija `font-normal`: no hereda el peso 350 del sitio.
- `MARCA_UNEX_DESDE` = `2026-10-07T13:00:00-05:00` (el cambio de marca en producción). No se cambia.

### Al trabajar
- Rama `marca-unex`, nunca `main` ni la rama de producción (`claude/focused-cannon-jwalw4`). El usuario hace
  el merge.
- Antes de cada commit, dentro de `web/`: `npm run typecheck`, `npm run lint` y `npm run test`. En un clon
  nuevo, primero `npx next typegen` (genera `PageProps`, `LayoutProps` y `RouteContext`). Commits pequeños
  con mensajes en español.
- En la vista previa de Vercel no se crean cuentas, constancias ni datos: puede usar la base real. Las e2e
  solo en CI o en local con el repositorio en memoria (`UMBRAL_PREVIEW=1`).
