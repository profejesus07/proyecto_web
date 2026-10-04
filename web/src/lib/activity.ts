import { todayBogota } from "@/lib/game/aids";

/** Días desde una fecha (AAAA-MM-DD), contados en hora de Bogotá. */
export function daysAgo(date: string | null): number | null {
  if (!date) return null;
  const today = new Date(`${todayBogota()}T00:00:00Z`).getTime();
  return Math.round((today - new Date(`${date.slice(0, 10)}T00:00:00Z`).getTime()) / 86_400_000);
}

export function lastSeen(date: string | null): string {
  const d = daysAgo(date);
  return d === null ? "Sin actividad" : d <= 0 ? "Hoy" : d === 1 ? "Ayer" : `Hace ${d} días`;
}
