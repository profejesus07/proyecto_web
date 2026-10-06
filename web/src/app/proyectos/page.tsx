import type { Metadata } from "next";
import { SiteShell } from "@/components/site-header";

export const metadata: Metadata = { title: "Proyectos" };

// Sección reservada: el contenido de proyectos se agregará más adelante.
export default function ProjectsPage() {
  return (
    <SiteShell>
      <header className="paper border-b border-line">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
          <p className="eyebrow">Proyectos</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Proyectos</h1>
        </div>
      </header>
    </SiteShell>
  );
}
