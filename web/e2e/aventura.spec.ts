import { expect, test, type Page } from "@playwright/test";

// Respuestas correctas del primer portal (índices de cada pregunta).
const CORRECT = { m1: [1, 1, 0, 1], m2: [0, 1, 1, 1], m3: [1, 1, 1, 0], m4: [1, 1, 1, 1, 1, 0] };

async function play(page: Page, id: string, answers: number[]) {
  await page.goto(`/mision/${id}`);
  for (let i = 0; i < answers.length; i++) {
    await page.locator("label:has(input[type=radio])").nth(answers[i]).click();
    if (i < answers.length - 1) await page.getByRole("button", { name: /Siguiente/ }).click();
  }
  await page.getByRole("button", { name: /Terminar misión|Enfrentar al Guardián/ }).click();
  await expect(page.getByRole("heading", { name: "Repaso de tus respuestas" })).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test("el estudiante empieza sin XP y ve su primer portal", async ({ page }) => {
  await page.goto("/gremio");
  await expect(page.getByText("Tu primer portal te espera")).toBeVisible();
  await expect(page.getByText("0 XP")).toBeVisible();
  await page.goto("/portales/primer-portal");
  await expect(page.getByRole("heading", { name: "El Portal de los Pasos Pequeños" })).toBeVisible();
  await expect(page.getByText("Termina las 3 misiones para desbloquearlo")).toBeVisible();
});

test("no se puede saltar a una misión bloqueada", async ({ page }) => {
  await page.goto("/mision/m2");
  await expect(page).toHaveURL(/\/portales\/primer-portal$/);
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
  await page.locator("label:has(input[type=radio])").first().click();
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await expect(ayudas.getByRole("button", { name: /Pista · tienes 0/ })).toBeDisabled();
  await expect(ayudas.getByRole("link", { name: "Conseguir más en la tienda" })).toBeVisible();
  // Al recargar, la pista ya revelada sigue ahí sin volver a cobrar.
  await page.reload();
  await expect(page.getByRole("note")).toBeVisible();
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
  for (const name of ["Capa de Musgo", "Sello de Naturaleza", "Certificado «Sello del Portal»"]) {
    await expect(page.getByText(name).first()).toBeVisible();
  }
  await page.goto("/perfil");
  await expect(page.getByText("Rango D · Explorador").first()).toBeVisible();
  await expect(page.getByText("¡Tienes un certificado!")).toBeVisible();
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
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await expect(ayudas.getByRole("button", { name: /50\/50 · tienes 0/ })).toBeDisabled();
  await ayudas.getByRole("button", { name: /Pista · gratis/ }).click();
  await expect(page.getByRole("note")).toBeVisible();
});

test("las páginas públicas cargan y la accesibilidad básica está presente", async ({ page }) => {
  for (const path of ["/privacidad", "/terminos"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  }
});
