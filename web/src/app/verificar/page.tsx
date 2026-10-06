import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { QrScanner } from "@/components/qr-scanner";
import { SiteShell } from "@/components/site-header";

export const metadata: Metadata = { title: "Verificar constancia", description: "Comprueba que una constancia de asistencia de la Academia Virtual Umbral es auténtica: escanea su código QR o escribe su código." };

export default async function VerifyFormPage({ searchParams }: PageProps<"/verificar">) {
  const sp = await searchParams;
  const raw = typeof sp.codigo === "string" ? sp.codigo.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
  if (raw.length === 11 && raw.startsWith("UMB")) redirect(`/verificar/UMB-${raw.slice(3, 7)}-${raw.slice(7)}`);
  return (
    <SiteShell>
      <header className="paper border-b border-line">
        <div className="mx-auto max-w-4xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
          <p className="eyebrow">Verificación</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Verificar una constancia</h1>
          <p className="mt-3 max-w-xl text-lg text-muted">Comprueba en segundos que una constancia de la Academia Virtual Umbral es auténtica.</p>
        </div>
      </header>
      <div className="mx-auto grid max-w-4xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-2">
        <section aria-labelledby="qr-t" className="space-y-4 rounded-2xl border border-line bg-white p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f3f1fa] text-[#4a22c9]"><Icon name="qr" /></span>
            <div>
              <h2 id="qr-t" className="text-xl">Escanea el código QR</h2>
              <p className="text-sm text-muted">Está en la esquina inferior derecha de la constancia.</p>
            </div>
          </div>
          <QrScanner />
        </section>
        <section aria-labelledby="codigo-t" className="space-y-4 rounded-2xl border border-line bg-white p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f3f1fa] text-[#4a22c9]"><Icon name="search" /></span>
            <div>
              <h2 id="codigo-t" className="text-xl">O escribe el código</h2>
              <p className="text-sm text-muted">Por ejemplo, UMB-7K3D-9QXA.</p>
            </div>
          </div>
          <form className="flex flex-wrap gap-2" role="search">
            <label htmlFor="codigo" className="sr-only">Código de verificación</label>
            <input id="codigo" name="codigo" defaultValue={typeof sp.codigo === "string" ? sp.codigo : ""} required placeholder="UMB-XXXX-XXXX" autoCapitalize="characters" className="input min-w-0 flex-1 font-mono uppercase" />
            <button type="submit" className="btn btn-primary">Verificar</button>
          </form>
          {raw && <p role="alert" className="text-sm font-medium text-coral">Ese código no tiene el formato correcto. Revisa que tenga 3 letras «UMB» y 8 caracteres más.</p>}
        </section>
      </div>
    </SiteShell>
  );
}
