import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";
import { Sprite, asset } from "@/components/sprite";
import { safeNext } from "@/lib/validation";

export const metadata: Metadata = { title: "Ingresar", description: "Ingresa a tu cuenta de la Academia Virtual Umbral y continúa tu aventura." };

export default async function LoginPage({ searchParams }: PageProps<"/ingresar">) {
  const sp = await searchParams;
  const next = typeof sp.siguiente === "string" ? safeNext(sp.siguiente) : undefined;
  const notice = typeof sp.aviso === "string" ? sp.aviso : undefined;
  return (
    <div className="mx-auto grid max-w-3xl items-center gap-8 md:grid-cols-[1fr_1.2fr]">
      <aside className="hidden text-center md:block">
        <Sprite src={asset.kuro("saludar")} alt="Kuro te saluda" className="mx-auto h-56 w-auto" />
        <p className="mt-3 font-display text-xl font-bold">¡Qué bueno verte de nuevo!</p>
      </aside>
      <section className="panel p-6 sm:p-8" aria-labelledby="ingreso-t">
        <h1 id="ingreso-t" className="mb-6 text-3xl">Ingresar</h1>
        <LoginForm next={next} notice={notice} />
      </section>
    </div>
  );
}
