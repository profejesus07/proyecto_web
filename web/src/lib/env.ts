/** Lectura central de variables de entorno. Nunca lanza: la app debe poder abrirse sin configurar. */
export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
  return url && anonKey ? { url, anonKey } : null;
}

export function hasSupabase(): boolean {
  return supabaseConfig() !== null;
}

/** Solo para el servidor. */
export function serviceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

/**
 * Modo vista previa: datos de ejemplo en memoria, sin Supabase.
 * Solo existe en desarrollo y nunca en producción.
 */
export function isPreview(): boolean {
  return process.env.NODE_ENV !== "production" && (process.env.UMBRAL_PREVIEW === "1" || process.env.UMBRAL_PREVIEW === "anon");
}

/** Vista previa sin sesión iniciada (para ver las pantallas públicas). */
export function isPreviewAnon(): boolean {
  return isPreview() && process.env.UMBRAL_PREVIEW === "anon";
}

export const SITE_NAME = "UNEX Academy";
