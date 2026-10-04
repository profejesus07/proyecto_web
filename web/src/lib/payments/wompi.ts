import { createHash, timingSafeEqual } from "node:crypto";
import type { PaymentStatus } from "@/lib/data/types";

// Wompi (Bancolombia): Web Checkout con firma de integridad y avisos (eventos) firmados.
// Documentación: https://docs.wompi.co/docs/colombia/widget-checkout-web/ y /eventos/

export interface WompiConfig {
  publicKey: string;
  integritySecret: string;
  /** Secreto de eventos: sin él no se aceptan avisos. */
  eventsSecret: string | null;
}

export interface WompiTransaction {
  id: string;
  reference: string;
  status: string;
  amount_in_cents: number;
  currency: string;
  status_message?: string | null;
  payment_method_type?: string | null;
}

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

/** Las llaves de prueba empiezan con pub_test_; las de producción con pub_prod_. */
export const wompiApiBase = (publicKey: string) =>
  publicKey.startsWith("pub_prod_") ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1";

/** Firma de integridad: SHA-256 de referencia + valor en centavos + moneda + secreto de integridad. */
export function integritySignature(reference: string, amountInCents: number, currency: string, secret: string): string {
  return sha256(`${reference}${amountInCents}${currency}${secret}`);
}

export function wompiCheckoutUrl(cfg: WompiConfig, o: { reference: string; amountCop: number; redirectUrl: string; email?: string | null }): string {
  const cents = o.amountCop * 100;
  const q = new URLSearchParams({
    "public-key": cfg.publicKey,
    currency: "COP",
    "amount-in-cents": String(cents),
    reference: o.reference,
    "signature:integrity": integritySignature(o.reference, cents, "COP", cfg.integritySecret),
    "redirect-url": o.redirectUrl,
  });
  if (o.email) q.set("customer-data:email", o.email);
  return `https://checkout.wompi.co/p/?${q.toString()}`;
}

export function wompiStatus(s: string): PaymentStatus {
  switch (s.toUpperCase()) {
    case "APPROVED": return "aprobado";
    case "DECLINED": return "rechazado";
    case "VOIDED": return "anulado";
    case "ERROR": return "error";
    default: return "pendiente";
  }
}

function sameHex(a: string, b: string): boolean {
  const x = Buffer.from(a.toLowerCase());
  const y = Buffer.from(b.toLowerCase());
  return x.length === y.length && timingSafeEqual(x, y);
}

const pick = (obj: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);

/**
 * Verifica un evento de Wompi: SHA-256 de los valores de signature.properties (tomados de data),
 * seguidos del timestamp y el secreto de eventos. Devuelve la transacción si la firma es válida.
 */
export function verifyWompiEvent(body: unknown, secret: string, headerChecksum?: string | null): WompiTransaction | null {
  if (!body || typeof body !== "object") return null;
  const b = body as { event?: unknown; data?: unknown; signature?: { properties?: unknown; checksum?: unknown }; timestamp?: unknown };
  const props = b.signature?.properties;
  const checksum = typeof b.signature?.checksum === "string" ? b.signature.checksum : headerChecksum;
  if (!Array.isArray(props) || !props.length || typeof checksum !== "string" || (typeof b.timestamp !== "number" && typeof b.timestamp !== "string")) return null;
  const values = props.map((p) => (typeof p === "string" ? pick(b.data, p) : undefined));
  if (values.some((v) => v === undefined || v === null || typeof v === "object")) return null;
  const expected = sha256(values.map(String).join("") + String(b.timestamp) + secret);
  if (!sameHex(expected, checksum)) return null;
  if (headerChecksum && !sameHex(expected, headerChecksum)) return null;
  const tx = pick(b.data, "transaction") as WompiTransaction | undefined;
  return tx && typeof tx.reference === "string" && typeof tx.id === "string" ? tx : null;
}

/** Consulta una transacción directamente a Wompi (para confirmar al volver del pago). */
export async function fetchWompiTransaction(cfg: WompiConfig, id: string, f: typeof fetch = fetch): Promise<WompiTransaction | null> {
  if (!/^[\w-]{3,80}$/.test(id)) return null;
  const res = await f(`${wompiApiBase(cfg.publicKey)}/transactions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${cfg.publicKey}` }, cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: WompiTransaction };
  return json.data ?? null;
}
