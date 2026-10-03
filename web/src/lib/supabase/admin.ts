import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serviceRoleKey, supabaseConfig } from "@/lib/env";

/**
 * Cliente con permisos totales. SOLO en el servidor y SOLO después de comprobar quién es el usuario.
 * La clave nunca debe llevar el prefijo NEXT_PUBLIC_.
 */
export function createAdminClient() {
  const cfg = supabaseConfig();
  const key = serviceRoleKey();
  if (!cfg || !key) throw new Error("supabase_no_configurado");
  return createClient(cfg.url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
