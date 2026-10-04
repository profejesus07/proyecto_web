import "server-only";
import { getRepo } from "@/lib/data";
import type { Payment, PaymentProvider, PaymentStart, PaymentStatus, PaymentUpdate } from "@/lib/data/types";
import { mercadoPagoConfig, providerMode, wompiConfig } from "./config";
import { createPreference, fetchMercadoPagoPayment, mercadoPagoStatus, verifyMercadoPagoSignature, type MercadoPagoPayment } from "./mercadopago";
import { fetchWompiTransaction, verifyWompiEvent, wompiCheckoutUrl, wompiStatus, type WompiTransaction } from "./wompi";

/** Dirección del checkout de la pasarela para un pago recién creado. */
export async function checkoutUrl(start: PaymentStart, provider: PaymentProvider, courseSlug: string, site: string, email: string | null): Promise<string> {
  const returnUrl = `${site}/pago/${start.reference}`;
  const mode = providerMode(provider);
  if (mode === "simulado") return `/pago/simulado?ref=${encodeURIComponent(start.reference)}`;
  if (provider === "wompi") {
    const cfg = wompiConfig();
    if (!cfg) throw new Error("pasarela_no_disponible");
    return wompiCheckoutUrl(cfg, { reference: start.reference, amountCop: start.amount, redirectUrl: returnUrl, email });
  }
  const cfg = mercadoPagoConfig();
  if (!cfg) throw new Error("pasarela_no_disponible");
  return createPreference(cfg, {
    reference: start.reference, title: `Academia Virtual Umbral · ${start.title}`, courseSlug, amountCop: start.amount, returnUrl,
    notificationUrl: `${site}/api/pagos/mercadopago?source_news=webhooks`, email,
  });
}

export const fromWompi = (tx: WompiTransaction): PaymentUpdate => ({
  reference: tx.reference, provider: "wompi", providerRef: tx.id, status: wompiStatus(tx.status),
  amount: typeof tx.amount_in_cents === "number" ? tx.amount_in_cents / 100 : null, currency: tx.currency ?? null,
  detail: [tx.status, tx.payment_method_type, tx.status_message].filter(Boolean).join(" · ").slice(0, 200) || null,
});

export const fromMercadoPago = (p: MercadoPagoPayment): PaymentUpdate | null => (p.external_reference ? {
  reference: p.external_reference, provider: "mercadopago", providerRef: String(p.id), status: mercadoPagoStatus(p.status),
  amount: typeof p.transaction_amount === "number" ? p.transaction_amount : null, currency: p.currency_id ?? null,
  detail: [p.status, p.status_detail].filter(Boolean).join(" · ").slice(0, 200) || null,
} : null);

/**
 * Al volver de la pasarela: si el pago sigue pendiente, se consulta directamente a la pasarela
 * (nunca se confía en lo que diga la dirección de regreso).
 */
export async function confirmOnReturn(payment: Payment, params: Record<string, string | undefined>): Promise<PaymentStatus> {
  if (payment.status !== "pendiente" && payment.status !== "rechazado") return payment.status;
  try {
    let update: PaymentUpdate | null = null;
    if (payment.provider === "wompi" && params.id) {
      const cfg = wompiConfig();
      const tx = cfg ? await fetchWompiTransaction(cfg, params.id) : null;
      if (tx) update = fromWompi(tx);
    } else if (payment.provider === "mercadopago" && (params.payment_id || params.collection_id)) {
      const cfg = mercadoPagoConfig();
      const p = cfg ? await fetchMercadoPagoPayment(cfg, (params.payment_id || params.collection_id)!) : null;
      if (p) update = fromMercadoPago(p);
    }
    // La transacción consultada tiene que ser de este mismo pago.
    if (!update || update.reference !== payment.reference) return payment.status;
    return (await getRepo().settlePayment(update)).status;
  } catch (e) {
    console.error("pago: no se pudo confirmar al volver", payment.reference, e instanceof Error ? e.message : e);
    return payment.status;
  }
}

type HookResult = { status: number; body: Record<string, unknown> };

async function settleOrIgnore(update: PaymentUpdate): Promise<HookResult> {
  try {
    const r = await getRepo().settlePayment(update);
    return { status: 200, body: { ok: true, status: r.status } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    // Una referencia que no es nuestra no se reintenta.
    if (msg.includes("pago_no_encontrado")) return { status: 200, body: { ok: true, ignored: "referencia_desconocida" } };
    console.error("pago: aviso no procesado", update.reference, msg);
    return { status: 500, body: { ok: false } };
  }
}

/** Aviso de Wompi (evento transaction.updated), con su firma verificada. */
export async function handleWompiEvent(raw: string, headerChecksum: string | null): Promise<HookResult> {
  const cfg = wompiConfig();
  if (!cfg?.eventsSecret) return { status: 503, body: { ok: false, error: "sin_configurar" } };
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return { status: 400, body: { ok: false } }; }
  const tx = verifyWompiEvent(body, cfg.eventsSecret, headerChecksum);
  if (!tx) return { status: 401, body: { ok: false, error: "firma_invalida" } };
  if ((body as { event?: string }).event !== "transaction.updated") return { status: 200, body: { ok: true, ignored: "evento" } };
  // La firma solo cubre algunos campos: la transacción se vuelve a leer en Wompi y vale lo que diga Wompi.
  const fresh = await fetchWompiTransaction(cfg, tx.id).catch(() => null);
  if (!fresh) return { status: 502, body: { ok: false, error: "no_se_pudo_consultar" } };
  return settleOrIgnore(fromWompi(fresh));
}

/**
 * Aviso de Mercado Pago. Solo trae el id del pago: el estado se consulta a Mercado Pago con el token
 * del comercio (eso es lo que vale). Si hay clave secreta, además se verifica la firma.
 */
export async function handleMercadoPagoNotification(url: URL, raw: string, headers: Headers): Promise<HookResult> {
  const cfg = mercadoPagoConfig();
  if (!cfg) return { status: 503, body: { ok: false, error: "sin_configurar" } };
  let body: { type?: string; topic?: string; data?: { id?: string | number } } = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { /* algunos avisos llegan sin cuerpo */ }
  const type = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? body.type ?? body.topic;
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? (body.data?.id !== undefined ? String(body.data.id) : null);
  if (cfg.webhookSecret && headers.get("x-signature")) {
    const ok = verifyMercadoPagoSignature({ xSignature: headers.get("x-signature"), xRequestId: headers.get("x-request-id"), dataId, secret: cfg.webhookSecret });
    if (!ok) return { status: 401, body: { ok: false, error: "firma_invalida" } };
  }
  if (type !== "payment" || !dataId) return { status: 200, body: { ok: true, ignored: "tipo" } };
  const payment = await fetchMercadoPagoPayment(cfg, dataId);
  if (!payment) return { status: 200, body: { ok: true, ignored: "pago_desconocido" } };
  const update = fromMercadoPago(payment);
  if (!update) return { status: 200, body: { ok: true, ignored: "sin_referencia" } };
  return settleOrIgnore(update);
}
