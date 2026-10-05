import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { AudioDirector } from "@/components/sound";
import { requireViewer } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const viewer = await requireViewer();
  return (
    <>
      <SiteHeader />
      {!isAdmin(viewer.role) && <AudioDirector />}
      <main id="contenido" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 md:pb-12">{children}</main>
      <div className="hidden md:block"><Footer /></div>
    </>
  );
}
