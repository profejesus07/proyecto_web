import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";
import { Sprite } from "@/components/sprite";
import { safeNext } from "@/lib/validation";

export const metadata: Metadata = { title: "Ingresar", description: "Ingresa a tu cuenta de UNEX Academy y continúa tu aventura." };

export default async function LoginPage({ searchParams }: PageProps<"/ingresar">) {
  const sp = await searchParams;
  const next = typeof sp.siguiente === "string" ? safeNext(sp.siguiente) : undefined;
  const notice = typeof sp.aviso === "string" ? sp.aviso : undefined;
  return (
    <div className="mx-auto grid max-w-3xl items-center gap-8 md:grid-cols-[1fr_1.2fr]">
      <aside className="hidden text-center md:block">
        <Sprite src="/assets/maestros/maestra-ilia/maestra-ilia-abrir-portal.svg" alt="La Maestra Ilia abre un portal" className="mx-auto h-56 w-auto" />
        <p className="mt-3 font-display text-xl font-bold">¡Qué bueno verte de nuevo!</p>
      </aside>
      <section className="panel p-6 sm:p-8" aria-labelledby="ingreso-t">
        <h1 id="ingreso-t" className="mb-6 text-3xl">Ingresar</h1>
        <LoginForm next={next} notice={notice} />
      </section>
    </div>
  );
}
