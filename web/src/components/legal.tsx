import { SiteShell } from "@/components/site-header";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <SiteShell>
      <header className="paper border-b border-line">
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-12 sm:px-6">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-2 text-sm text-muted">Última actualización: {updated}</p>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl space-y-10 px-4 py-12 leading-relaxed text-text/90 sm:px-6 [&_a]:text-cyan [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5">
        {children}
      </div>
    </SiteShell>
  );
}
