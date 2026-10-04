import { expect, test, type Page } from "@playwright/test";

// Respuestas correctas del primer portal (índices de cada pregunta).
const CORRECT = { m1: [1, 1, 0, 1], m2: [0, 1, 1, 1], m3: [1, 1, 1, 0], m4: [1, 1, 1, 1, 1, 0], c2m1: [1, 0, 2, 0] };

async function play(page: Page, id: string, answers: number[]) {
  await page.goto(`/mision/${id}`);
  // Si había un intento a medias, la misión continúa donde quedó.
  const label = await page.getByText(/^Pregunta \d+ de \d+$/).textContent();
  const start = Number(label!.match(/\d+/)![0]) - 1;
  for (let i = start; i < answers.length; i++) {
    await page.locator("label:has(input[type=radio])").nth(answers[i]).click();
    await page.getByRole("button", { name: /Responder|Lanzar ataque/ }).click();
    await expect(page.locator("#feedback")).toBeVisible();
    if (i < answers.length - 1) await page.getByRole("button", { name: /Siguiente/ }).click();
  }
  await page.getByRole("button", { name: /Terminar misión|Purificar al Guardián/ }).click();
  await expect(page.getByRole("heading", { name: "Repaso de tus respuestas" })).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test("la Maestra Sora da la bienvenida la primera vez y lleva al primer portal", async ({ page }) => {
  await page.goto("/gremio");
  await expect(page.getByRole("dialog", { name: /Bienvenido al Gremio/ })).toBeVisible();
  const sora = page.getByRole("dialog");
  for (let i = 0; i < 4; i++) await sora.getByRole("button", { name: "Siguiente" }).click();
  await sora.getByRole("button", { name: "Cruzar mi primer portal" }).click();
  await expect(page).toHaveURL(/\/portales\/primer-portal$/);
  await page.goto("/gremio");
  await expect(page.getByRole("dialog")).toHaveCount(0); // no vuelve a aparecer
});

test("el estudiante empieza sin XP y ve su primer portal", async ({ page }) => {
  await page.goto("/gremio");
  await expect(page.getByText("Tu primer portal te espera")).toBeVisible();
  await expect(page.getByText("0 XP")).toBeVisible();
  await page.goto("/portales/primer-portal");
  await expect(page.getByRole("heading", { name: "El Portal de los Pasos Pequeños" })).toBeVisible();
  await expect(page.getByText("Termina las 3 misiones para desbloquearlo")).toBeVisible();
});

test("el prólogo de las Crónicas está abierto y los demás capítulos sellados", async ({ page }) => {
  await page.goto("/cronicas");
  await expect(page.getByText("Prólogo: La Gran Fractura")).toBeVisible();
  await expect(page.getByText("Páginas selladas").first()).toBeVisible();
  await page.goto("/cronicas/petrox-3");
  await expect(page).toHaveURL(/\/cronicas$/); // sellado: no se puede leer por la dirección
  await page.goto("/cronicas/prologo");
  await expect(page.getByText("Página 1 de 7")).toBeVisible();
  for (let i = 0; i < 6; i++) await page.getByRole("button", { name: /Seguir leyendo/ }).click();
  await expect(page.getByText("Página 7 de 7")).toBeVisible();
});

test("no se puede saltar a una misión bloqueada", async ({ page }) => {
  await page.goto("/mision/m2");
  await expect(page).toHaveURL(/\/portales\/primer-portal$/);
});

test("la primera lección de cada curso es gratis y la segunda pide suscribirse", async ({ page }) => {
  await page.goto("/portales");
  await expect(page.getByText(/Lección 1 gratis · completo: \$\s?25\.000/)).toBeVisible();
  await page.goto("/mision/c2m2");
  await expect(page).toHaveURL(/\/portales\/portal-del-primer-intento$/);
  await expect(page.getByText("La primera lección es gratis")).toBeVisible();
  await expect(page.getByText("Incluida en la suscripción al curso.").first()).toBeVisible();
});

test("fallar no da premio y se puede reintentar", async ({ page }) => {
  await play(page, "m1", [0, 0, 0, 0]);
  await expect(page.getByRole("heading", { name: "Casi lo logras" })).toBeVisible();
  await expect(page.getByText("+60 XP")).toHaveCount(0);
  await page.getByRole("button", { name: "Intentarlo de nuevo" }).click();
  await expect(page.getByText("Pregunta 1 de 4")).toBeVisible();
});

test("la primera pista de la misión es gratis; después hacen falta unidades", async ({ page }) => {
  await page.goto("/mision/m1");
  const ayudas = page.getByRole("group", { name: "Ayudas" });
  await expect(ayudas.getByText("rango D")).toBeVisible(); // el 50/50 aún no está disponible
  await ayudas.getByRole("button", { name: /Pista · gratis/ }).click();
  await expect(page.getByRole("note")).toBeVisible();
  await expect(ayudas.getByRole("button", { name: /Pista/ })).toHaveCount(0);
  await page.locator("label:has(input[type=radio])").nth(CORRECT.m1[0]).click();
  await page.getByRole("button", { name: "Responder" }).click();
  await page.getByRole("button", { name: /Siguiente enemigo/ }).click();
  await expect(ayudas.getByRole("button", { name: /Pista · tienes 0/ })).toBeDisabled();
  await expect(ayudas.getByRole("link", { name: "Conseguir más en la tienda" })).toBeVisible();
  // Al recargar, la misión sigue en la pregunta 2: la respuesta anterior quedó guardada.
  await page.reload();
  await expect(page.getByText("Pregunta 2 de 4", { exact: true })).toBeVisible();
});

test("cada respuesta se revisa al momento y queda fija", async ({ page }) => {
  await page.goto("/mision/m3");
  await expect(page).toHaveURL(/\/portales\/primer-portal$/); // aún bloqueada
  await page.goto("/mision/m1");
  await expect(page.getByText("Pregunta 2 de 4", { exact: true })).toBeVisible();
  const wrong = (CORRECT.m1[1] + 1) % 4;
  await page.locator("label:has(input[type=radio])").nth(wrong).click();
  await page.getByRole("button", { name: "Responder" }).click();
  await expect(page.getByText("¡Uy, no era esa!")).toBeVisible();
  await expect(page.locator("label[data-correcta]")).toHaveCount(1);
  await expect(page.locator("input[type=radio]:not([disabled])")).toHaveCount(0);
  await page.reload();
  // No se puede volver a intentar la misma pregunta: la misión sigue en la siguiente.
  await expect(page.getByText("Pregunta 3 de 4", { exact: true })).toBeVisible();
});

test("aprobar da XP, monedas y la primera insignia", async ({ page }) => {
  await play(page, "m1", CORRECT.m1);
  await expect(page.getByRole("heading", { name: "¡Misión superada!" })).toBeVisible();
  await expect(page.getByText("+60 XP")).toBeVisible();
  await expect(page.getByText("Primera misión")).toBeVisible();
});

test("repetir una misión superada no da XP otra vez", async ({ page }) => {
  await play(page, "m1", CORRECT.m1);
  await expect(page.getByText("ya no da más XP")).toBeVisible();
  await expect(page.getByRole("list", { name: "Recompensas" })).toHaveCount(0);
});

test("completar el portal y vencer a Petrox da recompensa, sello y certificado", async ({ page }) => {
  await play(page, "m2", CORRECT.m2);
  await play(page, "m3", CORRECT.m3);
  await play(page, "m4", CORRECT.m4);
  await expect(page.getByRole("heading", { name: "¡Purificaste a Petrox!" })).toBeVisible();
  await expect(page.getByRole("link", { name: /El constructor despierta/ })).toBeVisible();
  for (const name of ["Capa de Musgo", "Sello de Naturaleza", "Certificado «Sello del Portal»"]) {
    await expect(page.getByText(name).first()).toBeVisible();
  }
  await page.goto("/perfil");
  await expect(page.getByText("Rango D · Explorador").first()).toBeVisible();
  await expect(page.getByText("¡Tienes un certificado!")).toBeVisible();
});

test("al superar la lección gratis se ofrece desbloquear el curso", async ({ page }) => {
  await play(page, "c2m1", CORRECT.c2m1);
  await expect(page.getByText("¡Superaste la lección gratis!")).toBeVisible();
  await page.getByRole("link", { name: /Desbloquear el curso/ }).click();
  await expect(page).toHaveURL(/\/suscribirse\/portal-del-primer-intento$/);
  await expect(page.getByRole("link", { name: /Escribir para suscribirme/ })).toHaveAttribute("href", /^mailto:profejesus365@gmail\.com/);
});

test("la tienda vende Pista y 50/50; lo demás sigue cerrado", async ({ page }) => {
  await page.goto("/tienda?c=poder");
  await expect(page.getByText("Brann está preparando la forja")).toBeVisible();
  await expect(page.getByRole("button", { name: /Comprar/ })).toHaveCount(0);
  await page.goto("/tienda");
  const card = (name: string) => page.locator("li").filter({ has: page.getByRole("heading", { name, exact: true }) });
  await card("50/50").getByRole("button", { name: /Comprar/ }).click();
  await expect(card("50/50").getByText("Ahora tienes 1")).toBeVisible();
  await card("Pista").getByRole("button", { name: /Comprar/ }).click();
  await expect(card("Pista").getByText("Ahora tienes 1")).toBeVisible();
});

test("el 50/50 descarta respuestas incorrectas y gasta una unidad", async ({ page }) => {
  await page.goto("/mision/m2");
  const ayudas = page.getByRole("group", { name: "Ayudas" });
  await ayudas.getByRole("button", { name: /50\/50 · tienes 1/ }).click();
  await expect(ayudas.getByText("50/50 usado")).toBeVisible();
  await expect(page.locator("label[data-descartada]")).toHaveCount(2);
  const correct = page.locator("label:has(input[type=radio])").nth(CORRECT.m2[0]);
  await expect(correct).not.toHaveAttribute("data-descartada");
  await correct.click();
  await page.getByRole("button", { name: "Responder" }).click();
  await page.getByRole("button", { name: /Siguiente enemigo/ }).click();
  await expect(ayudas.getByRole("button", { name: /50\/50 · tienes 0/ })).toBeDisabled();
  await ayudas.getByRole("button", { name: /Pista · gratis/ }).click();
  await expect(page.getByRole("note")).toBeVisible();
});

test("el registro muestra qué le falta a la contraseña", async ({ page }) => {
  await page.goto("/registro");
  const pass = page.locator("#password");
  await pass.fill("estrella");
  await expect(page.locator("#password-rules [data-cumple]")).toHaveCount(2);
  await expect(page.getByText("Un número (0-9)")).toBeVisible();
  expect(await pass.evaluate((e: HTMLInputElement) => e.validity.valid)).toBe(false);
  await pass.fill("estrella7");
  await expect(page.locator("#password-rules [data-cumple]")).toHaveCount(3);
  expect(await pass.evaluate((e: HTMLInputElement) => e.validity.valid)).toBe(true);
});

test("el docente crea una clase, el estudiante se une con el código y aparece en el informe", async ({ page, context }) => {
  // Un estudiante no puede entrar al panel del docente.
  await page.goto("/maestro");
  await expect(page).toHaveURL(/\/gremio$/);

  // En la vista previa, esta cookie entra como el docente de prueba.
  const asTeacher = { name: "umbral-vista", value: "docente", url: "http://localhost:3200" };
  await context.addCookies([asTeacher]);
  await page.goto("/maestro");
  await expect(page.getByRole("heading", { name: "Tus clases" })).toBeVisible();
  await page.getByLabel("Nombre de la clase").fill("6.º B · Ciencias");
  await page.getByRole("button", { name: "Crear clase" }).click();
  await expect(page.getByRole("heading", { name: "6.º B · Ciencias" })).toBeVisible();
  const code = (await page.getByLabel(/^Código de la clase/).textContent())!.trim();
  expect(code).toMatch(/^[A-Z2-9]{6}$/);

  await context.clearCookies({ name: "umbral-vista" });
  await page.goto("/perfil");
  await page.getByLabel("Código de la clase").fill(code.toLowerCase());
  await page.getByRole("button", { name: "Unirme" }).click();
  await expect(page.getByText("¡Listo! Ya estás en la clase «6.º B · Ciencias».")).toBeVisible();

  await context.addCookies([asTeacher]);
  await page.goto("/maestro");
  await page.getByRole("link", { name: /6\.º B · Ciencias/ }).click();
  await expect(page.getByRole("rowheader", { name: /Despertado/ })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: /Valentina \(demo\)/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Preguntas que más cuestan" })).toBeVisible();
  await expect(page.getByText("Respuesta correcta:").first()).toBeVisible();
  await context.clearCookies({ name: "umbral-vista" });
});

test("desde el ingreso se llega a recuperar la contraseña, y el cambio de contraseña pide las mismas reglas", async ({ page }) => {
  await page.goto("/recuperar");
  await expect(page.getByRole("heading", { name: "¿Olvidaste tu contraseña?" })).toBeVisible();
  await expect(page.getByLabel("Correo de tu cuenta")).toBeVisible();
  await page.goto("/nueva-contrasena");
  await page.locator("#password").fill("estrella");
  await expect(page.locator("#password-rules [data-cumple]")).toHaveCount(2);
  await page.goto("/perfil");
  await expect(page.getByRole("link", { name: /Cambiar mi contraseña/ })).toBeVisible();
});

test("el administrador crea docentes, activa cursos y pone precios", async ({ page, context }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/gremio$/); // un estudiante no entra al panel

  await context.addCookies([{ name: "umbral-vista", value: "admin", url: "http://localhost:3200" }]);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Administración" })).toBeVisible();

  await page.getByLabel("Nombre que verán sus estudiantes").fill("Profe Ana");
  await page.getByLabel("Correo del docente").fill("ana@colegio.edu.co");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByText("Contraseña temporal")).toBeVisible();
  await expect(page.getByText("ana@colegio.edu.co").first()).toBeVisible();

  // Activa el segundo curso para el estudiante de prueba.
  const student = page.locator("li", { hasText: "estudiante@vista-previa.co" });
  await student.getByLabel(/Curso para/).selectOption("portal-del-primer-intento");
  await student.getByRole("button", { name: "Activar" }).click();
  await expect(student.getByRole("button", { name: /Quitar acceso a El Portal del Primer Intento/ })).toBeVisible();

  await context.clearCookies({ name: "umbral-vista" });
  await page.goto("/mision/c2m2");
  await expect(page.getByText("Pregunta 1 de 4", { exact: true })).toBeVisible();
});

test("el administrador crea una clase con el editor, la publica y un estudiante juega la lección gratis", async ({ page, context }) => {
  await context.addCookies([{ name: "umbral-vista", value: "admin", url: "http://localhost:3200" }]);
  await page.goto("/admin/contenido");
  await page.getByLabel("Título").fill("Ciencias 5.° · 2027");
  await page.getByRole("button", { name: "Crear y editar" }).click();
  await expect(page.getByRole("heading", { name: "Ciencias 5.° · 2027" })).toBeVisible();

  // Datos de la clase
  await page.getByLabel("Área").fill("Ciencias Naturales");
  await page.getByLabel("Grado").selectOption("5.°");
  await page.getByLabel("Fin del año lectivo").fill("2027-11-30");
  await page.getByRole("button", { name: "Guardar datos" }).click();
  await expect(page.getByText("Guardado.")).toBeVisible();

  // Primera lección con una pregunta
  await page.getByLabel("Título de la lección").fill("Los seres vivos");
  await page.getByLabel("Periodo").selectOption("1");
  await page.getByRole("button", { name: "Crear lección" }).click();
  await page.locator("summary", { hasText: "Los seres vivos" }).click();
  await page.getByText("+ Agregar pregunta").click();
  await page.getByLabel("Pregunta", { exact: true }).fill("¿Cuál de estos es un ser vivo?");
  await page.getByLabel("Opción 1", { exact: true }).fill("Una piedra");
  await page.getByLabel("Opción 2", { exact: true }).fill("Un árbol");
  await page.getByLabel("La opción 2 es la correcta").check();
  await page.getByLabel("Explicación (se muestra al responder)").fill("Los árboles nacen, crecen y se reproducen.");
  await page.getByRole("button", { name: "Agregar pregunta" }).click();
  await expect(page.getByText("Pregunta agregada.")).toBeVisible();

  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByText("¡Publicado!")).toBeVisible();

  await context.clearCookies({ name: "umbral-vista" });
  await page.goto("/portales");
  await expect(page.getByRole("heading", { name: "Clases" })).toBeVisible();
  await page.getByRole("link", { name: /Ciencias 5\.° · 2027/ }).click();
  await expect(page.getByText("1.° periodo")).toBeVisible();
  await page.getByRole("link", { name: /Los seres vivos/ }).click();
  await page.locator("label:has(input[type=radio])").nth(1).click();
  await page.getByRole("button", { name: "Responder" }).click();
  await expect(page.getByText("Los árboles nacen, crecen y se reproducen.")).toBeVisible();
});

test("un código de grupo da acceso anual a la clase, y salir del grupo lo quita", async ({ page, context }) => {
  await context.addCookies([{ name: "umbral-vista", value: "admin", url: "http://localhost:3200" }]);
  await page.goto("/admin");
  await page.getByRole("combobox", { name: /^Clase/ }).selectOption({ label: "Ciencias 5.° · 2027" });
  await page.getByLabel("Nombre del grupo").fill("5.° A");
  await page.getByLabel("Docente que lo gestiona").selectOption({ label: "Profe de prueba" });
  await page.getByRole("button", { name: "Crear grupo" }).click();
  const msg = await page.getByText(/Grupo «5\.° A» creado\. Código: [A-Z2-9]{6}/).textContent();
  const code = msg!.match(/Código: ([A-Z2-9]{6})/)![1];

  await context.clearCookies({ name: "umbral-vista" });
  await page.goto("/perfil");
  await page.getByLabel("Código de la clase").fill(code);
  await page.getByRole("button", { name: "Unirme" }).click();
  await expect(page.getByText(/tienes acceso a «Ciencias 5\.° · 2027» hasta el 30 de noviembre de 2027/)).toBeVisible();
  await page.goto("/portales");
  await expect(page.locator("a", { hasText: "Ciencias 5.° · 2027" }).getByText("✔ Acceso anual activo")).toBeVisible();

  await page.goto("/perfil");
  page.once("dialog", (d) => d.accept());
  await page.locator("li", { hasText: "5.° A" }).getByRole("button", { name: "Salir" }).click();
  await expect(page.locator("li", { hasText: "5.° A" })).toHaveCount(0);
  await page.goto("/portales");
  await expect(page.locator("a", { hasText: "Ciencias 5.° · 2027" }).getByText(/Lección 1 gratis/)).toBeVisible();
});

test("al terminar un curso corto se expide la constancia, que se puede verificar públicamente", async ({ page, context }) => {
  // El administrador completa los datos del curso y configura su firma.
  await context.addCookies([{ name: "umbral-vista", value: "admin", url: "http://localhost:3200" }]);
  await page.goto("/admin/contenido/primer-portal");
  await page.getByLabel("Intensidad (horas)").fill("12");
  await page.getByLabel("Nombre del formador").fill("Jesús David Álvarez Sáez");
  await page.getByLabel("Título del formador").fill("Magíster en Educación");
  await page.getByRole("button", { name: "Guardar datos" }).click();
  await expect(page.getByText("Guardado.")).toBeVisible();
  await page.goto("/admin");
  await page.getByLabel("Ciudad de expedición").fill("Bogotá D. C.");
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
  await page.getByLabel(/^Firma \(PNG/).setInputFiles({ name: "firma.png", mimeType: "image/png", buffer: png });
  await expect(page.getByAltText("Vista previa de la firma")).toBeVisible();
  await page.getByRole("button", { name: "Guardar datos del responsable" }).click();
  await expect(page.getByText("Datos del responsable guardados.")).toBeVisible();

  // El estudiante ya terminó «El Portal de los Pasos Pequeños» en las pruebas anteriores.
  await context.clearCookies({ name: "umbral-vista" });
  await page.goto("/portales/primer-portal");
  await page.getByRole("link", { name: "Solicitar mi constancia" }).click();
  await page.getByLabel(/Nombre completo/).fill("Luna María Pérez Gómez");
  await page.getByLabel("Número de documento").fill("1012345678");
  await page.getByLabel(/Confirmo que mis datos son correctos/).check();
  await page.getByRole("button", { name: "Expedir mi constancia" }).click();
  await expect(page).toHaveURL(/\/constancia\/UMB-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  const doc = page.getByRole("article", { name: "Constancia de asistencia" });
  await expect(doc.getByText("Luna María Pérez Gómez")).toBeVisible();
  await expect(doc.getByText(/intensidad de 12 horas/)).toBeVisible();
  await expect(doc.getByText(/no conduce a título ni a certificado de aptitud ocupacional/)).toBeVisible();
  const code = page.url().split("/").pop()!;

  // Verificación pública (sin mostrar el documento completo).
  await page.goto(`/verificar/${code}`);
  await expect(page.getByRole("heading", { name: "Constancia auténtica" })).toBeVisible();
  await expect(page.getByText("C.C. ••••••5678")).toBeVisible();
  await page.goto("/verificar/UMB-AAAA-BBBB");
  await expect(page.getByRole("heading", { name: "No encontramos esa constancia" })).toBeVisible();
});

test("las páginas públicas cargan y la accesibilidad básica está presente", async ({ page }) => {
  for (const path of ["/privacidad", "/terminos"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  }
});

test("en el celular se puede editar el perfil y cerrar sesión", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto("/perfil");
  await page.getByRole("link", { name: /Editar perfil/ }).click();
  const name = page.getByLabel("Nombre de aventurero");
  await expect(name).toBeInViewport();
  await name.fill("Luna<3");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText(/Usa solo letras/)).toBeVisible();
  await name.fill("Luna Valiente");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("¡Listo! Tu nombre se actualizó.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Luna Valiente" })).toBeVisible();
  // Se deja como estaba para las demás pruebas.
  await name.fill("Despertado");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Despertado" })).toBeVisible();

  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  const headerLogout = page.locator("header").getByRole("button", { name: "Salir" });
  await expect(headerLogout).toBeVisible();
  await headerLogout.click();
  await expect(page).toHaveURL(/\/$/);
});
