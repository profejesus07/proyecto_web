import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteShell } from "@/components/site-header";
import { PROCESS, SERVICES } from "@/content/servicios";
import { SUPPORT_EMAIL } from "@/lib/features";

export const metadata: Metadata = {
  title: "Servicios",
  description: "Cursos y clases con historia, plataformas de gestión docente, exámenes institucionales, aplicaciones, juegos y gamificación educativa a la medida.",
};

const mail = (subject: string) => `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("Hola. Soy (nombre y cargo) de (institución). Nos interesa:\n\n")}`;

export default function ServicesPage() {
  return (
    <SiteShell>
      {/* ===== Encabezado ===== */}
      <header className="paper border-b border-line">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
          <p className="eyebrow">Servicios</p>
          <h1 className="mt-2 max-w-3xl text-4xl leading-tight sm:text-5xl">Tecnología educativa para docentes e instituciones</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">Soluciones a la medida, con la identidad de tu institución y acompañamiento real.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={mail("Solicitud de propuesta")} className="btn btn-primary btn-lg">Solicitar una propuesta</a>
            <a href="#servicios" className="btn btn-secondary btn-lg">Ver servicios</a>
          </div>
        </div>
      </header>

      {/* ===== Servicios ===== */}
      <section id="servicios" aria-label="Servicios" className="mx-auto max-w-6xl scroll-mt-28 px-4 pt-16 sm:px-6">
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <li key={s.id} className="lift flex flex-col rounded-2xl border border-line bg-panel p-7">
              <span className={`grid size-12 place-items-center rounded-xl ${s.main ? "bg-violet text-white" : "bg-cyan/10 text-cyan"}`}><Icon name={s.icon} className="size-6" /></span>
              <h3 className="mt-5 text-xl leading-snug">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.lead}</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {s.features.slice(0, 3).map((f) => <li key={f} className="flex gap-2"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-cyan" />{f}</li>)}
              </ul>
              {s.main ? (
                <Link href="/programas" className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-cyan hover:underline hover:underline-offset-4">Ver cursos <Icon name="arrow" className="size-4" /></Link>
              ) : (
                <a href={mail(`Me interesa: ${s.title}`)} className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-cyan hover:underline hover:underline-offset-4">Solicitar demo <Icon name="arrow" className="size-4" /></a>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Cómo trabajamos ===== */}
      <section aria-labelledby="proceso-t" className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <p className="eyebrow">Proceso</p>
        <h2 id="proceso-t" className="mt-2 text-3xl sm:text-4xl">Cómo trabajamos</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((p, i) => (
            <li key={p.title} className="border-t-2 border-cyan pt-5">
              <span className="serif text-sm text-cyan">Paso {i + 1}</span>
              <h3 className="mt-1 text-xl">{p.title}</h3>
              <p className="mt-1 text-sm text-muted">{p.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ===== Contacto ===== */}
      <section id="contacto" aria-labelledby="contacto-t" className="mx-auto max-w-6xl scroll-mt-28 px-4 pt-24 sm:px-6">
        <div className="ink-band rounded-3xl p-8 text-center sm:p-14">
          <p className="eyebrow">Contacto</p>
          <h2 id="contacto-t" className="mt-2 text-3xl sm:text-4xl">Cuéntanos qué quieres lograr</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/75">Escríbenos con el nombre de tu institución y lo que necesitas. Te respondemos con una propuesta.</p>
          <a href={mail("Solicitud de propuesta")} className="btn btn-gold btn-lg mt-8 max-w-full whitespace-normal">Escribir a {SUPPORT_EMAIL}</a>
        </div>
      </section>
    </SiteShell>
  );
}
