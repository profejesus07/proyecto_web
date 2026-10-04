import { handleMercadoPagoNotification } from "@/lib/payments/service";

// Mercado Pago avisa aquí cuando cambia un pago (la dirección va en cada preferencia).
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 100_000) return Response.json({ ok: false }, { status: 413 });
  const r = await handleMercadoPagoNotification(new URL(request.url), raw, request.headers);
  return Response.json(r.body, { status: r.status });
}
