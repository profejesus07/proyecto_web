import { handleWompiEvent } from "@/lib/payments/service";

// Wompi avisa aquí cada cambio de una transacción (configurar en Wompi → Desarrolladores → URL de eventos).
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 100_000) return Response.json({ ok: false }, { status: 413 });
  const r = await handleWompiEvent(raw, request.headers.get("x-event-checksum"));
  return Response.json(r.body, { status: r.status });
}
