import type { Metadata } from "next";
import Link from "next/link";
import { FranjaPortada } from "@/components/FranjaPortada";
import { SiteShell } from "@/components/site-header";
import { Sprite } from "@/components/sprite";
import { VIEWPORT_PUBLICO } from "@/config/viewport-publico";
import { SUPPORT_EMAIL } from "@/lib/features";

export const viewport = VIEWPORT_PUBLICO;

export const metadata: Metadata = {
  title: "Familias y docentes",
  description: "Cómo las familias acompañan el avance de sus hijos y cómo los docentes e instituciones siguen a sus grupos en UNEX Academy.",
  alternates: { canonical: "/familias-y-docentes" },
};

// Los límites (8 caracteres, 8 estudiantes, 4 familias, 5 mensajes) y el criterio de «necesita apoyo» salen de
// app/actions/family.ts y lib/supervision.ts; si cambian allá, se actualizan aquí.
const VINCULAR = [
  <>Crea tu cuenta y elige «Familia».</>,
  <>Tu hijo o hija entra a su cuenta, abre <strong className="font-semibold">Perfil → Mi familia</strong> y pulsa <strong className="font-semibold">«Mostrar mi código de familia»</strong>.</>,
  <>Escribes ese código de 8 caracteres en tu panel. Así sabe que verás su avance y da su permiso.</>,
];

const PANEL_DOCENTE = [
  { t: "Informe del grupo", d: "el avance de cada estudiante, misión por misión, con su mejor nota." },
  { t: "Estudiantes que necesitan apoyo", d: "los que llevan una semana o más sin entrar o tienen retos intentados que aún no superan." },
  { t: "Preguntas que más cuestan", d: "las de menor porcentaje de aciertos, con la respuesta correcta y su explicación." },
  { t: "Detalle de cada estudiante", d: "su actividad reciente y sus notas, con búsqueda y filtros." },
];

const INSTITUCIONES = [
  "Creamos las cuentas de tus estudiantes desde una lista de Excel, con usuario y contraseña, sin necesidad de correo.",
  "Clases por área, grado y periodo, con acceso durante el año escolar.",
  "Cursos cortos con constancia de asistencia verificable en línea.",
];

const LISTA = "mt-3 list-disc space-y-2 pl-5 marker:text-accion";

// Reparto de personajes: CLAUDE.md, «Reparto de personajes en páginas públicas».
const GUARDIANES_HOGAR = [["mama-lucia", "Mamá Lucía"], ["papa-kenji", "Papá Kenji"], ["abuela-amara", "Abuela Amara"], ["abuelo-iker", "Abuelo Iker"]];
const MAESTROS = [["maestra-ilia", "Maestra Ilia"], ["maestra-nadia", "Maestra Nadia"], ["maestro-olu", "Maestro Olu"], ["maestro-ravi", "Maestro Ravi"]];

/** Los cuatro personajes de un rol, en reposo y con su nombre. Cargan en diferido (no se ven al abrir). */
function Elenco({ etiqueta, carpeta, personas }: { etiqueta: string; carpeta: string; personas: string[][] }) {
  return (
    <ul aria-label={etiqueta} className="grid grid-cols-4 gap-2 sm:gap-4">
      {personas.map(([id, nombre]) => (
        <li key={id} className="flex flex-col items-center text-center">
          <Sprite src={`/assets/${carpeta}/${id}/${id}-reposo.svg`} alt="" decorative className="h-28 w-auto sm:h-36" />
          <span className="mt-1 text-xs text-muted sm:text-sm">{nombre}</span>
        </li>
      ))}
    </ul>
  );
}

export default function FamiliasYDocentesPage() {
  return (
    <SiteShell>
      <FranjaPortada
        id="familias-docentes-t" antetitulo="Familias y docentes" titulo="Acompañar a quien aprende"
        acciones={<>
          <a href="#familias" className="btn btn-primary">Para las familias</a>
          <a href="#docentes" className="btn btn-secondary">Para docentes e instituciones</a>
        </>}
        ilustracion={<Sprite src="/assets/familia/abuela-amara/abuela-amara-saludar.svg" alt="La Abuela Amara, una de las Guardianas del Hogar, saluda" priority className="h-52 w-auto sm:h-64" />}
      >
        <p>Quien aprende no lo hace solo. En UNEX Academy las familias y los docentes ven el avance de sus estudiantes, celebran sus logros y saben cuándo darles una mano.</p>
      </FranjaPortada>

      <div className="mx-auto w-full max-w-5xl space-y-20 px-4 py-14 sm:px-6 sm:py-16">
        <section id="familias" aria-labelledby="familias-t" className="scroll-mt-6">
          <div className="grid items-end gap-6 md:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 id="familias-t">Para las familias</h2>
              <p className="mt-3 max-w-2xl text-lg text-muted">Con una cuenta de familia acompañas el avance de tus hijos sin entrar a su cuenta.</p>
            </div>
            <Elenco etiqueta="Los Guardianes del Hogar" carpeta="familia" personas={GUARDIANES_HOGAR} />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <section aria-labelledby="vincular-t" className="panel p-6 sm:p-8 lg:col-span-2">
              <h3 id="vincular-t">Cómo vincularte</h3>
              <ol className="mt-4 space-y-3">
                {VINCULAR.map((paso, i) => (
                  <li key={i} className="flex gap-3">
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-accion font-display text-sm font-bold text-sobre-accion">{i + 1}</span>
                    <p className="pt-0.5">{paso}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="ves-t" className="panel p-6 sm:p-8">
              <h3 id="ves-t">Lo que ves</h3>
              <ul className={LISTA}>
                <li>Su rango, su racha, sus portales y sus notas.</li>
                <li>Un aviso cuando lleva unos días sin entrar, con una idea para ayudarle a retomar.</li>
              </ul>
            </section>

            <section aria-labelledby="puedes-t" className="panel p-6 sm:p-8">
              <h3 id="puedes-t">Lo que puedes hacer</h3>
              <ul className={LISTA}>
                <li><strong className="font-semibold">Enviarle mensajes de apoyo</strong>, hasta 5 al día.</li>
                <li><strong className="font-semibold">Elegir a tu Guardián del Hogar</strong>, que te representa junto a tus mensajes.</li>
                <li><strong className="font-semibold">Disfrutar la Terraza del Hogar</strong>, que tus hijos decoran con los regalos que compran con las monedas que ganan.</li>
              </ul>
            </section>

            <figure className="panel overflow-hidden lg:col-span-2">
              <Sprite src="/assets/escenarios/terraza/terraza-atardecer.svg" alt="La Terraza del Hogar al atardecer" className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]" />
              <figcaption className="px-6 py-3 text-sm text-muted">La Terraza del Hogar: tus hijos la decoran con lo que compran en la tienda.</figcaption>
            </figure>

            <section aria-labelledby="privacidad-t" className="panel p-6 sm:p-8 lg:col-span-2">
              <h3 id="privacidad-t">Su privacidad, primero</h3>
              <p className="mt-3">Nunca verás su correo, su contraseña ni sus respuestas, y no puedes cambiar nada de su cuenta. Tu hijo o hija puede dejar de compartir su avance desde su perfil.</p>
              <p className="mt-3 text-muted">Una familia puede acompañar hasta 8 estudiantes, y cada estudiante puede tener hasta 4 familias vinculadas. Si tu hijo o hija es menor de edad, tú autorizas el uso de la plataforma; al crear su cuenta puede usar tu correo.</p>
            </section>
          </div>

          <Link href="/registro" className="btn btn-primary mt-8">Crear cuenta de familia</Link>
        </section>

        <section id="docentes" aria-labelledby="docentes-t" className="scroll-mt-6">
          <div className="grid items-end gap-6 md:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 id="docentes-t">Para docentes e instituciones</h2>
              <p className="mt-3 max-w-2xl text-lg text-muted">Las cuentas de Maestro del Gremio las crea UNEX Academy para cada docente, con los grupos y los estudiantes que acompaña.</p>
            </div>
            <Elenco etiqueta="Los Maestros del Gremio" carpeta="maestros" personas={MAESTROS} />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <section aria-labelledby="panel-docente-t" className="panel p-6 sm:p-8">
              <h3 id="panel-docente-t">El panel docente</h3>
              <ul className={LISTA}>
                {PANEL_DOCENTE.map((p) => <li key={p.t}><strong className="font-semibold">{p.t}</strong>: {p.d}</li>)}
              </ul>
            </section>

            <section aria-labelledby="instituciones-t" className="panel p-6 sm:p-8">
              <h3 id="instituciones-t">Para instituciones</h3>
              <ul className={LISTA}>
                {INSTITUCIONES.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-primary max-w-full whitespace-normal">Escribir a {SUPPORT_EMAIL}</a>
            <Link href="/servicios" className="btn btn-secondary max-w-full whitespace-normal">Conocer los servicios para instituciones</Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
