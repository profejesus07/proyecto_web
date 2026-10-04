import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Verificar constancia", description: "Comprueba que una constancia de asistencia de la Academia Virtual Umbral es auténtica." };

export default async function VerifyFormPage({ searchParams }: PageProps<"/verificar">) {
  const sp = await searchParams;
  const raw = typeof sp.codigo === "string" ? sp.codigo.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
  if (raw.length === 11 && raw.startsWith("UMB")) redirect(`/verificar/UMB-${raw.slice(3, 7)}-${raw.slice(7)}`);
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6">
        <p className="eyebrow">Verificación</p>
        <h1 className="mt-2 text-4xl">Verificar una constancia</h1>
        <p className="mt-3 text-muted">Escribe el código que aparece en la constancia (por ejemplo, UMB-7K3D-9QXA) o escanea su código QR.</p>
        <form className="mt-6 flex flex-wrap gap-2" role="search">
          <label htmlFor="codigo" className="sr-only">Código de verificación</label>
          <input id="codigo" name="codigo" defaultValue={typeof sp.codigo === "string" ? sp.codigo : ""} required placeholder="UMB-XXXX-XXXX" autoCapitalize="characters" className="input min-w-0 flex-1 font-mono uppercase" />
          <button type="submit" className="btn btn-primary">Verificar</button>
        </form>
        {raw && <p role="alert" className="mt-3 text-sm font-medium text-[#ffb3b3]">Ese código no tiene el formato correcto. Revisa que tenga 3 letras «UMB» y 8 caracteres más.</p>}
      </main>
      <Footer />
    </>
  );
}
