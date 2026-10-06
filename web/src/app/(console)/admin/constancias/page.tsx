import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { IssuerSettingsForm } from "@/components/issuer-settings-form";
import { shortDate } from "@/components/workspace/admin-format";
import { Empty, Kpi, PanelHeader, PanelSection } from "@/components/workspace/ui";
import { requireAdmin } from "@/lib/auth";
import { normAnswer } from "@/lib/activities";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Constancias · Consola" };

export default async function CertificatesPage({ searchParams }: PageProps<"/admin/constancias">) {
  await requireAdmin("/admin/constancias");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80).trim() : "";
  const repo = getRepo();
  const [settings, all] = await Promise.all([repo.getIssuerSettings(), repo.listCertificates({ limit: 500 })]);
  const words = normAnswer(q).split(" ").filter(Boolean);
  const certs = all.filter((c) => {
    const hay = normAnswer(`${c.participantName} ${c.courseTitle} ${c.code} ${c.docNumber}`);
    return words.every((w) => hay.includes(w));
  });
  const ready = !!settings.issuerName && !!settings.signaturePng;
  const year = new Date().getFullYear();

  return (
    <div className="space-y-8">
      <PanelHeader title="Constancias de asistencia" description="Las constancias de los cursos cortos: quién firma, cuáles se han expedido y cómo se ven.">
        <Link href="/verificar" className="btn btn-secondary btn-sm"><Icon name="qr" className="size-4" /> Verificación pública</Link>
      </PanelHeader>

      <dl className="grid gap-4 sm:grid-cols-3">
        <Kpi icon="seal" label="Expedidas" value={all.length} />
        <Kpi icon="clock" label={`En ${year}`} value={all.filter((c) => new Date(c.issuedAt).getFullYear() === year).length} tone="muted" />
        <Kpi icon={ready ? "check" : "alert"} label="Firma del responsable" value={ready ? "Lista" : "Pendiente"} tone={ready ? "ok" : "warn"} hint={ready ? settings.issuerName : "Sin ella no se pueden expedir"} />
      </dl>

      <section aria-labelledby="firma-t" className="panel space-y-3 p-5 sm:p-6">
        <div>
          <h2 id="firma-t" className="text-lg">Responsable y firma</h2>
          <p className="text-sm text-muted">Aparecen en todas las constancias que se expidan desde ahora. Las ya expedidas no cambian.</p>
        </div>
        {!ready && <p role="note" className="flex items-center gap-2 rounded-lg bg-[#fffaeb] px-3 py-2 text-sm font-semibold text-warn"><Icon name="alert" className="size-4" /> Mientras falten el nombre y la firma, los estudiantes no podrán obtener su constancia.</p>}
        <IssuerSettingsForm settings={settings} />
      </section>

      <PanelSection id="const-t" title="Constancias expedidas" description={q ? `${certs.length} resultados para «${q}»` : undefined}
        action={
          <form role="search" className="flex w-full flex-wrap gap-2 sm:w-auto">
            <label htmlFor="buscar-const" className="sr-only">Buscar constancias</label>
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input id="buscar-const" name="q" defaultValue={q} placeholder="Nombre, curso, código o documento" className="input !pl-9 sm:!w-80" />
            </div>
            <button type="submit" className="btn btn-secondary">Buscar</button>
            {q && <Link href="/admin/constancias" className="btn btn-ghost">Limpiar</Link>}
          </form>
        }>
        {certs.length === 0 ? <Empty icon="seal">{q ? "Ninguna constancia coincide con la búsqueda." : "Todavía no se ha expedido ninguna constancia."}</Empty> : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <caption className="sr-only">Constancias expedidas</caption>
              <thead className="border-b border-line bg-[#f8f8fc] text-xs uppercase tracking-wider text-muted">
                <tr><th className="px-4 py-3">N.º</th><th className="px-3 py-3">Participante</th><th className="px-3 py-3">Curso</th><th className="px-3 py-3">Expedida</th><th className="px-3 py-3">Código</th><th className="px-3 py-3"><span className="sr-only">Acciones</span></th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {certs.map((c) => (
                  <tr key={c.code} className="hover:bg-[#fafafd]">
                    <td className="px-4 py-3 font-mono text-muted">{String(c.number).padStart(6, "0")}</td>
                    <td className="px-3 py-3 font-medium">{c.participantName}</td>
                    <td className="px-3 py-3">{c.courseTitle} <span className="text-muted">· {c.hours} h</span></td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{shortDate(c.issuedAt)}</td>
                    <td className="px-3 py-3 font-mono text-xs">{c.code}</td>
                    <td className="px-3 py-3 text-right">
                      <Link href={`/admin/constancias/${c.code}`} className="btn btn-secondary btn-sm" aria-label={`Ver la constancia de ${c.participantName}`}><Icon name="eye" className="size-4" /> Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelSection>
    </div>
  );
}
