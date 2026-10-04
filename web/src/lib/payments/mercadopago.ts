import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentStatus } from "@/lib/data/types";

// Mercado Pago: Checkout Pro (preferencias) y notificaciones (webhooks).
// Documentación: https://www.mercadopago.com.co/developers/es/docs/checkout-pro

export interface MercadoPagoConfig {
  accessToken: string;
  /** Clave secreta de webhooks (opcional): si está, se verifica la firma x-signature. */
  webhookSecret: string | null;
}

export interface MercadoPagoPayment {
  id: number | string;
  status: string;
  status_detail?: string | null;
  external_reference?: string | null;
  transaction_amount?: number | null;
  currency_id?: string | null;
}

const API = "https://api.mercadopago.com";

export function mercadoPagoStatus(s: string): PaymentStatus {
  switch (s) {
    case "approved": return "aprobado";
    case "rejected": return "rechazado";
    case "cancelled": case "refunded": case "charged_back": return "anulado";
    default: return "pendiente"; // pending, in_process, authorized, in_mediation
  }
}

/** Crea la preferencia de pago y devuelve la dirección del checkout. */
export async function createPreference(
  cfg: MercadoPagoConfig,
  o: { reference: string; title: string; courseSlug: string; amountCop: number; returnUrl: string; notificationUrl: string | null; email?: string | null },
  f: typeof fetch = fetch,
): Promise<string> {
  const https = o.returnUrl.startsWith("https://");
  const body: Record<string, unknown> = {
    items: [{ id: o.courseSlug, title: o.title.slice(0, 250), quantity: 1, currency_id: "COP", unit_price: o.amountCop }],
    external_reference: o.reference,
    back_urls: { success: o.returnUrl, pending: o.returnUrl, failure: o.returnUrl },
    statement_descriptor: "UMBRAL",
  };
  // Mercado Pago solo acepta volver solo y avisar a direcciones públicas (https).
  if (https) body.auto_return = "approved";
  if (o.notificationUrl?.startsWith("https://")) body.notification_url = o.notificationUrl;
  if (o.email) body.payer = { email: o.email };
  const res = await f(`${API}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.accessToken}`, "Content-Type": "application/json", "X-Idempotency-Key": o.reference },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`mercadopago_preferencia: ${res.status}`);
  const json = (await res.json()) as { init_point?: string; sandbox_init_point?: string };
  const url = cfg.accessToken.startsWith("TEST-") ? json.sandbox_init_point ?? json.init_point : json.init_point;
  if (!url) throw new Error("mercadopago_preferencia: sin enlace");
  return url;
}

/**
 * Firma de una notificación: x-signature = "ts=…,v1=…"; v1 es el HMAC-SHA256 (con la clave secreta) de
 * "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" (se omiten las partes que no lleguen).
 */
export function verifyMercadoPagoSignature(o: { xSignature: string | null; xRequestId: string | null; dataId: string | null; secret: string }): boolean {
  if (!o.xSignature) return false;
  const parts = Object.fromEntries(o.xSignature.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const id = o.dataId && /^[a-z0-9]+$/i.test(o.dataId) ? o.dataId.toLowerCase() : o.dataId;
  let manifest = "";
  if (id) manifest += `id:${id};`;
  if (o.xRequestId) manifest += `request-id:${o.xRequestId};`;
  manifest += `ts:${ts};`;
  const expected = createHmac("sha256", o.secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1.toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Consulta el pago directamente a Mercado Pago (con el token del comercio). */
export async function fetchMercadoPagoPayment(cfg: MercadoPagoConfig, id: string, f: typeof fetch = fetch): Promise<MercadoPagoPayment | null> {
  if (!/^\d{1,20}$/.test(id)) return null;
  const res = await f(`${API}/v1/payments/${id}`, { headers: { Authorization: `Bearer ${cfg.accessToken}` }, cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as MercadoPagoPayment;
}
