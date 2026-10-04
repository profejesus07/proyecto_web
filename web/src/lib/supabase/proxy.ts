import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/env";

const PROTECTED = ["/gremio", "/portales", "/mision", "/perfil", "/tienda", "/cronicas", "/maestro", "/nueva-contrasena", "/suscribirse", "/admin"];
// Quien ya inició sesión no necesita ver la portada ni los formularios de entrada.
const AUTH_PAGES = ["/", "/ingresar", "/registro"];

/** Refresca la sesión en cada petición y protege las pantallas privadas. */
export async function updateSession(request: NextRequest) {
  const cfg = supabaseConfig();
  const { pathname } = request.nextUrl;
  const needsLogin = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!cfg) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  // Sin cookie de sesión no hay nada que validar: evitamos una llamada a Supabase en cada visita pública.
  const hasSessionCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  const user = hasSessionCookie ? (await supabase.auth.getUser()).data.user : null;

  if (!user && needsLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/ingresar";
    url.search = `?siguiente=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (user && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/gremio";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}
