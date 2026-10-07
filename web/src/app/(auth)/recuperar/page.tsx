import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth-forms";
import { Sprite, asset } from "@/components/sprite";

export const metadata: Metadata = { title: "Recuperar contraseña", description: "Crea una contraseña nueva para tu cuenta de UNEX Academy." };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto grid max-w-3xl items-center gap-8 md:grid-cols-[1fr_1.2fr]">
      <aside className="hidden text-center md:block">
        <Sprite src={asset.kuro("pensar")} alt="Kuro piensa" className="mx-auto h-56 w-auto" />
        <p className="mt-3 font-display text-xl font-bold">A cualquiera se le olvida.</p>
      </aside>
      <section className="panel p-6 sm:p-8" aria-labelledby="recuperar-t">
        <h1 id="recuperar-t" className="mb-6 text-3xl">¿Olvidaste tu contraseña?</h1>
        <ForgotPasswordForm />
      </section>
    </div>
  );
}
