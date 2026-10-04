import { createHash, createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPreference, fetchMercadoPagoPayment, mercadoPagoStatus, verifyMercadoPagoSignature } from "@/lib/payments/mercadopago";
import { integritySignature, verifyWompiEvent, wompiApiBase, wompiCheckoutUrl, wompiStatus } from "@/lib/payments/wompi";

// Firmas y respuestas de las pasarelas: lo que decide si un aviso de pago es de verdad.
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

const wompi = { publicKey: "pub_test_abc", integritySecret: "test_integrity_xyz", eventsSecret: "test_events_123" };
const tx = { id: "1234-1610641025-49201", reference: "UMB-ABCDEF123456", status: "APPROVED", amount_in_cents: 2500000, currency: "COP" };
function wompiEvent(over: Partial<typeof tx> = {}, secret = wompi.eventsSecret) {
  const t = { ...tx, ...over };
  const props = ["transaction.id", "transaction.status", "transaction.amount_in_cents"];
  const timestamp = 1730000000;
  return {
    event: "transaction.updated", data: { transaction: t }, timestamp,
    signature: { properties: props, checksum: sha(`${t.id}${t.status}${t.amount_in_cents}${timestamp}${secret}`).toUpperCase() },
  };
}

describe("Wompi", () => {
  it("firma de integridad y dirección del checkout (valor en centavos)", () => {
    expect(integritySignature("UMB-1", 2500000, "COP", "s")).toBe(sha("UMB-12500000COPs"));
    const url = new URL(wompiCheckoutUrl(wompi, { reference: "UMB-1", amountCop: 25000, redirectUrl: "https://umbral.co/pago/UMB-1" }));
    expect(url.origin + url.pathname).toBe("https://checkout.wompi.co/p/");
    expect(url.searchParams.get("amount-in-cents")).toBe("2500000");
    expect(url.searchParams.get("currency")).toBe("COP");
    expect(url.searchParams.get("signature:integrity")).toBe(sha(`UMB-12500000COP${wompi.integritySecret}`));
    expect(url.searchParams.get("redirect-url")).toBe("https://umbral.co/pago/UMB-1");
    expect(url.toString()).not.toContain(wompi.integritySecret);
  });

  it("acepta un evento bien firmado y rechaza uno alterado o con otro secreto", () => {
    const ev = wompiEvent();
    expect(verifyWompiEvent(ev, wompi.eventsSecret)).toMatchObject({ reference: tx.reference, status: "APPROVED" });
    expect(verifyWompiEvent(ev, wompi.eventsSecret, ev.signature.checksum)).not.toBeNull();
    expect(verifyWompiEvent(ev, wompi.eventsSecret, "00")).toBeNull();
    expect(verifyWompiEvent(ev, "otro-secreto")).toBeNull();
    const tampered = { ...ev, data: { transaction: { ...tx, status: "APPROVED", amount_in_cents: 100 } } };
    expect(verifyWompiEvent(tampered, wompi.eventsSecret)).toBeNull();
    expect(verifyWompiEvent({ ...ev, signature: { properties: [], checksum: "x" } }, wompi.eventsSecret)).toBeNull();
    expect(verifyWompiEvent("nada", wompi.eventsSecret)).toBeNull();
  });

  it("estados y ambiente", () => {
    expect(["APPROVED", "DECLINED", "VOIDED", "ERROR", "PENDING"].map(wompiStatus)).toEqual(["aprobado", "rechazado", "anulado", "error", "pendiente"]);
    expect(wompiApiBase("pub_test_x")).toBe("https://sandbox.wompi.co/v1");
    expect(wompiApiBase("pub_prod_x")).toBe("https://production.wompi.co/v1");
  });
});

describe("Mercado Pago", () => {
  const mp = { accessToken: "APP_USR-123", webhookSecret: "secreto" };
  const sign = (manifest: string, secret = mp.webhookSecret) => createHmac("sha256", secret).update(manifest).digest("hex");

  it("verifica la firma x-signature", () => {
    const v1 = sign("id:123456;request-id:req-1;ts:1704908010;");
    expect(verifyMercadoPagoSignature({ xSignature: `ts=1704908010,v1=${v1}`, xRequestId: "req-1", dataId: "123456", secret: mp.webhookSecret })).toBe(true);
    expect(verifyMercadoPagoSignature({ xSignature: `ts=1704908010,v1=${v1}`, xRequestId: "req-1", dataId: "999", secret: mp.webhookSecret })).toBe(false);
    expect(verifyMercadoPagoSignature({ xSignature: `ts=1704908010,v1=${v1}`, xRequestId: "req-1", dataId: "123456", secret: "otro" })).toBe(false);
    expect(verifyMercadoPagoSignature({ xSignature: null, xRequestId: "req-1", dataId: "123456", secret: mp.webhookSecret })).toBe(false);
    // Los id alfanuméricos van en minúscula en el manifiesto.
    const v2 = sign("id:abc9;ts:1;");
    expect(verifyMercadoPagoSignature({ xSignature: `ts=1,v1=${v2}`, xRequestId: null, dataId: "ABC9", secret: mp.webhookSecret })).toBe(true);
  });

  it("estados", () => {
    expect(["approved", "rejected", "refunded", "charged_back", "cancelled", "in_process", "pending"].map(mercadoPagoStatus))
      .toEqual(["aprobado", "rechazado", "anulado", "anulado", "anulado", "pendiente", "pendiente"]);
  });

  it("crea la preferencia con la referencia y el valor del servidor", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se leen después en f.mock.calls
    const f = vi.fn(async (_url: string, _init?: RequestInit) => Response.json({ init_point: "https://mp/real", sandbox_init_point: "https://mp/sandbox" }));
    const url = await createPreference(mp, { reference: "UMB-1", title: "Curso", courseSlug: "curso", amountCop: 25000, returnUrl: "https://umbral.co/pago/UMB-1", notificationUrl: "https://umbral.co/api/pagos/mercadopago" }, f as unknown as typeof fetch);
    expect(url).toBe("https://mp/real");
    const [endpoint, init] = f.mock.calls[0];
    expect(endpoint).toBe("https://api.mercadopago.com/checkout/preferences");
    const body = JSON.parse(String(init!.body));
    expect(body).toMatchObject({ external_reference: "UMB-1", auto_return: "approved", notification_url: "https://umbral.co/api/pagos/mercadopago" });
    expect(body.items[0]).toMatchObject({ unit_price: 25000, currency_id: "COP", quantity: 1 });
    // En localhost (http) no se pide volver solo ni avisar.
    await createPreference({ ...mp, accessToken: "TEST-1" }, { reference: "UMB-2", title: "C", courseSlug: "c", amountCop: 1, returnUrl: "http://localhost:3000/pago/UMB-2", notificationUrl: "http://localhost:3000/api" }, f as unknown as typeof fetch)
      .then((u) => expect(u).toBe("https://mp/sandbox"));
    const body2 = JSON.parse(String(f.mock.calls[1][1]!.body));
    expect(body2.auto_return).toBeUndefined();
    expect(body2.notification_url).toBeUndefined();
  });

  it("solo consulta pagos con id numérico", async () => {
    const f = vi.fn();
    expect(await fetchMercadoPagoPayment(mp, "../users/me", f as unknown as typeof fetch)).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
});

// Avisos completos: firma → consulta a la pasarela → base de datos.
const settle = vi.fn();
vi.mock("@/lib/data", () => ({ getRepo: () => ({ settlePayment: settle }) }));

describe("avisos (webhooks)", () => {
  const realFetch = globalThis.fetch;
  beforeEach(() => {
    settle.mockReset().mockResolvedValue({ status: "aprobado", userId: "u", course: "c" });
    vi.stubEnv("WOMPI_PUBLIC_KEY", wompi.publicKey);
    vi.stubEnv("WOMPI_INTEGRITY_SECRET", wompi.integritySecret);
    vi.stubEnv("WOMPI_EVENTS_SECRET", wompi.eventsSecret);
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "APP_USR-123");
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", "secreto");
  });
  afterEach(() => { vi.unstubAllEnvs(); globalThis.fetch = realFetch; });

  it("Wompi: con firma válida vuelve a leer la transacción en Wompi y registra lo que diga Wompi", async () => {
    const { handleWompiEvent } = await import("@/lib/payments/service");
    globalThis.fetch = vi.fn(async () => Response.json({ data: { ...tx, payment_method_type: "PSE" } })) as unknown as typeof fetch;
    const r = await handleWompiEvent(JSON.stringify(wompiEvent()), null);
    expect(r.status).toBe(200);
    expect(settle).toHaveBeenCalledWith(expect.objectContaining({ reference: tx.reference, provider: "wompi", status: "aprobado", amount: 25000, currency: "COP" }));
    expect(String(vi.mocked(globalThis.fetch).mock.calls[0][0])).toBe(`https://sandbox.wompi.co/v1/transactions/${tx.id}`);
  });

  it("Wompi: firma inválida → 401 y no toca la base de datos", async () => {
    const { handleWompiEvent } = await import("@/lib/payments/service");
    const r = await handleWompiEvent(JSON.stringify(wompiEvent({}, "falso")), null);
    expect(r.status).toBe(401);
    expect(settle).not.toHaveBeenCalled();
  });

  it("Wompi: sin secreto de eventos no acepta avisos", async () => {
    vi.stubEnv("WOMPI_EVENTS_SECRET", "");
    const { handleWompiEvent } = await import("@/lib/payments/service");
    expect((await handleWompiEvent(JSON.stringify(wompiEvent()), null)).status).toBe(503);
  });

  it("Mercado Pago: consulta el pago con el token y usa su external_reference", async () => {
    const { handleMercadoPagoNotification } = await import("@/lib/payments/service");
    globalThis.fetch = vi.fn(async () => Response.json({ id: 42, status: "approved", status_detail: "accredited", external_reference: "UMB-ABCDEF123456", transaction_amount: 25000, currency_id: "COP" })) as unknown as typeof fetch;
    const ts = "1704908010";
    const v1 = createHmac("sha256", "secreto").update(`id:42;request-id:r1;ts:${ts};`).digest("hex");
    const r = await handleMercadoPagoNotification(new URL("https://umbral.co/api/pagos/mercadopago?data.id=42&type=payment"), JSON.stringify({ type: "payment", data: { id: "42" } }),
      new Headers({ "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": "r1" }));
    expect(r.status).toBe(200);
    expect(settle).toHaveBeenCalledWith(expect.objectContaining({ reference: "UMB-ABCDEF123456", provider: "mercadopago", providerRef: "42", status: "aprobado", amount: 25000 }));
    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(url).toBe("https://api.mercadopago.com/v1/payments/42");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer APP_USR-123" });
  });

  it("Mercado Pago: firma presente pero falsa → 401", async () => {
    const { handleMercadoPagoNotification } = await import("@/lib/payments/service");
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
    const r = await handleMercadoPagoNotification(new URL("https://umbral.co/api/pagos/mercadopago?data.id=42&type=payment"), "", new Headers({ "x-signature": "ts=1,v1=00", "x-request-id": "r1" }));
    expect(r.status).toBe(401);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("una referencia que no es nuestra se ignora sin reintentos", async () => {
    settle.mockRejectedValueOnce(new Error("pago: pago_no_encontrado"));
    const { handleWompiEvent } = await import("@/lib/payments/service");
    globalThis.fetch = vi.fn(async () => Response.json({ data: tx })) as unknown as typeof fetch;
    const r = await handleWompiEvent(JSON.stringify(wompiEvent()), null);
    expect(r).toMatchObject({ status: 200, body: { ignored: "referencia_desconocida" } });
  });
});
