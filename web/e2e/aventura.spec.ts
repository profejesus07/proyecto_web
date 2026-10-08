import { expect, test, type Locator, type Page } from "@playwright/test";

// Respuestas correctas del primer portal (índices de cada pregunta).
const CORRECT = { m1: [1, 1, 0, 1], m2: [0, 1, 1, 1], m3: [1, 1, 1, 0], m4: [1, 1, 1, 1, 1, 0], c2m1: [1, 0, 2, 0] };

/**
 * Elige una opción como lo haría una persona: toca su etiqueta visible (el radio es sr-only) y comprueba que
 * quedó marcada. Sin force: si algo la tapa (por ejemplo, la cabecera fija), Playwright reintenta en vez de
 * hacer clic encima de otro elemento.
 */
async function elegir(radio: Locator) {
  await radio.locator("xpath=ancestor::label[1]").click();
  await expect(radio).toBeChecked();
}

/*
 * AVISOS tras una acción que llama a router.refresh() («Ahora tienes 1», «¡Listo! Tu avatar se guardó.»,
 * «1 estudiante asignado.», «¡Enviado!…»): viven en el estado de React. Con `next dev`, la primera vez que se
 * compila una ruta, el servidor a veces recarga la página justo después de la acción y el aviso se pierde,
 * aunque la acción sí se guardó. Por eso estas pruebas comprueban el resultado que queda guardado (la mochila,
 * «Ya lo tienes», «Guardado», el estudiante en el grupo, los mensajes que quedan hoy). Si las e2e pasan a
 * correr contra la versión compilada, se pueden volver a comprobar los avisos.
 */

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

/** Captura opcional para comparar antes y después en un PR: solo si E2E_CAPTURAS indica una carpeta. */
async function captura(page: Page, nombre: string) {
  const dir = process.env.E2E_CAPTURAS;
  if (!dir) return;
  const original = page.viewportSize() ?? { width: 1280, height: 900 };
  for (const width of [original.width, 375]) {
    await page.setViewportSize({ width, height: original.height });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${dir}/${nombre}-${width}.png`, fullPage: true });
  }
  await page.setViewportSize(original);
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
  await expect(page.getByText(/Termina las 3 misiones/)).toBeVisible();
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
  test.setTimeout(60_000); // juega tres misiones seguidas
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
  // El diploma del juego se descarga con el nombre del estudiante.
  await expect(page.getByRole("heading", { name: "Mis diplomas" })).toBeVisible();
  await page.getByRole("link", { name: /Ver y descargar/ }).last().click();
  await expect(page).toHaveURL(/\/diploma\/primer-portal$/);
  await expect(page.getByRole("img", { name: /Diploma Sello del Portal de Despertado/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Descargar PDF/ })).toBeVisible();
  // Un portal sin terminar no tiene diploma.
  await page.goto("/diploma/portal-del-primer-intento");
  await expect(page.getByRole("heading", { name: "Este portal no existe" })).toBeVisible();
});

test("la tienda vende ayudas y accesorios que funcionan; lo comprado se viste en el Vestidor", async ({ page }) => {
  await page.goto("/tienda");
  const nav = page.getByRole("navigation", { name: "Categorías" });
  await expect(nav.getByRole("link", { name: "Poderes" })).toBeVisible();
  // Ningún artículo de la tienda está «Próximamente» (el pie sí lo dice de otras plataformas UNEX).
  await expect(page.getByRole("main").getByText(/Próximamente/)).toHaveCount(0);
  const card = (name: string) => page.locator("li").filter({ has: page.getByRole("heading", { name, exact: true }) });
  // Tras cada compra se comprueba lo que queda guardado (la mochila), no el aviso: ver AVISOS más arriba.
  await card("50/50").getByRole("button", { name: /Comprar/ }).click();
  await expect(card("50/50").getByText(/^En tu mochila: 1 \/ \d+$/)).toBeVisible();
  await card("Pista").getByRole("button", { name: /Comprar/ }).click();
  await expect(card("Pista").getByText(/^En tu mochila: 1 \/ \d+$/)).toBeVisible();

  // Una capa: se ve puesta en la tienda, se compra y se lleva al Vestidor.
  await nav.getByRole("link", { name: "Cosméticos" }).click();
  await expect(card("Capa de hojas").getByRole("img", { name: /Así te queda: Capa de hojas/ })).toHaveAttribute("src", /c=[^&]*K1/);
  await card("Capa de hojas").getByRole("button", { name: /Comprar/ }).click();
  await expect(card("Capa de hojas").getByText("Ya lo tienes")).toBeVisible();
  await card("Capa de hojas").getByRole("link", { name: /Póntelo en el Vestidor/ }).click();
  await expect(page).toHaveURL(/\/perfil\/avatar$/);
  await elegir(page.getByRole("group", { name: /^Capa/ }).getByRole("radio", { name: "Capa de hojas" }));
  await elegir(page.getByRole("group", { name: /Marco del retrato/ }).getByRole("radio", { name: "Marco básico" }));
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("button", { name: "Guardado", exact: true })).toBeVisible();
  await page.goto("/perfil");
  await expect(page.getByRole("img", { name: /Tu avatar/ })).toHaveAttribute("src", /c=[^&]*K1/);
  // Lo que no tiene no aparece para ponérselo.
  await page.goto("/perfil/avatar");
  await expect(page.getByRole("radio", { name: "Capa real" })).toHaveCount(0);

  // Decoración: un regalo para la Terraza del Hogar, que se ve en el perfil.
  await page.goto("/tienda?c=decoracion");
  await card("Macetas en flor").getByRole("button", { name: /Comprar/ }).click();
  await expect(card("Macetas en flor").getByText("¡Conseguiste Macetas en flor!")).toBeVisible();
  await page.goto("/perfil");
  await expect(page.getByRole("img", { name: "Macetas en flor" }).first()).toBeVisible();
});

test("la tienda de poderes muestra cuáles se desbloquean al subir de rango", async ({ page }) => {
  await page.goto("/tienda?c=poder");
  const card = (name: string) => page.locator("li").filter({ has: page.getByRole("heading", { name, exact: true }) });
  await expect(card("Sombra Dorada")).toHaveCount(0);
  await expect(card("Aura de Concentración").getByText(/Se desbloquea en rango B/)).toBeVisible();
  // Comprar y usar un poder lo cubre «una misión completa…», con el Rayo de Claridad.
});

test("una misión completa: poder, acierto, error, 50/50, pista y la pantalla de recompensa", async ({ page }) => {
  // Va después de la prueba de la tienda (que compró un 50/50) y antes de jugar la lección gratis del segundo
  // curso, así la misión se supera por primera vez y muestra sus recompensas. Respuestas de c2m1: [1, 0, 2, 0].
  // Las monedas de la suite están contadas: aquí se compra el Rayo y se usa el 50/50 ya comprado.
  await page.goto("/tienda?c=poder");
  const card = (name: string) => page.locator("li").filter({ has: page.getByRole("heading", { name, exact: true }) });
  await card("Rayo de Claridad").getByRole("button", { name: /Comprar/ }).click();
  await expect(card("Rayo de Claridad").getByText(/^En tu mochila: 1 \/ \d+$/)).toBeVisible();
  await captura(page, "mision-tienda");

  await page.goto("/mision/c2m1");
  await expect(page.getByText("Pregunta 1 de 4", { exact: true })).toBeVisible();
  const opcion = (i: number) => page.locator("label:has(input[type=radio])").nth(i);
  const ayudas = page.getByRole("group", { name: "Ayudas" });
  const poderes = page.getByRole("group", { name: "Poderes" });
  await captura(page, "mision-inicio");

  // Pregunta 1: un poder (Rayo de Claridad) y acierto. Al gastar la única unidad, el grupo de poderes desaparece.
  await poderes.getByRole("button", { name: /Rayo de Claridad · 1/ }).click();
  await expect(page.getByText(/El Rayo de Claridad (ilumina|te susurra)/)).toBeVisible();
  await expect(page.locator("h2 mark").first().or(page.getByText(/Fíjate en esto/))).toBeVisible();
  await captura(page, "mision-poder");
  await expect(poderes).toHaveCount(0);
  await opcion(1).click();
  await page.getByRole("button", { name: /Responder|Lanzar ataque/ }).click();
  await expect(page.locator("#feedback")).toBeVisible();
  await expect(page.locator("label[data-correcta]")).toHaveCount(1);
  await captura(page, "mision-acierto");
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // Pregunta 2: error.
  await expect(page.getByText("Pregunta 2 de 4", { exact: true })).toBeVisible();
  await opcion(1).click();
  await page.getByRole("button", { name: /Responder|Lanzar ataque/ }).click();
  await expect(page.getByText("¡Uy, no era esa!")).toBeVisible();
  await captura(page, "mision-error");
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // Pregunta 3: 50/50, pista y acierto.
  await expect(page.getByText("Pregunta 3 de 4", { exact: true })).toBeVisible();
  await ayudas.getByRole("button", { name: /50\/50 · tienes 1/ }).click();
  await expect(ayudas.getByText("50/50 usado")).toBeVisible();
  await expect(page.locator("label[data-descartada]")).toHaveCount(2);
  await expect(opcion(2)).not.toHaveAttribute("data-descartada");
  await ayudas.getByRole("button", { name: /Pista · gratis/ }).click();
  await expect(page.getByRole("note")).toBeVisible();
  await captura(page, "mision-ayudas");
  await opcion(2).click();
  await page.getByRole("button", { name: /Responder|Lanzar ataque/ }).click();
  await expect(page.locator("#feedback")).toBeVisible();
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // Pregunta 4: el 50/50 ya no tiene unidades; acierto y fin de la misión (3 de 4, 75 %).
  await expect(page.getByText("Pregunta 4 de 4", { exact: true })).toBeVisible();
  await expect(ayudas.getByRole("button", { name: /50\/50 · tienes 0/ })).toBeDisabled();
  await opcion(0).click();
  await page.getByRole("button", { name: /Responder|Lanzar ataque/ }).click();
  await expect(page.locator("#feedback")).toBeVisible();
  await page.getByRole("button", { name: /Terminar misión|Purificar al Guardián/ }).click();

  // La recompensa: misión superada, XP y monedas, y el repaso con el acierto y el error.
  await expect(page.getByRole("heading", { name: "¡Misión superada!" })).toBeVisible();
  const recompensas = page.getByRole("list", { name: "Recompensas" });
  await expect(recompensas.getByText("+60 XP")).toBeVisible();
  await expect(recompensas.getByText(/\+\d+/).nth(1)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Repaso de tus respuestas" })).toBeVisible();
  await expect(page.getByText("Correcta.", { exact: false }).first()).toBeAttached();
  await expect(page.getByText("Incorrecta.", { exact: false }).first()).toBeAttached();
  await captura(page, "mision-recompensa");
});

test("al superar la lección gratis se ofrece desbloquear el curso", async ({ page }) => {
  await play(page, "c2m1", CORRECT.c2m1);
  await expect(page.getByText("¡Superaste la lección gratis!")).toBeVisible();
  await page.getByRole("link", { name: /Desbloquear el curso/ }).click();
  await expect(page).toHaveURL(/\/suscribirse\/portal-del-primer-intento$/);
  await expect(page.getByRole("link", { name: /Escribir para suscribirme/ })).toHaveAttribute("href", /^mailto:unexeducation07@gmail\.com/);
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

test("el administrador asigna estudiantes a un docente, que supervisa su avance y no juega", async ({ page, context }) => {
  // Un estudiante no puede entrar al panel del docente.
  await page.goto("/maestro");
  await expect(page).toHaveURL(/\/gremio$/);

  // El administrador crea un grupo de seguimiento para el docente y le asigna al estudiante.
  const asAdmin = { name: "umbral-vista", value: "admin", url: "http://localhost:3200" };
  await context.addCookies([asAdmin]);
  await page.goto("/admin/grupos");
  await page.getByLabel("Nombre del grupo").fill("6.º B · Ciencias");
  await page.getByLabel("Docente que lo supervisa").selectOption({ label: "Profe de prueba" });
  await page.getByRole("button", { name: "Crear grupo" }).click();
  await page.getByRole("link", { name: "Asignar estudiantes →" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "6.º B · Ciencias" })).toBeVisible();
  await page.getByLabel("Asignar a Despertado").check();
  await page.getByRole("button", { name: "Asignar (1)" }).click();
  await expect(page.getByRole("region", { name: "Estudiantes del grupo" }).getByText("Despertado")).toBeVisible();
  await context.clearCookies({ name: "umbral-vista" });

  // El docente ve el grupo en su panel, con el informe y el detalle de cada estudiante.
  const asTeacher = { name: "umbral-vista", value: "docente", url: "http://localhost:3200" };
  await context.addCookies([asTeacher]);
  await page.goto("/maestro");
  await expect(page.getByRole("heading", { level: 1, name: "Resumen" })).toBeVisible();
  await expect(page.getByText("Estudiantes asignados")).toBeVisible();
  await page.getByRole("main").getByRole("link", { name: /6\.º B · Ciencias/ }).click();
  await expect(page.getByRole("rowheader", { name: /Despertado/ })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: /Valentina \(demo\)/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Preguntas que más cuestan" })).toBeVisible();
  await expect(page.getByText("Respuesta correcta:").first()).toBeVisible();
  // Solo supervisa: no gestiona el grupo.
  await expect(page.getByRole("button", { name: /^Quitar a/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Nuevo código" })).toHaveCount(0);
  await page.getByRole("link", { name: "Valentina (demo)" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Valentina (demo)" })).toBeVisible();
  await expect(page.getByText("Promedio de notas")).toBeVisible();

  // El docente no juega: las páginas del juego lo llevan a su panel.
  for (const path of ["/gremio", "/portales", "/mision/m1", "/tienda", "/perfil"]) {
    await page.goto(path);
    await expect(page, `${path} debe llevar al panel docente`).toHaveURL(/\/maestro$/);
  }
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

  await page.getByRole("navigation", { name: "Consola" }).getByRole("link", { name: "Personas" }).click();
  await expect(page).toHaveURL(/\/admin\/personas$/);
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
  await page.getByText("+ Agregar actividad").click();
  await page.getByLabel("Pregunta", { exact: true }).fill("¿Cuál de estos es un ser vivo?");
  await page.getByLabel("Opción 1", { exact: true }).fill("Una piedra");
  await page.getByLabel("Opción 2", { exact: true }).fill("Un árbol");
  await page.getByLabel("La opción 2 es la correcta").check();
  await page.getByLabel("Explicación (se muestra al responder)").fill("Los árboles nacen, crecen y se reproducen.");
  await page.getByRole("button", { name: "Agregar actividad" }).click();
  await expect(page.getByText("Actividad agregada.")).toBeVisible();

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
  await page.goto("/admin/grupos");
  await page.getByRole("combobox", { name: /^Clase/ }).selectOption({ label: "Ciencias 5.° · 2027" });
  await page.getByLabel("Nombre del grupo").fill("5.° A");
  await page.getByLabel("Docente que lo supervisa").selectOption({ label: "Profe de prueba" });
  await page.getByRole("button", { name: "Crear grupo" }).click();
  const msg = await page.getByText(/Grupo «5\.° A» creado\. Código: [A-Z2-9]{6}/).textContent();
  const code = msg!.match(/Código: ([A-Z2-9]{6})/)![1];

  await context.clearCookies({ name: "umbral-vista" });
  await page.goto("/perfil");
  await page.getByLabel("Código de la clase").fill(code);
  await page.getByRole("button", { name: "Unirme" }).click();
  await expect(page.getByText(/tienes acceso a «Ciencias 5\.° · 2027» hasta el 30 de noviembre de 2027/)).toBeVisible();
  await page.goto("/portales");
  await expect(page.locator("a", { hasText: "Ciencias 5.° · 2027" }).getByText("Acceso anual activo")).toBeVisible();

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
  await page.goto("/admin/constancias");
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

  // Verificación con el código QR: se sube una foto del QR y lleva a la constancia.
  const QRCode = await import("qrcode");
  const qr = await QRCode.toBuffer(`http://localhost:3200/verificar/${code}`, { width: 360 });
  await page.goto("/verificar");
  await page.getByText("Subir foto del QR").setInputFiles({ name: "qr.png", mimeType: "image/png", buffer: qr });
  await expect(page).toHaveURL(new RegExp(`/verificar/${code}$`));
  await expect(page.getByRole("heading", { name: "Constancia auténtica" })).toBeVisible();

  // El administrador la ve en su consola, tal como la recibió el estudiante.
  await context.addCookies([{ name: "umbral-vista", value: "admin", url: "http://localhost:3200" }]);
  await page.goto("/admin/constancias");
  await page.getByRole("link", { name: "Ver la constancia de Luna María Pérez Gómez" }).click();
  await expect(page.getByRole("article", { name: "Constancia de asistencia" }).getByText("Luna María Pérez Gómez")).toBeVisible();
  await context.clearCookies({ name: "umbral-vista" });
});

test("Kael reta en cada misión y lleva el marcador de duelos en el Gremio", async ({ page }) => {
  await page.goto("/mision/m1");
  await expect(page.getByText(/Yo saqué \d+% en esta misión/)).toBeVisible();
  await page.goto("/gremio");
  const kael = page.getByRole("region", { name: "Kael, tu rival" });
  await expect(kael.getByText(/Tú \d+ · Kael \d+/)).toBeVisible();
});

test("el Bestiario registra las criaturas encontradas y deja en sombra a los Guardianes sin portal", async ({ page }) => {
  await page.goto("/cronicas");
  await page.getByRole("link", { name: /Abrir el Bestiario/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Bestiario" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Slime Confuso" })).toBeVisible();
  await expect(page.getByText(/Confundir:/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Petrox" })).toBeVisible();
  await expect(page.getByText("Rango S · Aún sin portal")).toBeVisible();
});

test("la portada presenta los cursos, el encabezado lleva a las secciones y a las plataformas, y los filtros ordenan el catálogo", async ({ page }) => {
  await page.goto("/");
  // Portada: la bienvenida de Kuro, con el estilo del Gremio.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bienvenido al Gremio");
  await expect(page.getByRole("img", { name: "Kuro te da la bienvenida" })).toBeVisible();
  // Los universos: primero el Gremio de los Portales con sus cursos; los demás, una sola tarjeta «Próximamente».
  // Ningún curso se anuncia como «Próximamente».
  await expect(page.getByRole("heading", { level: 2, name: "Elige tu universo" })).toBeVisible();
  const gremio = page.getByRole("article", { name: "El Gremio de los Portales" });
  await expect(gremio.getByRole("region", { name: "Cursos para empezar" })).toBeVisible();
  await expect(page.getByRole("main").getByText("Próximamente")).toHaveCount(1);
  await expect(page.getByRole("article", { name: "Nuevos universos en camino" }).getByText("Próximamente")).toBeVisible();
  await expect(page.getByRole("search")).toHaveCount(0);
  await expect(page.locator("header").getByRole("link", { name: "Ingresar" })).toHaveAttribute("href", "/ingresar");
  const destacados = page.getByRole("region", { name: "Cursos para empezar" });
  await expect(destacados.getByRole("link", { name: /El Portal de los Pasos Pequeños/ })).toBeVisible();

  // El encabezado: tres secciones, el selector de plataformas (Academy marcada) y Crear cuenta.
  const encabezado = page.locator("header");
  const menu = encabezado.getByRole("navigation", { name: "Secciones" }).first();
  await expect(menu.getByRole("link")).toHaveText(["Cursos", "Cómo se juega", "Familias y docentes"]);
  await expect(encabezado.getByRole("link", { name: "Crear cuenta" }).first()).toHaveAttribute("href", "/registro");
  await encabezado.getByText("Plataformas", { exact: true }).click();
  const plataformas = encabezado.getByRole("list", { name: "Plataformas UNEX" }).first();
  await expect(plataformas.getByRole("link", { name: "UNEX Academy" })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(plataformas).toBeHidden();
  await menu.getByRole("link", { name: "Cursos" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Cursos" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Cursos" })).toHaveAttribute("aria-current", "page");

  for (const [seccion, titulo] of [["Cómo se juega", "Aprender es una aventura"], ["Familias y docentes", "Acompañar a quien aprende"]]) {
    await menu.getByRole("link", { name: seccion }).click();
    await expect(page.getByRole("heading", { level: 1, name: titulo })).toBeVisible();
    await expect(menu.getByRole("link", { name: seccion })).toHaveAttribute("aria-current", "page");
    if (seccion === "Cómo se juega") {
      await expect(page.getByRole("heading", { name: "Los Guardianes" })).toBeVisible();
      // Los 8 Guardianes del juego, cada uno con su obstáculo.
      const guardianes = page.getByRole("region", { name: "Los Guardianes" }).getByRole("listitem");
      await expect(guardianes).toHaveCount(8);
      await expect(guardianes.filter({ hasText: "Zhaal, el Vacío" })).toContainText("Su obstáculo: Todo lo anterior.");
      await expect(page.getByRole("heading", { name: "¿Todo listo para cruzar tu primer portal?" })).toBeVisible();
    } else {
      // Los enlaces de la franja llevan a cada sección de la página.
      await page.getByRole("link", { name: "Para docentes e instituciones" }).click();
      await expect(page).toHaveURL(/#docentes$/);
      await expect(page.getByRole("heading", { level: 2, name: "Para docentes e instituciones" })).toBeInViewport();
      await expect(page.getByRole("heading", { name: "Cómo vincularte" })).toBeVisible();
    }
  }

  // El pie público: las secciones, la cuenta y las plataformas UNEX.
  const pie = page.getByRole("contentinfo");
  await expect(pie.getByRole("navigation", { name: "UNEX Academy" }).getByRole("link")).toHaveText(["Cursos", "Cómo se juega", "Familias y docentes"]);
  await expect(pie.getByRole("link", { name: "Verificar una constancia" })).toHaveAttribute("href", "/verificar");
  await expect(pie.getByRole("navigation", { name: "Plataformas UNEX" }).getByRole("link", { name: "UNEX Education" })).toBeVisible();

  // Proyectos se quitó: su dirección redirige a los cursos. Servicios ya no está en el menú, pero su página sigue.
  const redireccion = await page.request.get("/proyectos", { maxRedirects: 0 });
  expect(redireccion.status()).toBe(308);
  expect(redireccion.headers()["location"]).toBe("/programas");
  await page.goto("/proyectos");
  await expect(page).toHaveURL(/\/programas$/);
  await expect(page.getByRole("heading", { level: 1, name: "Cursos" })).toBeVisible();
  await page.goto("/servicios");
  await expect(page.getByRole("heading", { level: 1, name: /Tecnología educativa/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Plataforma institucional de exámenes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Plataformas de gestión docente" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Escribir a unexeducation07@gmail\.com/ })).toHaveAttribute("href", /^mailto:/);

  // Los filtros del catálogo.
  await page.goto("/programas?tipo=clase");
  await expect(page.getByRole("link", { name: "El Portal del Primer Intento" })).toHaveCount(0);

  // Catálogo, preguntas frecuentes y ficha del programa.
  await page.goto("/programas");
  await expect(page.getByRole("heading", { level: 1, name: "Cursos" })).toBeVisible();
  await page.getByText("¿Cuánto cuesta?").click();
  // La misma respuesta que en «Cómo se juega» (content/preguntas-frecuentes.ts), sin medios de pago.
  await expect(page.getByText("En cada curso verás si es gratis o cuánto cuesta.", { exact: false })).toBeVisible();
  await expect(page.getByRole("main").getByText(/wompi|mercado pago|nequi|\bPSE\b/i)).toHaveCount(0);
  await page.getByRole("link", { name: "El Portal del Primer Intento" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "El Portal del Primer Intento" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contenido" })).toBeVisible();
  await expect(page.getByText("Gratis", { exact: true }).first()).toBeVisible();
  // Con sesión iniciada, el botón lleva directo al programa.
  await page.getByRole("link", { name: "Ir al programa" }).click();
  await expect(page).toHaveURL(/\/portales\/portal-del-primer-intento$/);
  await page.goto("/programas/no-existe");
  await expect(page.getByRole("heading", { name: "Este portal no existe" })).toBeVisible();
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

test("en el Vestidor se cambian los colores del avatar y los atuendos de rangos no alcanzados están cerrados", async ({ page }) => {
  await page.goto("/perfil");
  await page.getByRole("link", { name: /Personalizar avatar/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Vestidor" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Armadura de leyenda, rango S, bloqueado/ })).toBeDisabled();

  await elegir(page.getByRole("group", { name: /Cabello/ }).getByRole("radio", { name: "Rubio" }));
  await elegir(page.getByRole("group", { name: /Chaqueta/ }).getByRole("radio", { name: "Rojo" }));
  await elegir(page.getByRole("group", { name: "Peinados femeninos" }).getByRole("radio", { name: "Dos trenzas" }));
  await expect(page.getByRole("group", { name: "Peinados masculinos" }).getByRole("radio")).toHaveCount(7);
  await expect(page.getByRole("img", { name: /Vista previa/ })).toHaveAttribute("src", /\/avatar\/.+c=h4t3y9/);
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("button", { name: "Guardado", exact: true })).toBeVisible();

  // La imagen con colores se sirve como SVG.
  const res = await page.request.get("/avatar/aria/aria-rango-e-reposo.svg?c=h4t3");
  expect(res.headers()["content-type"]).toContain("image/svg+xml");
  expect(await res.text()).toContain('fill="#E2B85A"');

  await page.goto("/perfil");
  await expect(page.getByRole("img", { name: /Tu avatar/ })).toHaveAttribute("src", /c=h4t3y9/);

  // Se deja como estaba para las demás pruebas.
  await page.goto("/perfil/avatar");
  await page.getByRole("button", { name: "Colores originales" }).click();
  await elegir(page.getByRole("group", { name: "Peinados masculinos" }).getByRole("radio", { name: "Original" }));
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("button", { name: "Guardado", exact: true })).toBeVisible();
});

test("la familia se vincula con el código del estudiante, ve su avance y el estudiante puede quitarla", async ({ page, context }) => {
  const asFamily = { name: "umbral-vista", value: "familia", url: "http://localhost:3200" };
  // El estudiante muestra su código en el perfil.
  await page.goto("/perfil");
  await page.getByRole("button", { name: /Mostrar mi código de familia/ }).click();
  const code = (await page.getByLabel(/Tu código de familia/).textContent())!.trim();
  expect(code).toMatch(/^[A-Z2-9]{8}$/);

  // Un estudiante no entra al panel de familias.
  await page.goto("/familia");
  await expect(page).toHaveURL(/\/gremio$/);

  await context.addCookies([asFamily]);
  await page.goto("/gremio");
  await page.getByRole("link", { name: "Ir a Mi familia" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Mi familia" })).toBeVisible();
  await page.getByLabel("Código de familia").fill("XXXX-YYYY");
  await page.getByRole("button", { name: "Vincular" }).click();
  await expect(page.getByText(/Ese código no existe/)).toBeVisible();
  await page.getByLabel("Código de familia").fill(`${code.slice(0, 4).toLowerCase()} ${code.slice(4)}`);
  await page.getByRole("button", { name: "Vincular" }).click();
  await expect(page.getByText("¡Listo! Ya acompañas a Despertado.")).toBeVisible();
  // Para la familia, el logo lleva a «Mi familia».
  await expect(page.locator("header").getByRole("link").first()).toHaveAttribute("href", "/familia");
  await page.reload();
  const card = page.getByRole("article", { name: "Despertado" });
  await expect(card).toBeVisible();
  // Las pruebas anteriores ya jugaron el primer portal.
  await expect(card.getByRole("progressbar", { name: "Avance en El Portal de los Pasos Pequeños" })).toBeVisible();
  const portal = card.locator("li").filter({ has: page.getByRole("progressbar", { name: "Avance en El Portal de los Pasos Pequeños" }) });
  await expect(portal.getByText(/L1 · 100%\s*superada/)).toBeVisible();

  // La terraza muestra el regalo que el estudiante compró en la tienda.
  await expect(page.getByRole("region", { name: "La Terraza del Hogar" }).getByRole("img", { name: "Macetas en flor" })).toBeVisible();

  // La familia elige su Guardián del Hogar y envía un mensaje de apoyo.
  await elegir(page.getByRole("radio", { name: "Papá Kenji" }));
  await expect(page.locator("header").getByRole("link", { name: /Tu perfil/ })).toBeVisible();
  await card.getByText("¿Me cuentas hoy qué aprendiste?").click();
  const quedan = card.getByText(/^Te quedan \d+ hoy\.$|^Ya enviaste los mensajes de hoy\.$/);
  const antes = await quedan.textContent();
  await card.getByRole("button", { name: /Enviar/ }).click();
  await expect(quedan).not.toHaveText(antes!);

  // El estudiante lo ve en el Gremio, con el Guardián de su familia, y da las gracias.
  await context.clearCookies({ name: "umbral-vista" });
  await page.goto("/gremio");
  const inbox = page.getByRole("region", { name: /mensaje de tu familia/i });
  await expect(inbox.getByText("¿Me cuentas hoy qué aprendiste?")).toBeVisible();
  await expect(inbox.getByRole("img", { name: "Papá Kenji" })).toBeVisible();
  await inbox.getByRole("button", { name: /Gracias/ }).click();
  await expect(inbox).toHaveCount(0);

  // El estudiante ve quién lo acompaña y lo quita.
  await context.clearCookies({ name: "umbral-vista" });
  await page.goto("/perfil");
  const row = page.locator("li", { hasText: "Familia de prueba" });
  await expect(row).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "Quitar" }).click();
  await expect(row).toHaveCount(0);

  await context.addCookies([asFamily]);
  await page.goto("/familia");
  await expect(page.getByRole("heading", { name: "Vincula a tu hijo o hija" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  await context.clearCookies({ name: "umbral-vista" });
});

test("se paga un curso en línea: un pago rechazado no abre nada y uno aprobado abre el curso al momento", async ({ page, context }) => {
  const asAdmin = { name: "umbral-vista", value: "admin", url: "http://localhost:3200" };
  // El administrador quita el acceso que dio a mano en una prueba anterior.
  await context.addCookies([asAdmin]);
  await page.goto("/admin/personas");
  const student = page.locator("li", { hasText: "estudiante@vista-previa.co" });
  page.once("dialog", (d) => d.accept());
  await student.getByRole("button", { name: /Quitar acceso a El Portal del Primer Intento/ }).click();
  await expect(student.getByRole("button", { name: /Quitar acceso a El Portal del Primer Intento/ })).toHaveCount(0);
  await page.goto("/admin/pagos");
  await expect(page.getByRole("heading", { name: "Pagos en línea" })).toBeVisible();
  await expect(page.getByText("Todavía no hay pagos.")).toBeVisible();
  await context.clearCookies({ name: "umbral-vista" });

  // Primer intento: la pasarela lo rechaza.
  await page.goto("/suscribirse/portal-del-primer-intento");
  await expect(page.getByText(/25\.000/).first()).toBeVisible();
  await expect(page.getByText(/Modo de prueba/)).toBeVisible();
  await page.getByRole("button", { name: "Pagar con Wompi" }).click();
  await expect(page).toHaveURL(/\/pago\/simulado\?ref=UMB-/);
  await page.getByRole("button", { name: "Rechazarlo" }).click();
  await expect(page.getByRole("heading", { name: /El pago no se aprobó/ })).toBeVisible();
  await page.goto("/mision/c2m2");
  await expect(page).toHaveURL(/\/portales\/portal-del-primer-intento$/);

  // Segundo intento con Mercado Pago: queda pendiente y luego se aprueba.
  await page.goto("/suscribirse/portal-del-primer-intento");
  await page.getByRole("button", { name: "Pagar con Mercado Pago" }).click();
  await page.getByRole("button", { name: "Dejarlo pendiente" }).click();
  await expect(page.getByRole("heading", { name: /Tu pago está en proceso/ })).toBeVisible();
  const ref = page.url().split("/pago/")[1];
  await page.goto("/suscribirse/portal-del-primer-intento");
  await expect(page.getByText(/Tienes un pago en proceso/)).toBeVisible();
  await page.goto(`/pago/simulado?ref=${ref}`);
  await page.getByRole("button", { name: "Aprobar el pago" }).click();
  await expect(page.getByRole("heading", { name: /¡Pago aprobado!/ })).toBeVisible();
  await expect(page.getByText(ref)).toBeVisible();
  await page.getByRole("link", { name: "Continuar el curso" }).click();
  await page.goto("/mision/c2m2");
  await expect(page.getByText("Pregunta 1 de 4", { exact: true })).toBeVisible();
  await page.goto("/suscribirse/portal-del-primer-intento");
  await expect(page.getByText("Ya tienes este curso completo.")).toBeVisible();

  // Nadie más ve el estado de ese pago, y el administrador lo ve en su lista.
  await context.addCookies([asAdmin]);
  // (la cuenta de administración no abre páginas del juego: va a su consola)
  await page.goto(`/pago/${ref}`);
  await expect(page).toHaveURL(/\/admin$/);
  // El resumen muestra el pago y la sección de pagos lo detalla.
  await expect(page.getByRole("region", { name: "Últimos pagos" })).toContainText("Aprobado");
  await page.goto("/admin/pagos");
  const table = page.getByRole("table");
  await expect(table.getByRole("row").filter({ hasText: ref })).toContainText("Aprobado");
  await expect(table.getByRole("row").filter({ hasText: "Wompi" })).toContainText("Rechazado");
  await context.clearCookies({ name: "umbral-vista" });
});

test("el administrador elimina un grupo, un docente y un curso, siempre confirmando con ELIMINAR", async ({ page, context }) => {
  await context.addCookies([{ name: "umbral-vista", value: "admin", url: "http://localhost:3200" }]);
  await page.goto("/admin/grupos");

  // Grupo «5.° A» (creado en una prueba anterior).
  const grupos = page.getByRole("region", { name: "Todos los grupos" });
  await grupos.getByRole("button", { name: "Eliminar grupo 5.° A" }).click();
  const dialog = page.getByRole("dialog", { name: /¿Eliminar el grupo «5\.° A»\?/ });
  await expect(dialog).toBeVisible();
  const confirm = dialog.getByRole("button", { name: "Eliminar definitivamente" });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel(/para confirmar/).fill("eliminar");
  await confirm.click();
  await expect(grupos.getByRole("button", { name: "Eliminar grupo 5.° A" })).toHaveCount(0);

  // Cuenta de docente «Profe Ana»; el administrador no tiene botón para eliminarse.
  await page.goto("/admin/personas");
  const ana = page.locator("li", { hasText: "ana@colegio.edu.co" });
  await ana.getByRole("button", { name: /Eliminar cuenta/ }).click();
  const d2 = page.getByRole("dialog", { name: /Profe Ana/ });
  await d2.getByLabel(/para confirmar/).fill("ELIMINAR");
  await d2.getByRole("button", { name: "Eliminar definitivamente" }).click();
  await expect(page.locator("li", { hasText: "ana@colegio.edu.co" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Eliminar cuenta Admin de prueba/ })).toHaveCount(0);

  // Curso «Ciencias 5.° · 2027» desde Contenido; cancelar no borra nada.
  await page.goto("/admin/contenido");
  await page.getByRole("button", { name: "Eliminar curso Ciencias 5.° · 2027" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("link", { name: /Ciencias 5\.° · 2027/ })).toBeVisible();
  await page.getByRole("button", { name: "Eliminar curso Ciencias 5.° · 2027" }).click();
  const d3 = page.getByRole("dialog", { name: /Ciencias 5\.° · 2027/ });
  await d3.getByLabel(/para confirmar/).fill("ELIMINAR");
  await d3.getByRole("button", { name: "Eliminar definitivamente" }).click();
  await expect(page.getByRole("link", { name: /Ciencias 5\.° · 2027/ })).toHaveCount(0);
  await page.goto("/programas");
  await expect(page.getByText("Ciencias 5.° · 2027")).toHaveCount(0);
  await context.clearCookies({ name: "umbral-vista" });
});

test("un curso corto por módulos, con actividades variadas, un Guardián por módulo y ofrecido gratis", async ({ page, context }) => {
  test.setTimeout(90_000);
  await context.addCookies([{ name: "umbral-vista", value: "admin", url: "http://localhost:3200" }]);
  await page.goto("/admin/contenido");
  await page.getByText("Curso corto", { exact: true }).click();
  await page.getByLabel("Título").fill("Ciencia en acción");
  await page.getByRole("button", { name: "Crear y editar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Ciencia en acción" })).toBeVisible();
  await page.getByLabel("Intensidad (horas)").fill("10");
  await page.getByLabel("Nombre del formador").fill("Ana Pérez Ríos");
  await page.getByLabel("Título del formador").fill("Licenciada en Biología");
  await page.getByRole("button", { name: "Guardar datos" }).click();
  await expect(page.getByText("Guardado.")).toBeVisible();

  const details = (text: string) => page.locator("details", { has: page.locator(":scope > summary", { hasText: text }) });
  async function addLesson(module: string, title: string, { boss = false, reading = "" } = {}) {
    const d = details(`+ Agregar lección a «${module}»`);
    if (!(await d.getAttribute("open").then((v) => v !== null))) await d.locator(":scope > summary").click();
    await d.getByText(reading ? "Explicación (para leer)" : "Reto (actividades)").click();
    await d.getByLabel("Título de la lección").fill(title);
    if (reading) await d.getByRole("textbox", { name: /^Explicación/ }).fill(reading);
    if (boss) await d.getByLabel(/prueba del Guardián del módulo/).check();
    await d.getByRole("button", { name: "Crear lección" }).click();
    await expect(page.locator("summary", { hasText: title })).toBeVisible();
  }
  async function addActivity(lesson: string, fill: (form: ReturnType<typeof page.locator>) => Promise<void>) {
    const l = details(lesson).first();
    if (!(await l.getAttribute("open").then((v) => v !== null))) await l.locator(":scope > summary").click();
    const d = l.locator("details", { has: page.locator(":scope > summary", { hasText: "+ Agregar actividad" }) });
    if (!(await d.getAttribute("open").then((v) => v !== null))) await d.locator(":scope > summary").click();
    const added = l.locator("summary", { hasText: /^\d+\. \[/ });
    const before = await added.count();
    await fill(d);
    await d.getByRole("button", { name: "Agregar actividad" }).click();
    await expect(added).toHaveCount(before + 1);
  }

  // El curso empieza con su Módulo 1: se renombra y se agrega un segundo módulo con otro Guardián.
  const mod1 = details("Editar módulo").first();
  await mod1.locator(":scope > summary").click();
  await mod1.getByLabel("Título del módulo").fill("Seres vivos");
  await mod1.getByRole("button", { name: "Guardar módulo" }).click();
  await expect(page.getByText("Módulo guardado.")).toBeVisible();
  // Cada módulo empieza con su lección de explicación.
  await addLesson("Seres vivos", "Qué es la vida", { reading: "Todos los seres vivos nacen, crecen, se reproducen y mueren.\n\n- Están hechos de **células**." });
  await addLesson("Seres vivos", "La célula");
  await addLesson("Seres vivos", "Prueba de Petrox", { boss: true });
  const newMod = details("+ Agregar módulo");
  await newMod.locator(":scope > summary").click();
  await newMod.getByLabel("Título del módulo").fill("Energía");
  await newMod.getByLabel("Guardián del módulo").selectOption("ignaris");
  await newMod.getByRole("button", { name: "Crear módulo" }).click();
  await expect(page.getByText("Módulo creado.")).toBeVisible();
  await addLesson("Energía", "¿Qué es la energía?", { reading: "La energía es la capacidad de producir cambios: mover, calentar o iluminar." });
  await addLesson("Energía", "Prueba de Ignaris", { boss: true });

  // Actividades de cada tipo.
  await addActivity("La célula", async (f) => {
    await f.getByLabel("Tipo de actividad").selectOption("vf");
    await f.getByLabel("Afirmación").fill("Todos los seres vivos están hechos de células.");
    await f.getByLabel("Verdadera").check();
  });
  await addActivity("La célula", async (f) => {
    await f.getByLabel("Tipo de actividad").selectOption("completar");
    await f.getByLabel(/^Pregunta \(puedes usar/).fill("El centro de control de la célula es el ___.");
    await f.getByLabel(/Respuestas aceptadas/).fill("núcleo\nel núcleo");
  });
  await addActivity("La célula", async (f) => {
    await f.getByLabel("Tipo de actividad").selectOption("ordenar");
    await f.getByLabel("Instrucción").fill("Ordena de lo más pequeño a lo más grande.");
    await f.getByLabel(/Pasos en el orden correcto/).fill("Célula\nTejido\nÓrgano\nOrganismo");
  });
  await addActivity("La célula", async (f) => {
    await f.getByLabel("Tipo de actividad").selectOption("relacionar");
    await f.getByLabel("Instrucción").fill("Relaciona cada parte con su función.");
    await f.getByLabel("Pareja 1, izquierda").fill("Membrana");
    await f.getByLabel("Pareja 1, derecha").fill("Protege");
    await f.getByLabel("Pareja 2, izquierda").fill("Mitocondria");
    await f.getByLabel("Pareja 2, derecha").fill("Da energía");
  });
  for (const boss of ["Prueba de Petrox", "Prueba de Ignaris"]) {
    await addActivity(boss, async (f) => {
      await f.getByLabel("Pregunta", { exact: true }).fill("¿Qué necesitan las plantas para hacer fotosíntesis?");
      await f.getByLabel("Opción 1", { exact: true }).fill("Luz");
      await f.getByLabel("Opción 2", { exact: true }).fill("Ruido");
    });
  }

  page.once("dialog", (d) => d.accept());
  await page.getByLabel("Ofrecer gratis (curso completo)").check();
  await expect(page.getByText(/Ahora es gratis/)).toBeVisible();
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByText("¡Publicado!")).toBeVisible();

  // El estudiante lo ve gratis en el catálogo, organizado por módulos, con un Guardián en cada uno.
  await context.clearCookies({ name: "umbral-vista" });
  await page.goto("/programas");
  await expect(page.locator("li", { hasText: "Ciencia en acción" }).getByText("Gratis", { exact: true })).toBeVisible();
  await page.goto("/portales");
  await page.getByRole("link", { name: /Ciencia en acción/ }).click();
  await expect(page.getByRole("heading", { name: "Seres vivos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Energía" })).toBeVisible();
  await expect(page.getByText("Guardián del módulo 2")).toBeVisible();
  await expect(page.getByRole("link", { name: "Desbloquear el curso" })).toHaveCount(0);

  // Primero lee la explicación del módulo; luego juega la lección con las cuatro actividades.
  await page.getByRole("link", { name: /Qué es la vida/ }).click();
  await expect(page.getByText("células", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "¡Entendido! Continuar" }).click();
  await page.getByRole("link", { name: "Ir a practicar →" }).click();
  await expect(page.getByRole("heading", { name: "La célula" })).toBeVisible();
  const respond = async () => {
    await page.getByRole("button", { name: "Responder" }).click();
    await expect(page.locator("#feedback")).toBeVisible();
  };
  await page.locator("label:has(input[type=radio])").first().click(); // Verdadero
  await respond();
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await page.getByLabel("Tu respuesta").fill("  NUCLEO ");
  await respond();
  await expect(page.locator("#feedback")).toContainText(/Golpe certero|Así se hace|Bien pensado|Directo al blanco|Brillante|Imparable/);
  await page.getByRole("button", { name: /Siguiente/ }).click();
  const target = ["Célula", "Tejido", "Órgano", "Organismo"];
  for (let i = 0; i < target.length; i++) {
    const items = page.getByRole("list", { name: "Pasos para ordenar" }).getByRole("listitem");
    let pos = (await items.allTextContents()).findIndex((t) => t.includes(target[i]) && !(target[i] === "Órgano" && t.includes("Organismo")));
    while (pos > i) {
      await page.getByRole("button", { name: `Subir «${target[i]}»` }).click();
      pos--;
    }
  }
  await respond();
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await page.getByLabel("Membrana").selectOption("Protege");
  await page.getByLabel("Mitocondria").selectOption("Da energía");
  await respond();
  await page.getByRole("button", { name: "Terminar misión" }).click();
  await expect(page.getByRole("heading", { name: "¡Misión superada!" })).toBeVisible();
  await expect(page.getByRole("img", { name: "100 por ciento de aciertos" })).toBeVisible();

  // El jefe del primer módulo es Petrox; el del segundo, Ignaris.
  await page.goto("/portales");
  await page.getByRole("link", { name: /Ciencia en acción/ }).click();
  await expect(page.getByRole("link", { name: /Enfrentar a Petrox/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ignaris", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Crónicas de Ignaris" })).toBeVisible();
});

test("el sonido se configura desde la cabecera y los personajes se pueden escuchar", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/cronicas");
  await expect(page.getByRole("button", { name: "Escuchar a Archivista Eon" })).toBeVisible();
  // Tocar la página activa el audio (música del Archivo) sin errores.
  await page.getByRole("button", { name: "Escuchar a Archivista Eon" }).click();
  const sound = page.locator("summary[aria-label=Sonido]");
  await sound.click();
  const music = page.getByLabel("Música de fondo");
  await expect(music).toBeChecked();
  await music.uncheck();
  await page.reload();
  await page.locator("summary[aria-label=Sonido]").click();
  await expect(page.getByLabel("Música de fondo")).not.toBeChecked();
  await page.getByLabel("Música de fondo").check();
  // En la misión, Sora y Kael traen su voz.
  await page.goto("/mision/m1");
  await expect(page.getByRole("button", { name: "Escuchar a Maestra Sora" }).or(page.getByRole("button", { name: "Escuchar a Kuro" })).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("la cuenta de administración no entra al juego: todo la lleva a su consola", async ({ page, context }) => {
  await context.addCookies([{ name: "umbral-vista", value: "admin", url: "http://localhost:3200" }]);
  for (const path of ["/gremio", "/portales", "/portales/primer-portal", "/mision/m1", "/tienda", "/perfil", "/cronicas"]) {
    await page.goto(path);
    await expect(page, `${path} debe llevar a la consola`).toHaveURL(/\/admin$/);
  }
  await expect(page.getByRole("link", { name: "Ir al Gremio" })).toHaveCount(0);
  // El panel docente lo lleva a sus grupos en la consola (sin monedas ni avatar).
  await page.goto("/maestro");
  await expect(page).toHaveURL(/\/admin\/grupos$/);
  await expect(page.getByRole("navigation", { name: "Consola" }).getByRole("link", { name: "Resumen" })).toHaveAttribute("href", "/admin");
  await expect(page.getByLabel(/monedas$/)).toHaveCount(0);
  // En la ficha pública, en lugar de «Ir al programa», puede editarlo.
  await page.goto("/programas/primer-portal");
  await expect(page.getByRole("link", { name: "Editar en la consola" })).toHaveAttribute("href", "/admin/contenido/primer-portal");
});

test("en «Cursos y precios» el precio y la opción gratis van juntos, y la ficha pública lo refleja", async ({ page, context }) => {
  await context.addCookies([{ name: "umbral-vista", value: "admin", url: "http://localhost:3200" }]);
  await page.goto("/admin/cursos");
  const row = () => page.locator("li", { has: page.getByLabel("Precio de El Portal de los Pasos Pequeños en pesos") });
  await row().getByLabel("Gratis").check();
  await row().getByRole("button", { name: "Guardar" }).click();
  await expect(row().getByText("Guardado: el curso es gratis para todos.")).toBeVisible();
  await page.goto("/programas/primer-portal");
  await expect(page.locator("dl").getByText("Gratis", { exact: true })).toBeVisible();

  await page.goto("/admin/cursos");
  await row().getByLabel("Gratis").uncheck();
  await row().getByLabel("Precio de El Portal de los Pasos Pequeños en pesos").fill("30000");
  await row().getByRole("button", { name: "Guardar" }).click();
  await expect(row().getByText(/Guardado: se vende a \$\s?30\.000/)).toBeVisible();
  await page.goto("/programas/primer-portal");
  await expect(page.locator("dl").getByText(/\$\s?30\.000/)).toBeVisible();

  // Deja el precio como estaba.
  await page.goto("/admin/cursos");
  await row().getByLabel("Precio de El Portal de los Pasos Pequeños en pesos").fill("20000");
  await row().getByRole("button", { name: "Guardar" }).click();
  await expect(row().getByText(/Guardado: se vende a \$\s?20\.000/)).toBeVisible();
});

test("se importa un curso desde Excel y el estudiante empieza por la lección de explicación", async ({ page, context }) => {
  test.setTimeout(60_000);
  await context.addCookies([{ name: "umbral-vista", value: "admin", url: "http://localhost:3200" }]);
  await page.goto("/admin/contenido");
  // La plantilla se descarga desde la consola y se sube tal cual (trae un ejemplo completo).
  const plantilla = await page.request.get("/admin/contenido/plantilla");
  expect(plantilla.ok()).toBe(true);
  expect(plantilla.headers()["content-type"]).toContain("spreadsheetml");
  await page.getByLabel("Archivo de Excel (.xlsx)").setInputFiles({ name: "curso.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await plantilla.body() });
  await page.getByRole("button", { name: "Importar" }).click();
  await expect(page.getByText(/Importado desde Excel: 1 módulo, 3 lecciones y 5 actividades/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Aprender a aprender" })).toBeVisible();
  const slug = page.url().split("/admin/contenido/")[1].split("?")[0];
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByText("¡Publicado! Ya lo ven tus estudiantes.")).toBeVisible();

  // Un archivo que no es Excel se rechaza con un mensaje claro.
  await page.goto("/admin/contenido");
  await page.getByLabel("Archivo de Excel (.xlsx)").setInputFiles({ name: "notas.txt", mimeType: "text/plain", buffer: Buffer.from("hola") });
  await page.getByRole("button", { name: "Importar" }).click();
  await expect(page.getByText(/El archivo debe ser de Excel \(\.xlsx\)/)).toBeVisible();

  // El estudiante: la primera lección del módulo es la explicación.
  await context.clearCookies({ name: "umbral-vista" });
  await page.goto(`/portales/${slug}`);
  await page.getByRole("link", { name: /Misión 1: Cómo se come un elefante/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Cómo se come un elefante" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "El truco" })).toBeVisible();
  await expect(page.getByText("pasos pequeños", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "¡Entendido! Continuar" }).click();
  await expect(page.getByText("¡Explicación completada!")).toBeVisible();
  await expect(page.getByText(/\+20 XP/)).toBeVisible();
  // La muestra gratis incluye la explicación y el primer reto.
  await page.getByRole("link", { name: "Ir a practicar →" }).click();
  await expect(page.getByText("Pregunta 1 de 2", { exact: true })).toBeVisible();
  await page.goto(`/portales/${slug}`);
  await expect(page.getByText("Incluido en la suscripción al curso")).toBeVisible(); // el reto del Guardián
});

test("el administrador carga estudiantes a mano y desde Excel, con usuario y contraseña", async ({ page, context }) => {
  await context.addCookies([{ name: "umbral-vista", value: "admin", url: "http://localhost:3200" }]);
  await page.goto("/admin/personas");
  await page.getByRole("link", { name: "Cargar estudiantes" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Cargar estudiantes" })).toBeVisible();

  // A mano: si una fila tiene un error, no se crea ninguna cuenta.
  await page.getByLabel("Nombre del estudiante 1").fill("Ana Mora");
  await page.getByLabel("Usuario o correo del estudiante 1").fill("ana.mora");
  await page.getByLabel("Contraseña del estudiante 1").fill("corta");
  await page.getByRole("button", { name: "Crear 1 cuenta" }).click();
  await expect(page.getByText(/No se creó ninguna cuenta/)).toBeVisible();
  await expect(page.getByText(/Fila 1:/)).toBeVisible();

  await page.getByLabel("Contraseña del estudiante 1").fill("");
  await page.getByLabel("Nombre del estudiante 2").fill("Luna Pérez");
  await page.getByLabel("Usuario o correo del estudiante 2").fill("luna.perez");
  await page.getByLabel("Contraseña del estudiante 2").fill("Luna2027");
  await page.getByRole("button", { name: "Crear 2 cuentas" }).click();
  await expect(page.getByText("2 cuentas creadas.")).toBeVisible();
  const results = page.getByRole("region", { name: "Resultado de la carga" });
  await expect(results.getByRole("row").filter({ hasText: "luna.perez" })).toContainText("Luna2027");
  // Sin contraseña, la plataforma crea una.
  await expect(results.getByRole("row").filter({ hasText: "ana.mora" })).toContainText(/[a-z]{4}-\d{4}-[a-z]{4}/);

  // Desde Excel, con la plantilla de la consola.
  const plantilla = await page.request.get("/admin/personas/plantilla");
  expect(plantilla.headers()["content-type"]).toContain("spreadsheetml");
  const { default: writeXlsxFile } = await import("write-excel-file/node");
  const xlsx = await writeXlsxFile([{ sheet: "Estudiantes", data: [
    [{ value: "Nombre" }, { value: "Usuario o correo" }, { value: "Contraseña" }],
    [{ value: "Sara Gómez" }, { value: "sara.gomez" }, { value: "Sara2027x" }],
  ] }] as never).toBuffer();
  await page.getByRole("tab", { name: "Subir un Excel" }).click();
  await page.getByLabel("Archivo de Excel con los estudiantes").setInputFiles({ name: "estudiantes.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: xlsx });
  await page.getByRole("button", { name: "Cargar estudiantes" }).click();
  await expect(page.getByText("1 cuenta creada.")).toBeVisible();

  // Aparecen en Personas con su usuario, y el administrador les puede dar una contraseña nueva.
  await page.goto("/admin/personas");
  const luna = page.locator("li", { hasText: "Luna Pérez" });
  await expect(luna).toContainText("Usuario: luna.perez");
  await expect(page.locator("li", { hasText: "Sara Gómez" })).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await luna.getByRole("button", { name: "Nueva contraseña para Luna Pérez" }).click();
  await expect(luna.getByText(/Nueva contraseña: [a-z]{4}-\d{4}-[a-z]{4}/)).toBeVisible();
  await context.clearCookies({ name: "umbral-vista" });
});
