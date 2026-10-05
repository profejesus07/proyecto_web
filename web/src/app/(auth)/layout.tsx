import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>
      <Footer />
    </>
  );
}
