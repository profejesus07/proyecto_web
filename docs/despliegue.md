# Puesta en marcha: Supabase + Vercel

Tiempo estimado: 15 minutos. Solo necesitas tu cuenta de Supabase y tu cuenta de Vercel.

## 1. Supabase

1. **New project.** Nombre: `umbral`. Región: la más cercana a tus estudiantes. Guarda la contraseña de la base de datos. Espera un par de minutos a que termine de crearse.
2. **Crear las tablas.** Menú izquierdo → **SQL Editor** → **New query**. Abre el archivo [`supabase/setup.sql`](../supabase/setup.sql) de este repositorio, copia **todo** su contenido, pégalo y pulsa **Run**. Debe decir *Success*. Se puede ejecutar más de una vez sin problema.
3. **Correos de confirmación.** **Authentication → Sign In / Providers → Email**:
   - *Confirm email* **activado** (recomendado): cada persona confirma su correo. Ojo: el correo gratuito de Supabase envía muy pocos mensajes por hora; para un grupo grande conviene configurar un servicio de correo propio (**Authentication → SMTP Settings**).
   - *Confirm email* **desactivado**: entran de inmediato. Útil para probar o para clases donde el docente crea las cuentas.
   - En la misma pantalla, **Minimum password length:** `8` y **Password requirements:** *Letters and digits*. Son las mismas reglas que muestra el formulario de registro. (*Prevent use of leaked passwords* solo existe en el plan Pro.)
4. **Direcciones permitidas.** **Authentication → URL Configuration**: cuando tengas la dirección de Vercel, ponla en *Site URL* y añade `https://TU-SITIO.vercel.app/auth/callback` en *Redirect URLs*.
5. **Copiar las claves.** **Project Settings → API Keys** (o *API*): copia
   - `Project URL`
   - la clave pública (`anon` o `publishable`)
   - la clave `service_role` (secreta)

## 2. Vercel

1. **Add New… → Project** y elige el repositorio `profejesus07/proyecto_web`.
2. **Root Directory:** `web`. El framework se detecta solo (Next.js).
3. **Environment Variables:**

   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | la `Project URL` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clave pública |
   | `SUPABASE_SERVICE_ROLE_KEY` | la clave `service_role` (márcala como *Sensitive*) |

4. **Deploy.** Al terminar, vuelve a Supabase (paso 1.4) y pega la dirección del sitio.

> La rama de trabajo es `claude/focused-cannon-jwalw4`. Vercel crea una dirección de prueba para cada rama. Cuando estés conforme, se fusiona con `main` y esa pasa a ser la dirección oficial.

## 3. Comprobar que todo funciona

1. Abre el sitio y pulsa **Crear cuenta**.
2. Regístrate (si activaste la confirmación, abre el correo y pulsa el enlace).
3. Entra al Gremio, abre el primer portal y completa una misión.
4. En Supabase → **Table Editor → profiles** debe aparecer tu perfil con su XP.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| «La plataforma todavía se está conectando» | Faltan las variables de entorno en Vercel. Añádelas y vuelve a desplegar. |
| Se crea la cuenta pero no llega el correo | Límite del correo gratuito de Supabase. Revisa *spam* o configura SMTP propio. |
| El enlace del correo lleva a «Ingresar» | La dirección del sitio no está en *Redirect URLs* (paso 1.4). |
| «No pudimos guardar tu resultado» | No se ejecutó `setup.sql` completo, o falta `SUPABASE_SERVICE_ROLE_KEY`. |

## Mantenimiento

- Para cambiar o añadir cursos, edita `supabase/seed/*.json`, ejecuta `python3 supabase/build_setup.py` y vuelve a pegar `setup.sql` en el editor SQL.
- Las claves se rotan desde Supabase; después actualiza la variable en Vercel y vuelve a desplegar.
