import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";
import { Sprite, asset } from "@/components/sprite";

export const metadata: Metadata = { title: "Crear cuenta", description: "Crea tu cuenta, elige tu avatar y empieza tu aventura en la Academia Virtual Umbral." };

export default function RegisterPage() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.15fr]">
      <aside className="hidden space-y-5 lg:block">
        <p className="eyebrow">Únete al gremio</p>
        <h1 className="text-4xl">Tu aventura empieza aquí</h1>
        <p className="text-muted">Crear tu cuenta toma un minuto. Elige un avatar, ponle nombre y entra al primer portal.</p>
        <div className="panel relative overflow-hidden p-4">
          <Sprite src={asset.sora("saludar")} alt="Sora te da la bienvenida" className="mx-auto h-80 w-auto" />
        </div>
      </aside>
      <section className="panel p-6 sm:p-8" aria-labelledby="registro-t">
        <h2 id="registro-t" className="mb-6 text-2xl lg:sr-only">Crea tu cuenta</h2>
        <RegisterForm />
      </section>
    </div>
  );
}
