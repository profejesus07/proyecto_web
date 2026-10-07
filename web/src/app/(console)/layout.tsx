import type { Viewport } from "next";
import { Workspace } from "@/components/workspace/workspace";
import { ADMIN_GROUPS } from "@/components/workspace/nav-config";
import { requireAdmin } from "@/lib/auth";

// Tema claro: la barra del navegador en el celular es blanca, como la cabecera del panel.
export const viewport: Viewport = { themeColor: "#FFFFFF", colorScheme: "light" };

/** Consola de administración: panel claro y profesional, sin elementos del juego. */
export default async function ConsoleLayout({ children }: LayoutProps<"/">) {
  const viewer = await requireAdmin("/admin");
  return (
    <Workspace viewer={viewer} badge="Consola" home="/admin" groups={ADMIN_GROUPS} navLabel="Consola">
      {children}
    </Workspace>
  );
}
