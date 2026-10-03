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

test("el segundo portal está cerrado hasta vencer a Petrox", async ({ page }) => {
  await page.goto("/portales");
  await expect(page.getByText("Se abre al vencer a Petrox")).toBeVisible();
  await page.goto("/mision/c2m1");
  await expect(page).toHaveURL(/\/portales\/portal-del-primer-intento$/);
  await expect(page.getByText("Este portal todavía está cerrado")).toBeVisible();
  await expect(page.getByRole("link", { name: /Empezar/ })).toHaveCount(0);
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
  await expect(page.getByRole("link", { name: /La llama que tiembla/ })).toBeVisible();
  for (const name of ["Capa de Musgo", "Sello de Naturaleza", "Certificado «Sello del Portal»"]) {
    await expect(page.getByText(name).first()).toBeVisible();
  }
  await page.goto("/perfil");
  await expect(page.getByText("Rango D · Explorador").first()).toBeVisible();
  await expect(page.getByText("¡Tienes un certificado!")).toBeVisible();
});

test("vencer a Petrox abre el Portal del Primer Intento", async ({ page }) => {
  await page.goto("/gremio");
  await expect(page.getByText("¡Se abrió un nuevo portal")).toBeVisible();
  await page.goto("/portales/portal-del-primer-intento");
  await expect(page.getByText("Este portal todavía está cerrado")).toHaveCount(0);
  await play(page, "c2m1", CORRECT.c2m1);
  await expect(page.getByRole("heading", { name: "¡Misión superada!" })).toBeVisible();
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

test("las páginas públicas cargan y la accesibilidad básica está presente", async ({ page }) => {
  for (const path of ["/privacidad", "/terminos"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  }
});
