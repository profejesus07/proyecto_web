import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

// En prueba: el estilo del Gremio en modo claro (.theme-claro).
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="theme-claro">
      <SiteHeader />
      <main id="contenido" className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>
      <Footer />
    </div>
  );
}
