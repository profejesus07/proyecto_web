import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Familias y docentes",
  description: "Cómo las familias acompañan el avance de sus hijos y cómo los docentes siguen a sus grupos en UNEX Academy.",
  alternates: { canonical: "/familias-y-docentes" },
};

// Versión mínima: el contenido completo llega en una etapa posterior.
const SECCIONES = [
  {
    id: "familias",
    t: "Para las familias",
    puntos: [
      "Con una cuenta de familia acompañas el avance de tus hijos: sus portales, sus notas y su racha.",
      "Para vincularte, tu hijo o hija te muestra su código de familia desde su cuenta. Así da su permiso.",
      "Solo ves su avance: nunca su correo, su contraseña ni sus respuestas. Puede dejar de compartirlo desde su perfil.",
      "Si tu hijo o hija es menor de edad, tú autorizas el uso de la plataforma.",
    ],
  },
  {
    id: "docentes",
    t: "Para los docentes",
    puntos: [
      "El panel docente reúne a tus estudiantes por grupos y muestra su avance en cada portal.",
      "Señala a los estudiantes que necesitan apoyo y las preguntas en las que más se equivocan.",
      "Las cuentas para un grupo o una institución se crean contigo: escríbenos y lo organizamos.",
    ],
  },
];

export default function FamiliasYDocentesPage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="eyebrow">UNEX Academy</p>
        <h1 className="mt-2">Familias y docentes</h1>
        <p className="mt-4 text-lg text-muted">Quien aprende no lo hace solo. Las familias y los docentes ven el avance de sus estudiantes y saben cuándo darles una mano.</p>

        {SECCIONES.map((s) => (
          <section key={s.id} aria-labelledby={`${s.id}-t`} className="panel mt-8 p-6 sm:p-8">
            <h2 id={`${s.id}-t`}>{s.t}</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 marker:text-accion">
              {s.puntos.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </section>
        ))}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/registro" className="btn btn-primary">Crear cuenta gratis</Link>
          <Link href="/programas" className="btn btn-secondary">Ver cursos</Link>
        </div>
      </div>
    </SiteShell>
  );
}
