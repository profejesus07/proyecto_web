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

- Para cambiar o añadir cursos, edita o crea `supabase/seed/<curso>.json`, añádelo a `SEEDS` en `supabase/build_setup.py` (con el nombre de su migración), ejecuta `python3 supabase/build_setup.py` y vuelve a pegar `setup.sql` en el editor SQL. Los portales se abren en el orden de su `position`: cada uno exige terminar los anteriores.
- Las claves se rotan desde Supabase; después actualiza la variable en Vercel y vuelve a desplegar.
- **Cambios en la base de datos.** Cada cambio llega como una migración en `supabase/migrations/` (numeradas). Para aplicarla, copia ese archivo en Supabase → **SQL Editor** y pulsa **Run**; o vuelve a pegar `setup.sql` completo (es seguro repetirlo). En producción están aplicadas de la 0001 a la 0018 (octubre de 2026).
- **Dibujos de accesorios y decoración.** Si cambian los SVG de `public/assets/objetos` (cosméticos, focos o decoración), ejecuta `python3 web/scripts/build_wearables.py` para regenerar las piezas que se ponen sobre el avatar y en la terraza.

## Cómo funciona cada parte

- **Familias.** El estudiante muestra su código de familia en **Perfil → Mi familia** y la familia lo escribe en **Mi familia**. La familia solo lee el avance (nunca correo, contraseña ni respuestas), puede enviar hasta 5 mensajes de apoyo al día (frases fijas) y ve la decoración que el estudiante le regala a su terraza. Cualquiera de los dos puede desvincularse.
- **Tienda.** Solo vende lo que funciona: Pista y 50/50, poderes, cosméticos y objetos para la mano (se ven en el avatar), marcos del retrato, compañeros y decoración para la Terraza del Hogar. Todo se paga con monedas del juego, nunca con dinero.
- **Poderes.** Rayo de Claridad y Escudo de Calma (rango D); Aura de Concentración, Lluvia de Estrellas, Invocación de Kuro y Pulso de Memoria (rango B). La Sombra Dorada y el Segundo Aliento se ganan al llegar al rango S. Cada uno tiene tope diario; las reglas están en `web/src/lib/game/powers.ts` y en la migración 0018.
- **Guardianes y Crónicas.** Al crear una clase o un curso en el editor eliges su Guardián (8 posibles). Cada Guardián trae tres capítulos de las Crónicas: uno abierto desde el inicio, otro al superar la penúltima misión y otro al vencerlo (la última misión), además de su recompensa y su título. El Bestiario (en el Archivo de Crónicas) muestra a los Guardianes sin portal en sombra.
- **Vista previa local.** Con `UMBRAL_PREVIEW=1 npm run dev` la plataforma funciona sin Supabase, con datos en memoria. La cookie `umbral-vista` cambia de persona: `docente`, `admin` o `familia` (sin cookie, estudiante).

## Administración

- **Quién es administrador:** una cuenta de docente con la marca `is_admin`. Hoy lo es `profejesus365@gmail.com`. Para marcar otra cuenta, en Supabase → **SQL Editor** ejecuta:

  ```sql
  update public.profiles set is_admin = true, role = 'docente'
   where id = (select id from auth.users where email = 'correo@ejemplo.com');
  ```

- **Cuentas de docente:** solo se crean desde **Admin → Crear cuenta de docente** (o cambiando el rol de una cuenta existente). El registro público solo crea cuentas de estudiante o familia.
- **Cursos:** la primera lección de cada curso es gratis. El resto se abre con acceso al curso, que el administrador activa en **Admin → Personas** (sin vencimiento, 1 mes, 6 meses o 1 año). Quitar un acceso no borra el registro: queda marcado como revocado.
- **Precios:** en **Admin → Cursos y precios**, en pesos colombianos.
