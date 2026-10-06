import type { PaymentStatus } from "@/lib/data/types";

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; badge: string }> = {
  aprobado: { label: "Aprobado", badge: "badge-ok" },
  pendiente: { label: "Pendiente", badge: "badge-warn" },
  rechazado: { label: "Rechazado", badge: "badge-muted" },
  anulado: { label: "Anulado", badge: "badge-err" },
  error: { label: "Error", badge: "badge-err" },
};

/** Fecha y hora cortas, en la hora de Colombia. */
export const dateTime = (iso: string) => new Date(iso).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" });
export const shortDate = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short", year: "numeric" });
