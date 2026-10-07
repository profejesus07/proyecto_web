import type { Viewport } from "next";
import { EncabezadoPublico } from "@/components/encabezado/EncabezadoPublico";
import { Footer } from "@/components/footer";
import { PiePublico } from "@/components/PiePublico";
import { SiteHeader } from "@/components/site-header";
import { VIEWPORT_PUBLICO } from "@/config/viewport-publico";
import { getViewer } from "@/lib/auth";

/** Sin sesión, la barra del navegador en Cosmos, como el resto del sitio público; con sesión, la del Gremio. */
export async function generateViewport(): Promise<Viewport> {
  return (await getViewer()) ? {} : VIEWPORT_PUBLICO;
}

const MAIN = "mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14";

/** Ingresar, registro y recuperar: sin sesión, en el tema claro del sitio público; con sesión, con la cabecera del Gremio. */
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <div data-tema="claro" className="sitio-publico">
        <EncabezadoPublico />
        <main id="contenido" className={MAIN}>{children}</main>
        <PiePublico />
      </div>
    );
  }
  return (
    <>
      <SiteHeader />
      <main id="contenido" className={MAIN}>{children}</main>
      <Footer />
    </>
  );
}
