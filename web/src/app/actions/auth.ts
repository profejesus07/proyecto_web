"use server";

import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, loginSchema, newPasswordSchema, registerSchema, safeNext } from "@/lib/validation";

export type FormState = { error?: string; message?: string; unconfirmedEmail?: string } | undefined;

const NOT_READY = "La plataforma todavía se está conectando. Vuelve a intentarlo en un momento.";

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Revisa los datos e inténtalo de nuevo.";
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
    if (error.code === "weak_password") return { error: "Esa contraseña es muy fácil de adivinar. Usa al menos 8 caracteres con letras y números." };
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
    if (error.code === "email_not_confirmed") {
      return { error: "Aún falta confirmar tu correo. Revisa tu bandeja de entrada (y la carpeta de spam).", unconfirmedEmail: parsed.data.email };
    }
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

const RATE_LIMITED = "Hay muchos intentos seguidos. Espera unos minutos y vuelve a probar.";

/** Reenvía el correo de confirmación. La respuesta es la misma exista o no la cuenta. */
export async function resendConfirmationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Escribe un correo válido." };
  if (!hasSupabase()) return { error: NOT_READY };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data, options: { emailRedirectTo: `${await siteUrl()}/auth/callback` } });
  if (error?.status === 429) return { error: RATE_LIMITED };
  return { message: "Listo. Si hay una cuenta pendiente con ese correo, te llegará un enlace nuevo en unos minutos." };
}

/** Envía el enlace para crear una contraseña nueva. No revela si el correo tiene cuenta. */
export async function requestPasswordResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Escribe un correo válido." };
  if (!hasSupabase()) return { error: NOT_READY };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${await siteUrl()}/auth/callback?next=/nueva-contrasena` });
  if (error?.status === 429) return { error: RATE_LIMITED };
  return { message: "Si ese correo tiene una cuenta, te enviamos un enlace para crear una contraseña nueva. Revisa también la carpeta de spam." };
}

/** Cambia la contraseña de quien tiene la sesión abierta (incluido quien llega desde el enlace del correo). */
export async function updatePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  if (!hasSupabase()) return { error: NOT_READY };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { error: "La contraseña nueva debe ser distinta de la anterior." };
    if (error.code === "weak_password") return { error: "Esa contraseña es muy fácil de adivinar. Usa al menos 8 caracteres con letras y números." };
    if (error.status === 401 || error.code === "session_not_found") return { error: "El enlace venció. Pide uno nuevo desde «¿Olvidaste tu contraseña?»." };
    if (error.status === 429) return { error: RATE_LIMITED };
    return { error: "No pudimos cambiar la contraseña. Inténtalo de nuevo." };
  }
  redirect("/gremio?aviso=clave");
}
