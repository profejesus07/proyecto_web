import type { Metadata } from "next";
import Link from "next/link";
import { PriceForm } from "@/components/admin-client";
import { Icon } from "@/components/icons";
import { Sprite, asset } from "@/components/sprite";
import { Empty, PanelHeader, PanelSection } from "@/components/workspace/ui";
import { requireAdmin } from "@/lib/auth";
import { KIND_LABEL } from "@/lib/content";
import { getRepo } from "@/lib/data";
import { formatPrice } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Cursos y precios · Consola" };

export default async function PricesPage() {
  await requireAdmin("/admin/cursos");
  const courses = await getRepo().listCourses();
  return (
    <div className="space-y-8">
      <PanelHeader title="Cursos y precios" description="Lo que se cobra por cada curso publicado. La primera lección siempre es gratis.">
        <Link href="/admin/contenido" className="btn btn-secondary btn-sm"><Icon name="lesson" className="size-4" /> Editar contenido</Link>
      </PanelHeader>
      <PanelSection id="precios-t" title="Cursos publicados">
        {courses.length === 0 ? <Empty icon="tag">Todavía no hay cursos publicados.</Empty> : (
          <ul className="panel divide-y divide-line">
            {courses.map((c) => (
              <li key={c.slug} className="flex flex-wrap items-center gap-4 p-4">
                <Sprite src={asset.boss(c.guardian)} alt="" decorative className="size-12 shrink-0 rounded-lg bg-bg object-contain p-1" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">{c.title} <span className="badge badge-muted">{KIND_LABEL[c.kind]}</span>{c.isFree && <span className="badge badge-ok">Gratis</span>}</p>
                  <p className="text-sm text-muted">
                    {c.isFree ? <>Gratis para todos{c.price ? ` (el precio guardado, ${formatPrice(c.price)}, no se cobra)` : ""}.</>
                      : c.price ? <>Se vende a <strong className="text-text">{formatPrice(c.price)}</strong>. La muestra gratis llega hasta el primer reto.</>
                      : <>Sin precio: nadie puede comprarlo todavía.</>}
                  </p>
                </div>
                <PriceForm course={c.slug} title={c.title} price={c.price} isFree={c.isFree} />
              </li>
            ))}
          </ul>
        )}
      </PanelSection>
    </div>
  );
}
