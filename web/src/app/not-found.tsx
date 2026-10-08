import Link from "next/link";
import { SiteShell } from "@/components/site-header";
import { Sprite, asset } from "@/components/sprite";

export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-20 text-center">
        <Sprite src={asset.eon("pensar")} alt="El Archivista Eon piensa" priority className="h-40 w-auto" />
        <p className="eyebrow">Error 404</p>
        <h1 className="text-4xl">Este portal no existe</h1>
        <p className="text-muted">Quizá el enlace cambió o todavía no se abre. Vuelve al inicio y sigue explorando.</p>
        <Link href="/" className="btn btn-primary btn-lg">Volver al inicio</Link>
      </div>
    </SiteShell>
  );
}
