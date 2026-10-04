import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/auth-forms";
import { requireViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default async function NewPasswordPage() {
  await requireViewer("/nueva-contrasena");
  return (
    <section className="panel mx-auto max-w-lg p-6 sm:p-8" aria-labelledby="nueva-t">
      <h1 id="nueva-t" className="mb-2 text-3xl">Crea tu contraseña nueva</h1>
      <p className="mb-6 text-muted">Usa al menos 8 caracteres, con letras y números. Después entrarás directo al Gremio.</p>
      <NewPasswordForm />
    </section>
  );
}
