import { NextResponse, type NextRequest } from "next/server";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation";

/** Destino del enlace del correo de confirmación. Cambia el código por una sesión. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code && hasSupabase()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    // Supabase ya verificó el enlace antes de traer aquí el código. Si no se puede abrir la sesión,
    // casi siempre es porque el correo se abrió en otro navegador: la cuenta sí quedó confirmada.
    const aviso = next === "/nueva-contrasena" ? "recuperar-otro-navegador" : "confirmado";
    return NextResponse.redirect(`${origin}/ingresar?aviso=${aviso}`);
  }
  return NextResponse.redirect(`${origin}/ingresar?aviso=enlace`);
}
