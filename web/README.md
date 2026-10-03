# Umbral · plataforma web

Next.js 16 (App Router) + TypeScript + Tailwind 4 + Supabase. Se publica en Vercel.

## Comandos

```bash
npm install
npm run dev          # http://localhost:3000 (necesita .env.local; ver .env.example)
npm run typecheck    # tipos
npm run lint         # estilo y errores comunes
npm test             # pruebas del juego y de la base de datos (Postgres en memoria)
npm run test:e2e     # recorrido completo con navegador (CHROMIUM_PATH=/ruta/a/chrome si hace falta)
npm run build        # compilación de producción
```

### Vista previa sin Supabase

Para ver y probar todas las pantallas sin conectar nada:

```bash
UMBRAL_PREVIEW=1 npm run dev        # entra como un estudiante de ejemplo, con datos en memoria
UMBRAL_PREVIEW=anon npm run dev     # visitante sin sesión
```

Solo funciona en desarrollo; en producción se ignora.

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/app/(auth)` | Registro e ingreso |
| `src/app/(app)` | Pantallas privadas: Gremio, Portales, Misión, Perfil, Tienda |
| `src/app/actions` | Acciones del servidor: autenticación, calificar misiones, comprar |
| `src/lib/game` | Reglas puras del juego: rangos, calificación, premios (con pruebas) |
| `src/lib/data` | Acceso a datos: Supabase (producción) y memoria (vista previa) |
| `src/lib/supabase` | Clientes de Supabase y proxy de sesión |
| `src/components` | Interfaz reutilizable |
| `src/content` | Datos fijos: Guardianes y contenido de ejemplo |
| `public/assets` | 1.057 SVG animados (personajes, jefes, escenarios, objetos) |
| `tests`, `e2e` | Pruebas |

## Seguridad en una frase

El navegador nunca decide nada importante: las respuestas correctas, el XP, las monedas y los objetos viven solo en el servidor y en funciones de la base de datos que únicamente el servidor puede llamar. Cada tabla tiene seguridad por filas (RLS) y las pruebas de `tests/db.test.ts` comprueban que un estudiante no puede darse XP, cambiar su rol ni ver datos ajenos.

Más detalles en [`../docs/despliegue.md`](../docs/despliegue.md).
