import { defineConfig } from "@playwright/test";

const port = 3200;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
  },
  // La vista previa usa datos de ejemplo en memoria: no necesita Supabase.
  webServer: {
    command: `npx next dev -p ${port}`,
    url: `http://localhost:${port}/privacidad`,
    // 200 monedas al empezar (la vista previa normal tiene 40): alcanzan para todas las compras de la suite,
    // incluida la misión completa, sin que unas pruebas dependan de lo que gastan otras.
    env: { UMBRAL_PREVIEW: "1", UMBRAL_PREVIEW_MONEDAS: "200" },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
