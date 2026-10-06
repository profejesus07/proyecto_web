"use server";

import { redirect } from "next/navigation";
import { getPlayer, getViewer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { PAYMENT_PROVIDERS, type PaymentProvider } from "@/lib/data/types";
import { isPreview } from "@/lib/env";
import { providerMode } from "@/lib/payments/config";
import { checkoutUrl } from "@/lib/payments/service";
import { siteUrl } from "@/lib/site";

export type PayFormState = { error?: string } | undefined;

const MESSAGES: Record<string, string> = {
  sin_precio: "Este curso todavía no tiene precio. Escríbenos y lo activamos a mano.",
  ya_tiene_acceso: "Ya tienes este curso completo.",
  no_vinculado: "Solo puedes pagar por un estudiante que te tiene vinculado como familia.",
  solo_estudiantes: "Desde una cuenta de familia, elige primero a tu hijo o hija en «Mi familia».",
  curso_no_encontrado: "Ese curso no existe o aún no está publicado.",
  demasiados_intentos: "Hiciste muchos intentos de pago hoy. Inténtalo mañana o escríbenos.",
  pasarela_no_disponible: "Ese medio de pago no está disponible ahora mismo.",
  mercadopago_preferencia: "Mercado Pago no respondió. Inténtalo de nuevo en un momento o usa Wompi.",
};

function friendly(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  for (const [k, v] of Object.entries(MESSAGES)) if (msg.includes(k)) return v;
  return "No pudimos iniciar el pago. Inténtalo de nuevo en un momento.";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Crea el pago (el valor sale de la base de datos) y lleva al checkout de la pasarela. */
export async function startPaymentAction(_prev: PayFormState, formData: FormData): Promise<PayFormState> {
  const viewer = await getPlayer();
  if (!viewer) return { error: "Tu sesión terminó. Vuelve a ingresar." };
  const course = String(formData.get("course") ?? "");
  const provider = String(formData.get("provider") ?? "") as PaymentProvider;
  const studentRaw = String(formData.get("student") ?? "");
  const student = studentRaw && UUID.test(studentRaw) ? studentRaw : null;
  if (!PAYMENT_PROVIDERS.includes(provider) || !providerMode(provider)) return { error: MESSAGES.pasarela_no_disponible };
  if (!/^[a-z0-9-]{1,80}$/.test(course)) return { error: MESSAGES.curso_no_encontrado };
  let url: string;
  try {
    const start = await getRepo().startPayment(viewer.id, student, course, provider);
    url = await checkoutUrl(start, provider, course, await siteUrl(), null);
  } catch (e) {
    return { error: friendly(e) };
  }
  redirect(url);
}

/** Solo en la vista previa: el checkout de mentira aprueba o rechaza el pago. */
export async function simulatePaymentAction(formData: FormData): Promise<void> {
  if (!isPreview()) throw new Error("no_disponible");
  const viewer = await getViewer();
  const ref = String(formData.get("ref") ?? "");
  const outcome = String(formData.get("outcome") ?? "");
  const repo = getRepo();
  const p = await repo.getPayment(ref);
  if (!viewer || !p || p.payerId !== viewer.id) redirect("/gremio");
  await repo.settlePayment({
    reference: p.reference, provider: p.provider, providerRef: `sim-${Date.now()}`,
    status: outcome === "aprobar" ? "aprobado" : outcome === "pendiente" ? "pendiente" : "rechazado",
    amount: p.amount, currency: "COP", detail: "simulado",
  });
  redirect(`/pago/${p.reference}`);
}
