import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteShell } from "@/components/site-header";
import { AUDIENCES, PROCESS, PROJECTS, SERVICES } from "@/content/servicios";
import { SUPPORT_EMAIL } from "@/lib/features";

export const metadata: Metadata = {
  title: "Servicios para docentes e instituciones",
  description: "Cursos y clases con historia, plataformas de gestión docente, exámenes institucionales, aplicaciones, juegos y gamificación educativa a la medida.",
};

const mail = (subject: string) => `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("Hola. Soy (nombre y cargo) de (institución). Nos interesa:\n\n")}`;

export default function ServicesPage() {
  const [main, ...rest] = SERVICES;
  return (
    <SiteShell>
      {/* ===== Encabezado ===== */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 lg:pt-20">
        <p className="eyebrow">Servicios</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[1.02] sm:text-7xl">Tecnología educativa con alma de aventura.</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted sm:text-xl">Para docentes, directivos docentes e instituciones educativas. Lo principal son nuestros cursos y clases; alrededor, todo lo que tu institución necesita para enseñar mejor.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#contacto" className="btn btn-primary btn-lg">Solicitar una propuesta</a>
          <a href="#portafolio" className="btn btn-secondary btn-lg">Ver el portafolio</a>
        </div>
      </section>

      {/* ===== Servicio principal ===== */}
      <section aria-labelledby="principal-t" className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 overflow-hidden rounded-[2rem] bg-[#15120f] p-8 text-[#f6f3ee] sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b7a8ff]">Servicio principal</p>
            <h2 id="principal-t" className="text-4xl font-extrabold leading-tight sm:text-5xl">{main.title}</h2>
            <p className="text-lg text-[#c9c2b6]">{main.lead}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/programas" className="btn btn-lg bg-[#f6f3ee] text-[#15120f] hover:bg-white">Ver cursos y clases</Link>
              <a href={mail("Cursos y clases para mi institución")} className="btn btn-lg border-white/40 text-[#f6f3ee] hover:bg-white/10">Para mi institución</a>
            </div>
          </div>
          <ul className="grid content-center gap-3">
            {main.features.map((f) => (
              <li key={f} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><Icon name="check" className="mt-0.5 size-5 shrink-0 text-[#b7a8ff]" />{f}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== Portafolio de servicios ===== */}
      <section id="portafolio" aria-labelledby="portafolio-t" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <p className="eyebrow">Portafolio</p>
          <h2 id="portafolio-t" className="text-4xl font-extrabold sm:text-5xl">Lo que construimos para ti</h2>
        </div>
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((s) => (
            <li key={s.id} className="flex flex-col rounded-3xl border border-line bg-panel p-7 transition hover:-translate-y-1 hover:shadow-xl">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#4a2fd6]/10 text-cyan"><Icon name={s.icon} className="size-6" /></span>
              <h3 className="mt-5 text-2xl font-extrabold leading-tight">{s.title}</h3>
              <p className="mt-2 text-muted">{s.lead}</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {s.features.map((f) => <li key={f} className="flex gap-2"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-cyan" />{f}</li>)}
              </ul>
              <a href={mail(`Me interesa: ${s.title}`)} className="mt-auto inline-flex items-center gap-1.5 pt-6 font-bold text-cyan hover:underline hover:underline-offset-4">
                Solicitar demo <Icon name="arrow" className="size-4" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Para quién ===== */}
      <section aria-labelledby="quien-t" className="border-y border-line bg-panel">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="quien-t" className="max-w-2xl text-4xl font-extrabold sm:text-5xl">Pensado para quien enseña</h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3">
            {AUDIENCES.map((a) => (
              <li key={a.title} className="space-y-2 bg-panel p-7">
                <h3 className="text-xl font-extrabold">{a.title}</h3>
                <p className="text-muted">{a.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== Proyectos ===== */}
      <section aria-labelledby="proyectos-t" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <p className="eyebrow">Proyectos</p>
          <h2 id="proyectos-t" className="text-4xl font-extrabold sm:text-5xl">Ya están funcionando</h2>
        </div>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {PROJECTS.map((p) => (
            <li key={p.title} className="flex flex-col rounded-3xl border border-line bg-panel p-7">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{p.kind}</p>
              <h3 className="mt-2 text-2xl font-extrabold">{p.title}</h3>
              <p className="mt-2 text-muted">{p.text}</p>
              {p.href ? (
                <Link href={p.href} className="mt-auto inline-flex items-center gap-1.5 pt-5 font-bold text-cyan hover:underline hover:underline-offset-4">Conocerlo <Icon name="arrow" className="size-4" /></Link>
              ) : (
                <a href={mail(`Demo de ${p.title}`)} className="mt-auto inline-flex items-center gap-1.5 pt-5 font-bold text-cyan hover:underline hover:underline-offset-4">Solicitar demo <Icon name="arrow" className="size-4" /></a>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Cómo trabajamos ===== */}
      <section aria-labelledby="proceso-t" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 id="proceso-t" className="text-4xl font-extrabold sm:text-5xl">Cómo trabajamos</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-4">
          {PROCESS.map((p, i) => (
            <li key={p.title} className="space-y-2 border-t-2 border-[#15120f] pt-5">
              <span className="font-display text-sm font-bold text-cyan">0{i + 1}</span>
              <h3 className="text-xl font-extrabold">{p.title}</h3>
              <p className="text-muted">{p.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ===== Contacto ===== */}
      <section id="contacto" aria-labelledby="contacto-t" className="scroll-mt-20 px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-line bg-panel p-8 text-center sm:p-14">
          <h2 id="contacto-t" className="text-4xl font-extrabold leading-tight sm:text-5xl">Cuéntanos qué quieres lograr</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">Escríbenos con el nombre de tu institución, tu cargo y lo que necesitas. Te respondemos con una propuesta.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={mail("Solicitud de propuesta")} className="btn btn-primary btn-lg">Escribir a {SUPPORT_EMAIL}</a>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
