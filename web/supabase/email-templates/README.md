# Plantillas de correo de Supabase Auth · UNEX Academy

Correos de cuenta en español, con la marca UNEX Academy. Se pegan a mano en Supabase; la app no los lee.
(Esta carpeta es solo para las plantillas; la base de datos está en `supabase/`, en la raíz del repositorio.)

## Dónde se pegan

Supabase → proyecto de producción → **Authentication → Emails → Templates**. En cada pestaña, copia el
**asunto** en *Subject* y el contenido completo del archivo HTML en *Message body* (vista *Source*), y guarda.

| Pestaña en Supabase | Archivo | Asunto |
|---|---|---|
| **Confirm signup** | `confirm-signup.html` | Confirma tu correo en UNEX Academy |
| **Reset password** | `reset-password.html` | Restablece tu contraseña de UNEX Academy |
| **Magic link** | `magic-link.html` | Tu enlace para entrar a UNEX Academy |
| **Change email address** | `change-email.html` | Confirma tu nuevo correo en UNEX Academy |

Hoy la app usa **Confirm signup** (registro y reenvío) y **Reset password** («¿Olvidaste tu contraseña?»).
**Magic link** y **Change email address** quedan listas por si se habilitan después.

**Antes de pegarlas**, el logo debe estar publicado: se carga desde
`https://unex-academia.vercel.app/brand/unex-academy-negativo.png`, que existe después de fusionar y desplegar.

## Cómo funcionan los enlaces (no cambiar)

- Las variables de Supabase se usan tal cual: `{{ .ConfirmationURL }}` en todas, y `{{ .Email }}` (correo
  actual) y `{{ .NewEmail }}` (correo nuevo) en `change-email.html`.
- `{{ .ConfirmationURL }}` pasa por Supabase, que verifica el correo y vuelve a la dirección que pidió la app:
  `/auth/callback` en el registro y `/auth/callback?next=/nueva-contrasena` en la recuperación. Allí
  `web/src/app/auth/callback/route.ts` cambia el `code` por una sesión (flujo PKCE). No reemplazarlo por una URL
  armada con `{{ .TokenHash }}`: el callback espera `code`.
- Por el flujo PKCE, el enlace debe abrirse en el mismo navegador donde se pidió (los textos lo recuerdan).
- En **Authentication → URL Configuration**: *Site URL* `https://unex-academia.vercel.app` y, en *Redirect URLs*,
  `https://unex-academia.vercel.app/auth/callback`.

## Diseño

- HTML de correo para Gmail y Outlook: tablas, estilos en línea, ancho máximo de 560 px, sin JavaScript y sin
  fuentes externas (fuentes de sistema con respaldo Arial y Helvetica).
- Fondo `#F5F4FB`, encabezado `#15173F` con el logo negativo, botón `#137365` con texto blanco (5,7:1), texto
  secundario `#585A7E`. El dorado `#F8B630` (Nova) solo aparece en la estrella ✦ bajo el logo: el manual reserva
  Nova para la estrella y los logros, y la estrella queda fuera del área de respeto del logo.
- Logo: PNG exportado del SVG oficial sin modificarlo (480 × 155, mostrado a 240 px), porque Gmail y Outlook no
  muestran SVG. Si el cliente bloquea imágenes, se lee «UNEX Academy» (texto alternativo).
- Cada correo trae el enlace en texto plano por si el botón no funciona y la línea «Si no fuiste tú, ignora este
  correo». Pie: «UNEX Education · unexeducation07@gmail.com».

## Vista previa

`vista-previa/` tiene cada plantilla renderizada con datos de ejemplo, en escritorio (640 px) y en celular
(375 px), y `sin-imagenes.png` muestra cómo queda la cabecera si el cliente bloquea las imágenes.

## Correo propio (SMTP con Gmail)

En **Authentication → Emails → SMTP Settings**: host `smtp.gmail.com`, puerto `465` (o `587`), usuario la cuenta
de Gmail y como contraseña una **contraseña de aplicación** de Google (no la contraseña normal). Nombre del
remitente: `UNEX Academy`. Gmail limita los envíos diarios; revisa también **Authentication → Rate Limits**.
