import "server-only";
import { isPreview } from "@/lib/env";
import type { PaymentProvider } from "@/lib/data/types";
import type { MercadoPagoConfig } from "./mercadopago";
import type { WompiConfig } from "./wompi";

// Llaves de las pasarelas: solo en el servidor (Vercel → Settings → Environment Variables).
// Nunca con el prefijo NEXT_PUBLIC_, nunca en el código ni en un chat.
const env = (k: string) => process.env[k]?.trim() || null;

export function wompiConfig(): WompiConfig | null {
  const publicKey = env("WOMPI_PUBLIC_KEY");
  const integritySecret = env("WOMPI_INTEGRITY_SECRET");
  return publicKey && integritySecret ? { publicKey, integritySecret, eventsSecret: env("WOMPI_EVENTS_SECRET") } : null;
}

export function mercadoPagoConfig(): MercadoPagoConfig | null {
  const accessToken = env("MERCADOPAGO_ACCESS_TOKEN");
  return accessToken ? { accessToken, webhookSecret: env("MERCADOPAGO_WEBHOOK_SECRET") } : null;
}

/**
 * Cómo funciona cada pasarela ahora mismo:
 *  · "real": hay llaves configuradas.
 *  · "simulado": vista previa sin llaves (un checkout de mentira para probar el recorrido).
 *  · null: no disponible (se ofrece escribir por correo).
 */
export function providerMode(p: PaymentProvider): "real" | "simulado" | null {
  if (isPreview()) return "simulado";
  return (p === "wompi" ? wompiConfig() : mercadoPagoConfig()) ? "real" : null;
}

export function availableProviders(): PaymentProvider[] {
  return (["wompi", "mercadopago"] as const).filter((p) => providerMode(p) !== null);
}

/** ¿Es una llave de prueba? (Para avisar en pantalla que no se cobra dinero real.) */
export function isTestMode(p: PaymentProvider): boolean {
  if (isPreview()) return true;
  if (p === "wompi") return !!wompiConfig()?.publicKey.startsWith("pub_test_");
  const t = mercadoPagoConfig()?.accessToken ?? "";
  return t.startsWith("TEST-") || env("MERCADOPAGO_TEST") === "1";
}

export const PROVIDER_LABEL: Record<PaymentProvider, string> = { wompi: "Wompi", mercadopago: "Mercado Pago" };

/** Pasarelas disponibles para mostrar en pantalla, y si alguna está en modo de prueba. */
export function payOptions(): { options: { id: PaymentProvider; label: string }[]; test: boolean } {
  const ids = availableProviders();
  return { options: ids.map((id) => ({ id, label: PROVIDER_LABEL[id] })), test: ids.some(isTestMode) };
}

/** Un pago pendiente de los últimos 3 días (más viejo, ya no vale la pena mostrarlo). */
export function isRecentPending(p: { status: string; createdAt: string }): boolean {
  return p.status === "pendiente" && Date.now() - new Date(p.createdAt).getTime() < 3 * 86_400_000;
}
