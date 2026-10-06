import { Workspace } from "@/components/workspace/workspace";
import { ADMIN_GROUPS } from "@/components/workspace/nav-config";
import type { WorkspaceGroup } from "@/components/workspace/workspace-nav";
import { requireTeacher } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { isAdmin } from "@/lib/roles";

/**
 * Panel docente: el docente supervisa a los estudiantes que el administrador le asigna (por
 * grupos). No juega ni administra: ve progreso y estadísticas. El administrador también abre
 * aquí los informes, con el menú de su consola.
 */
export default async function PanelLayout({ children }: LayoutProps<"/">) {
  const viewer = await requireTeacher("/maestro");
  if (isAdmin(viewer.role)) {
    return <Workspace viewer={viewer} badge="Consola" home="/admin" groups={ADMIN_GROUPS} navLabel="Consola">{children}</Workspace>;
  }
  const classes = (await getRepo().listTeacherClasses(viewer.id)).filter((c) => !c.archived);
  const groups: WorkspaceGroup[] = [
    { links: [{ href: "/maestro", label: "Resumen", icon: "grid", exact: true }] },
    ...(classes.length ? [{ title: "Mis grupos", links: classes.map((c) => ({ href: `/maestro/${c.id}`, label: c.name, icon: "people" as const, meta: String(c.members) })) }] : []),
  ];
  return <Workspace viewer={viewer} badge="Panel docente" home="/maestro" groups={groups} navLabel="Panel docente">{children}</Workspace>;
}
