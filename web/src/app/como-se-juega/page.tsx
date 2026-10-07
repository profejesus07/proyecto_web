import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-header";
import { VIEWPORT_PUBLICO } from "@/config/viewport-publico";

export const viewport = VIEWPORT_PUBLICO;

export const metadata: Metadata = {
  title: "Cómo se juega",
  description: "Cómo se aprende en UNEX Academy: portales con lecciones breves, misiones, guardianes y constancias verificables.",
  alternates: { canonical: "/como-se-juega" },
};

// Versión mínima: el contenido completo (con ilustraciones del mundo Umbral) llega en una etapa posterior.
const PASOS = [
  { t: "Entra al Gremio", d: "Creas tu cuenta gratis y eliges tu avatar. El Gremio es tu casa: desde ahí ves tus portales, tu racha y tus logros." },
  { t: "Cruza un portal", d: "Cada curso es un portal con lecciones breves. La primera lección de cada curso es gratis." },
  { t: "Supera las misiones", d: "Cada lección termina con una misión: preguntas que se responden en el momento. Si no la superas a la primera, puedes repetirla las veces que quieras." },
  { t: "Vence al guardián", d: "Al final del portal espera un guardián, y cada uno representa un obstáculo para aprender, como el miedo a equivocarse o dejarlo para después." },
  { t: "Recibe tu constancia", d: "Al terminar un curso corto recibes una constancia de asistencia que cualquiera puede verificar en línea con su código." },
];

export default function ComoSeJuegaPage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="eyebrow">UNEX Academy</p>
        <h1 className="mt-2">Cómo se juega</h1>
        <p className="mt-4 text-lg text-muted">Aquí aprender se vive como una aventura. No necesitas instalar nada: funciona en el navegador del celular, la tableta o el computador, y tu avance se guarda en tu cuenta.</p>

        <ol className="mt-10 space-y-4">
          {PASOS.map((p, i) => (
            <li key={p.t} className="panel flex gap-4 p-5">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-accion font-display text-sm font-bold text-sobre-accion">{i + 1}</span>
              <div>
                <h2 className="text-xl">{p.t}</h2>
                <p className="mt-1 text-muted">{p.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/registro" className="btn btn-primary">Crear cuenta gratis</Link>
          <Link href="/programas" className="btn btn-secondary">Ver cursos</Link>
        </div>
      </div>
    </SiteShell>
  );
}
