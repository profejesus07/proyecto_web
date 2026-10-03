"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, safeNext } from "@/lib/validation";

export type FormState = { error?: string; message?: string } | undefined;

const NOT_READY = "La plataforma todavía se está conectando. Vuelve a intentarlo en un momento.";

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Revisa los datos e inténtalo de nuevo.";
}

async function siteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    avatar: formData.get("avatar") ?? "aria",
    consent: formData.get("consent"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  if (!hasSupabase()) return { error: NOT_READY };

  const { displayName, email, password, role, avatar } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName, role, avatar }, emailRedirectTo: `${await siteUrl()}/auth/callback` },
  });

  if (error) {
    if (error.code === "user_already_exists" || /already/i.test(error.message)) {
      return { error: "Ya existe una cuenta con ese correo. Prueba a iniciar sesión." };
    }
    if (error.code === "weak_password") return { error: "Esa contraseña es muy fácil de adivinar. Prueba con otra más larga." };
    if (error.code === "over_email_send_rate_limit" || error.status === 429) return { error: "Hay muchos intentos seguidos. Espera un minuto y vuelve a probar." };
    return { error: "No pudimos crear tu cuenta. Inténtalo de nuevo en un momento." };
  }
  // Si Supabase no exige confirmar el correo, la sesión ya existe.
  if (data.session) redirect("/gremio");
  return { message: "¡Casi listo! Te enviamos un correo para confirmar tu cuenta. Ábrelo y pulsa el enlace para entrar al gremio." };
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  if (!hasSupabase()) return { error: NOT_READY };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "Aún falta confirmar tu correo. Revisa tu bandeja de entrada." };
    if (error.status === 429) return { error: "Demasiados intentos. Espera un minuto y vuelve a probar." };
    return { error: "El correo o la contraseña no coinciden." };
  }
  redirect(safeNext(formData.get("siguiente")));
}

export async function logoutAction(): Promise<void> {
  if (hasSupabase()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
