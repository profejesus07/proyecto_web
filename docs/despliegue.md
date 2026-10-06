# Puesta en marcha: Supabase + Vercel

Tiempo estimado: 15 minutos. Solo necesitas tu cuenta de Supabase y tu cuenta de Vercel.

## 1. Supabase

1. **New project.** Nombre: `umbral`. Región: la más cercana a tus estudiantes. Guarda la contraseña de la base de datos. Espera un par de minutos a que termine de crearse.
2. **Crear las tablas.** Menú izquierdo → **SQL Editor** → **New query**. Abre el archivo [`supabase/setup.sql`](../supabase/setup.sql) de este repositorio, copia **todo** su contenido, pégalo y pulsa **Run**. Debe decir *Success*. Se puede ejecutar más de una vez sin problema.
3. **Correos de confirmación.** **Authentication → Sign In / Providers → Email**:
   - *Confirm email* **activado** (recomendado): cada persona confirma su correo. Ojo: el correo gratuito de Supabase envía muy pocos mensajes por hora; para un grupo grande conviene configurar un servicio de correo propio (**Authentication → SMTP Settings**).
   - *Confirm email* **desactivado**: entran de inmediato. Útil para probar o para clases donde el docente crea las cuentas.
   - En la misma pantalla, **Minimum password length:** `8` y **Password requirements:** *Letters and digits*. Son las mismas reglas que muestra el formulario de registro. (*Prevent use of leaked passwords* solo existe en el plan Pro.)
4. **Direcciones permitidas.** **Authentication → URL Configuration**: en *Site URL* pon `https://academiaumbral.vercel.app` y en *Redirect URLs* añade `https://academiaumbral.vercel.app/auth/callback`.
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
   | `NEXT_PUBLIC_SITE_URL` | `https://academiaumbral.vercel.app` |

4. **Deploy.** Al terminar, vuelve a Supabase (paso 1.4) y revisa que la dirección del sitio esté puesta.
5. **Dominio oficial: `academiaumbral.vercel.app`.** **Settings → Domains → Add** y escribe `academiaumbral.vercel.app` (Vercel lo asigna gratis si está libre). Si el proyecto tenía otra dirección `.vercel.app`, puedes dejarla redirigiendo a la nueva con **Edit → Redirect to**. Si cambias `NEXT_PUBLIC_SITE_URL`, vuelve a desplegar (**Deployments → ⋯ → Redeploy**).

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
- **Cambios en la base de datos.** Cada cambio llega como una migración en `supabase/migrations/` (numeradas). Para aplicarla, copia ese archivo en Supabase → **SQL Editor** y pulsa **Run**; o vuelve a pegar `setup.sql` completo (es seguro repetirlo). En producción están aplicadas de la 0001 a la 0022 (octubre de 2026).
- **Dibujos de accesorios y decoración.** Si cambian los SVG de `public/assets/objetos` (cosméticos, focos o decoración), ejecuta `python3 web/scripts/build_wearables.py` para regenerar las piezas que se ponen sobre el avatar y en la terraza.

## Cómo funciona cada parte

- **Familias.** El estudiante muestra su código de familia en **Perfil → Mi familia** y la familia lo escribe en **Mi familia**. La familia solo lee el avance (nunca correo, contraseña ni respuestas), puede enviar hasta 5 mensajes de apoyo al día (frases fijas) y ve la decoración que el estudiante le regala a su terraza. Cualquiera de los dos puede desvincularse.
- **Tienda.** Solo vende lo que funciona: Pista y 50/50, poderes, cosméticos y objetos para la mano (se ven en el avatar), marcos del retrato, compañeros y decoración para la Terraza del Hogar. Todo se paga con monedas del juego, nunca con dinero.
- **Poderes.** Rayo de Claridad y Escudo de Calma (rango D); Aura de Concentración, Lluvia de Estrellas, Invocación de Kuro y Pulso de Memoria (rango B). La Sombra Dorada y el Segundo Aliento se ganan al llegar al rango S. Cada uno tiene tope diario; las reglas están en `web/src/lib/game/powers.ts` y en las migraciones 0018 y 0019.
- **Curso de demostración.** En producción queda un solo curso de ejemplo: «Curso de demostración: aprender paso a paso» (dirección `primer-portal`), gratis, con dos módulos (Petrox e Ignaris) y una actividad de cada tipo. Se armó con `supabase/contenido/curso_demo.sql` (contenido, no migración). El portal viejo «El Portal del Primer Intento» quedó vacío y oculto: elimínalo desde **Admin → Contenido**. La vista previa local y las pruebas automáticas conservan los dos cursos de ejemplo originales.
- **Tres estilos.** El sitio público (portada, `/programas`, `/servicios`, `/proyectos`, legales y verificación) usa el tema claro y académico `.theme-site` (títulos en Fraunces, menú de tres secciones en `site-nav.tsx`); la consola de administración (`/admin`, en `src/app/(console)`: Resumen, Personas, Grupos, Pagos, Cursos y precios, Contenido y Constancias) y el panel docente (`/maestro`, en `src/app/(panel)`) usan el panel claro y profesional `.theme-panel` con el marco `components/workspace/`; estudiantes y familias conservan el estilo del Gremio. Los temas solo redefinen los colores (variables CSS) en `globals.css`.
- **Verificar con el código QR.** En `/verificar` se escanea el QR de la constancia con la cámara (o se sube una foto); por eso la cabecera `Permissions-Policy` permite `camera=(self)`.
- **Universos y servicios.** Los universos están en `web/src/content/universos.ts` (hoy solo «El Gremio de los Portales»; los próximos se agregan ahí cuando estén listos); los servicios, el proceso y los proyectos de `/servicios`, en `web/src/content/servicios.ts` (ahí se agregan los enlaces de demostración de cada proyecto).
- **Sonido.** Todo se genera en el navegador, sin archivos ni servicios externos:
  - **Voces** (`web/src/lib/audio/voices.ts`): la síntesis de voz del navegador. Se elige la voz en español más natural disponible (las «Natural/Neural/Online», de Google o de Apple, con preferencia por acentos latinoamericanos) y cada personaje tiene su perfil (género, tono y velocidad cercanos a lo natural) en `VOICES`. El texto se limpia y se lee frase por frase. Para que se escuche mejor, recomienda Chrome o Edge (traen voces naturales en línea) o Safari en iPhone/Mac.
  - **Música y efectos** (`web/src/lib/audio/music.ts`): Web Audio, con un tema por sección (Gremio, mazmorra, jefe, Crónicas, tienda, hogar) y efectos de acierto, error, victoria, rango, poderes y páginas. La música baja sola mientras habla un personaje.
  - Cada persona lo ajusta en el botón 🔊 de la cabecera (música, voces, lectura automática, efectos y volumen); se guarda en su navegador. Los navegadores solo dejan sonar audio después del primer toque en la página.
- **Cursos por módulos.** Un curso corto se organiza en módulos (Admin → Contenido → el curso → «Módulos y lecciones»). Cada módulo tiene su Guardián, que es el jefe de su última lección y trae su parte de la historia (sus 3 capítulos de las Crónicas). Para publicar, cada módulo debe terminar con la prueba de su Guardián. Las clases siguen organizadas por periodos, con un solo Guardián al final.
- **Actividades.** Cada lección puede mezclar selección múltiple, verdadero o falso, completar (respuesta corta, sin importar mayúsculas ni tildes), ordenar pasos y relacionar parejas. La base de datos revisa cada respuesta (`answer_activity`); el navegador nunca recibe las respuestas aceptadas ni el orden correcto. El 50/50 solo aparece en selección múltiple.
- **Cursos gratis.** En el editor de cada curso o clase, la casilla «Ofrecer gratis (curso completo)» lo abre para todos sin pagar; en el catálogo aparece con la etiqueta «Gratis».
- **Guardianes y Crónicas.** Al crear una clase o un curso en el editor eliges su Guardián (8 posibles). Cada Guardián trae tres capítulos de las Crónicas: uno abierto desde el inicio, otro al superar la penúltima misión y otro al vencerlo (la última misión), además de su recompensa y su título. El Bestiario (en el Archivo de Crónicas) muestra a los Guardianes sin portal en sombra.
- **Vista previa local.** Con `UMBRAL_PREVIEW=1 npm run dev` la plataforma funciona sin Supabase, con datos en memoria. La cookie `umbral-vista` cambia de persona: `docente`, `admin` o `familia` (sin cookie, estudiante).

## Administración

- **Quién es administrador:** una cuenta de docente con la marca `is_admin`. Hoy lo es `profejesus365@gmail.com`. Para marcar otra cuenta, en Supabase → **SQL Editor** ejecuta:

  ```sql
  update public.profiles set is_admin = true, role = 'docente'
   where id = (select id from auth.users where email = 'correo@ejemplo.com');
  ```

- **Cuentas de docente:** solo se crean desde **Admin → Personas → Crear cuenta de docente** (o cambiando el rol de una cuenta existente). El registro público solo crea cuentas de estudiante o familia.
- **Cargar estudiantes en bloque:** en **Admin → Personas → Cargar estudiantes** se escriben (o se pegan desde una hoja de cálculo) o se sube el Excel de la plantilla. Cada fila: nombre, usuario o correo, contraseña (si va vacía se genera) y, opcional, el código de un grupo. Si una fila tiene un error no se crea ninguna cuenta. Al final se descargan o imprimen las credenciales (solo se muestran esa vez). Con un **usuario** (por ejemplo `luna.perez`), la cuenta se crea con un correo interno `luna.perez@usuarios.umbral.invalid` (dominio reservado que nunca recibe mensajes) y el estudiante entra escribiendo solo su usuario. Esas cuentas no pueden recuperar la contraseña por correo: en **Personas** el administrador pulsa «Nueva contraseña».
- **Qué hace un docente:** supervisa. En **Admin → Grupos y códigos** creas un grupo, eliges el docente que lo supervisa y le asignas estudiantes (abre el grupo y marca a quiénes). Si lo ligas a una clase, esos estudiantes reciben también su acceso anual. El docente ve en `/maestro` el resumen de sus grupos, quién necesita apoyo, el informe de cada grupo (con exportación a Excel) y el detalle de cada estudiante. No juega ni hace cursos: las páginas del juego lo llevan a su panel, y no crea ni modifica grupos.
- **Cursos:** la primera lección de cada curso es gratis. El resto se abre con un pago en línea (ver abajo) o con acceso que el administrador activa en **Admin → Personas** (sin vencimiento, 1 mes, 6 meses o 1 año). Quitar un acceso no borra el registro: queda marcado como revocado.
- **Precios:** en **Admin → Cursos y precios**, en pesos colombianos.
- **Eliminar:** en **Admin → Personas** (cuentas de estudiante, familia o docente), **Admin → Grupos y códigos** (grupos) y **Admin → Contenido** (cursos y clases). Siempre pide escribir `ELIMINAR` y no se puede deshacer. Antes de borrar, los pagos se copian a `payments_archive` (registro contable), las constancias ya expedidas siguen verificables y cada eliminación queda en `admin_log`. Las cuentas de administrador no se eliminan desde el panel. Si solo quieres ocultar un curso, pásalo a borrador; si solo quieres cerrar un grupo, archívalo.

## Pagos en línea (Wompi y Mercado Pago)

El código ya está listo; solo faltan tus cuentas y llaves. Mientras una pasarela no tenga llaves, no aparece, y si ninguna tiene llaves la página del curso sigue ofreciendo escribir por correo. Primero todo en **modo de prueba** (sin dinero real); al final se cambian las llaves por las de producción.

**Cómo funciona.** En «Desbloquear curso» (o en **Mi familia**, si paga la familia) se elige la pasarela. El servidor crea el pago con el precio de la base de datos y una referencia `UMB-…`, y lleva al checkout de la pasarela. Cuando la pasarela avisa que el pago se aprobó, el servidor lo verifica (firma y consulta directa a la pasarela) y comprueba que el valor coincida antes de abrir el curso. Un curso corto queda sin vencimiento y una clase, hasta el fin de su año lectivo. Si el pago se anula o se reembolsa, se retira ese acceso. Todos los pagos aparecen en **Admin → Pagos en línea**.

### Wompi

1. Crea la cuenta de comercio en [comercios.wompi.co](https://comercios.wompi.co) (como persona natural basta el RUT y una cuenta bancaria).
2. En **Desarrolladores → Llaves del API**, en el ambiente de **Pruebas**, copia la llave pública (`pub_test_…`), el secreto de integridad (`test_integrity_…`) y el secreto de eventos (`test_events_…`).
3. En Vercel → **Settings → Environment Variables** crea `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET` con esos valores. Vuelve a desplegar.
4. En Wompi, en **Desarrolladores → Seguimiento de transacciones (URL de eventos)**, pon `https://academiaumbral.vercel.app/api/pagos/wompi` (Admin → Pagos en línea muestra la dirección exacta).
5. Prueba con las tarjetas y cuentas de prueba de la documentación de Wompi. Cuando funcione, repite 2–4 con las llaves de **Producción** (`pub_prod_…`, `prod_integrity_…`, `prod_events_…`).

### Mercado Pago

1. Entra a [mercadopago.com.co/developers](https://www.mercadopago.com.co/developers) → **Tus integraciones → Crear aplicación** (producto: *Pagos online*, Checkout Pro).
2. En **Credenciales de prueba** copia el **Access Token**. Crea en Vercel `MERCADOPAGO_ACCESS_TOKEN` con ese valor (y `MERCADOPAGO_TEST=1` si el token de prueba empieza con `APP_USR-`).
3. En **Webhooks**, pon `https://academiaumbral.vercel.app/api/pagos/mercadopago`, marca el evento **Pagos** y copia la **clave secreta** en `MERCADOPAGO_WEBHOOK_SECRET`. Vuelve a desplegar.
4. Prueba con los usuarios y tarjetas de prueba de Mercado Pago. Cuando funcione, cambia `MERCADOPAGO_ACCESS_TOKEN` por el de **Credenciales de producción** y quita `MERCADOPAGO_TEST`.

**Nunca** pegues estas llaves en un chat, en el código ni con el prefijo `NEXT_PUBLIC_`. Si una llave se filtra, genérala de nuevo en la pasarela y actualízala en Vercel.
