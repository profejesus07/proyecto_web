# Plantillas de correo de Supabase Auth · UNEX Academy

Correos de cuenta en español, con la marca UNEX Academy. Se pegan a mano en Supabase; la app no los lee.

## Dónde se pegan

Supabase → proyecto de producción → **Authentication → Emails → Templates**. En cada pestaña, copia el
**asunto** en *Subject* y el contenido completo del archivo HTML en *Message body* (vista *Source*), y guarda.

| Pestaña en Supabase | Archivo | Asunto |
|---|---|---|
| **Confirm signup** | `confirmar-cuenta.html` | Confirma tu cuenta en UNEX Academy |
| **Reset password** | `recuperar-contrasena.html` | Recupera tu contraseña de UNEX Academy |
| **Change email address** | `cambiar-correo.html` | Confirma tu nuevo correo |
| **Magic link** | `enlace-magico.html` | Tu enlace para entrar a UNEX Academy |

Hoy la app usa **Confirm signup** (registro y reenvío) y **Reset password** («¿Olvidaste tu contraseña?»).
**Change email address** y **Magic link** quedan listas por si se habilitan después; la app todavía no
ofrece cambiar el correo ni entrar con enlace mágico.

## Cómo funcionan los enlaces (no cambiar)

- Todas usan `{{ .ConfirmationURL }}`. Ese enlace pasa por Supabase, que verifica el correo y vuelve a la
  dirección que pidió la app: `/auth/callback` en el registro y `/auth/callback?next=/nueva-contrasena` en la
  recuperación. Allí `web/src/app/auth/callback/route.ts` cambia el `code` por una sesión (flujo PKCE).
- **No** reemplazar por una URL armada con `{{ .TokenHash }}` o `{{ .SiteURL }}`: nuestro callback espera
  `code`, no `token_hash`.
- Por el flujo PKCE, el enlace debe abrirse en el mismo navegador donde se pidió. Si se abre en otro, la cuenta
  igual queda confirmada y la app lo explica en `/ingresar`. Por eso la recuperación y el enlace mágico lo
  recuerdan en el texto.
- `cambiar-correo.html` también usa `{{ .Email }}` (correo actual) y `{{ .NewEmail }}` (correo nuevo).
- Para que Supabase respete esas direcciones, en **Authentication → URL Configuration** deben estar *Site URL*
  `https://unex-academia.vercel.app` y, en *Redirect URLs*, `https://unex-academia.vercel.app/auth/callback`.

## Diseño

- HTML de correo: tablas, estilos en línea, ancho máximo de 600 px y tipografía de sistema (los correos no
  cargan Lexend ni Unbounded).
- Fondo Polvo `#F5F4FB`, cabecera Cosmos `#15173F`, texto Cosmos, botón Aurora oscuro `#137365` con texto
  blanco (5,7:1) y texto secundario `#585A7E`.
- Logo: `https://unex-academia.vercel.app/brand/unex-academy-negativo.png`. Gmail y Outlook no muestran SVG,
  así que es una exportación a PNG del SVG oficial (480 × 155 px, se muestra a 240 px), sin modificarlo. Si el
  logo cambia, hay que volver a exportarlo.
- Cada correo trae el enlace en texto plano por si el botón no funciona, y una línea sobre qué hacer si la
  persona no lo pidió.

## Correo propio (SMTP con Gmail)

En **Authentication → Emails → SMTP Settings**: host `smtp.gmail.com`, puerto `465` (o `587`), usuario la cuenta
de Gmail y como contraseña una **contraseña de aplicación** de Google (no la contraseña normal). Nombre del
remitente: `UNEX Academy`. Gmail limita los envíos diarios; revisa también **Authentication → Rate Limits**.
