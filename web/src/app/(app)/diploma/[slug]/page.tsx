import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bricolage, dmSans } from "@/app/fonts/documentos";
import { PrintButton } from "@/components/print-button";
import { requirePlayer } from "@/lib/auth";
import { loadDiplomas } from "@/lib/data/queries";
import { renderDiploma } from "@/lib/diploma";

export const metadata: Metadata = { title: "Diploma Sello del Portal" };

export default async function DiplomaPage({ params }: PageProps<"/diploma/[slug]">) {
  const { slug } = await params;
  const viewer = await requirePlayer(`/diploma/${slug}`);
  const diploma = (await loadDiplomas(viewer.id)).find((d) => d.slug === slug);
  if (!diploma) notFound();
  const date = new Date(diploma.date).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" });
  const svg = renderDiploma({ name: viewer.displayName, course: diploma.title, date });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="eyebrow">Tu diploma del juego</p>
          <h1 className="text-2xl sm:text-3xl">{diploma.title}</h1>
        </div>
        <PrintButton />
      </div>
      <p className="text-sm text-muted print:hidden">
        Para guardarlo como PDF, pulsa «Descargar PDF / imprimir» y elige «Guardar como PDF». Este diploma celebra tu logro en UMBRAL; no es una constancia de estudios.
        {diploma.certifiable && <> Este curso también da constancia de asistencia: <Link href={`/constancia/solicitar/${diploma.slug}`} className="font-semibold text-cyan underline underline-offset-4">solicítala aquí</Link>.</>}
      </p>
      {/* El SVG sale de una plantilla propia; el nombre y el curso van escapados en renderDiploma.
          El diploma es arte del mundo: conserva Bricolage y DM Sans, que la plantilla pide como
          --font-display y --font-body y que este contenedor define solo para él. */}
      <div className={`${bricolage.variable} ${dmSans.variable} certificate overflow-hidden rounded-2xl shadow-2xl print:rounded-none print:shadow-none`} dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}
