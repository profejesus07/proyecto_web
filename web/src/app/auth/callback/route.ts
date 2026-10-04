import { NextResponse, type NextRequest } from "next/server";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { homeForUser } from "@/lib/auth";
import { safeNext } from "@/lib/validation";

/** Destino del enlace del correo de confirmación. Cambia el código por una sesión. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const next = safeNext(rawNext);

  if (code && hasSupabase()) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    // Sin destino concreto (confirmación del registro), cada cuenta va a su inicio.
    if (!error) return NextResponse.redirect(`${origin}${rawNext ? next : await homeForUser(data.user.id)}`);
    // Supabase ya verificó el enlace antes de traer aquí el código. Si no se puede abrir la sesión,
    // casi siempre es porque el correo se abrió en otro navegador: la cuenta sí quedó confirmada.
    const aviso = next === "/nueva-contrasena" ? "recuperar-otro-navegador" : "confirmado";
    return NextResponse.redirect(`${origin}/ingresar?aviso=${aviso}`);
  }
  return NextResponse.redirect(`${origin}/ingresar?aviso=enlace`);
}
