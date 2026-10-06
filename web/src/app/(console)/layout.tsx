import { Workspace } from "@/components/workspace/workspace";
import { ADMIN_GROUPS } from "@/components/workspace/nav-config";
import { requireAdmin } from "@/lib/auth";

/** Consola de administración: panel claro y profesional, sin elementos del juego. */
export default async function ConsoleLayout({ children }: LayoutProps<"/">) {
  const viewer = await requireAdmin("/admin");
  return (
    <Workspace viewer={viewer} badge="Consola" home="/admin" groups={ADMIN_GROUPS} navLabel="Consola">
      {children}
    </Workspace>
  );
}
