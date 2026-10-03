import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { requireViewer } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireViewer();
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 md:pb-12">{children}</main>
      <div className="hidden md:block"><Footer /></div>
    </>
  );
}
