import type { Metadata } from "next";
import Link from "next/link";
import { FranjaPortada } from "@/components/FranjaPortada";
import { SiteShell } from "@/components/site-header";
import { Sprite, asset } from "@/components/sprite";
import { VIEWPORT_PUBLICO } from "@/config/viewport-publico";

export const viewport = VIEWPORT_PUBLICO;

export const metadata: Metadata = {
  title: "Cómo se juega",
  description: "Cómo se aprende en UNEX Academy: portales con lecciones breves, misiones, Guardianes, rangos, recompensas y constancias verificables.",
  alternates: { canonical: "/como-se-juega" },
};

// Los datos (70 %, rangos, poderes, racha, recompensas) salen de lib/game y de la base de datos; si cambian allá,
// se actualizan aquí.
const PASOS = [
  { t: "Crea tu cuenta y elige tu avatar", d: "Crear la cuenta es gratis. Eliges a Aria, Leo, Tomás o Nuri, le pones tu nombre de aventurero y entras al Gremio, tu casa en el juego." },
  { t: "Cruza un portal", d: "Cada curso es un portal con lecciones breves que se abren en orden. Algunas empiezan con una explicación y todas terminan en una misión. La primera lección de cada curso es gratis." },
  { t: "Supera las misiones", d: "Las misiones mezclan cinco tipos de pregunta: selección múltiple, verdadero o falso, completar, ordenar y relacionar. Superas la misión con 70 % o más. Si no lo logras, la repites las veces que quieras: siempre queda tu mejor nota." },
  { t: "Enfrenta al Guardián", d: "Al final de cada portal (o de cada módulo, en los cursos más largos) te espera un Guardián. Cada uno representa un obstáculo para aprender, y se vence con la habilidad contraria." },
  { t: "Gana tu diploma y tu constancia", d: "Al vencer al Guardián recibes el diploma del juego, el «Sello del Portal». En los cursos cortos, cuando completas todas las lecciones, incluida la prueba final, puedes pedir tu constancia de asistencia. Cualquiera puede verificarla en línea con su código." },
];

const GUARDIANES = [
  { slug: "petrox", nombre: "Petrox, el Gólem de piedra", obstaculo: "«Es demasiado grande»", vence: "Se vence dividiendo el reto en pasos pequeños." },
  { slug: "ignaris", nombre: "Ignaris, el dragón joven", obstaculo: "el miedo a empezar y a equivocarse", vence: "Se vence probando, errando y volviendo a intentar." },
];

const RECOMPENSAS = [
  { t: "XP y rangos", d: "La primera vez que superas una misión ganas experiencia (XP). Con ella subes de rango: Aprendiz (E), Explorador (D), Cazador (C), Maestro de portales (B), Élite (A) y Leyenda (S)." },
  { t: "Monedas", d: "Cada misión superada por primera vez te da monedas: más si la haces perfecta y muchas más si vences a un Guardián." },
  { t: "Racha", d: "Cada día seguido que aprendes suma un día de racha. A los 3, 7 y 30 días ganas una insignia." },
  { t: "Las Crónicas", d: "La historia del mundo, narrada por el Archivista Eon. Cada capítulo se abre al avanzar en los portales y al vencer a sus Guardianes." },
];

const TIENDA = [
  { t: "Accesorios para tu avatar", d: "capas, alas, auras, bufandas, gafas y sombreros. Te los pones en el Vestidor." },
  { t: "Marcos para tu retrato", d: "se ven en el Gremio y en tu perfil." },
  { t: "Compañeros", d: "que te acompañan en el Gremio. Las pieles de Kuro crecen contigo al subir de rango." },
  { t: "Regalos para la Terraza del Hogar", d: "de tu familia." },
  { t: "Poderes", d: "para las preguntas difíciles." },
];

const PODERES = [
  { t: "Rayo de Claridad", d: "resalta las palabras de la pregunta donde está la pista." },
  { t: "Escudo de Calma", d: "si fallas, puedes intentarlo otra vez." },
  { t: "Aura de Concentración", d: "la pregunta pasa al final de la misión, para que tengas más tiempo." },
  { t: "Lluvia de Estrellas", d: "si aciertas, ganas XP extra." },
  { t: "Invocación de Kuro", d: "Kuro te dice la pista en voz alta y descarta una opción incorrecta." },
  { t: "Pulso de Memoria", d: "vuelve a mostrar las pistas que ya habías visto." },
];

const PREGUNTAS = [
  { q: "¿Qué pasa si me equivoco?", a: "Equivocarse es parte del juego. Repites la lección las veces que quieras y queda tu mejor nota." },
  { q: "¿Cuánto cuesta?", a: "Crear la cuenta es gratis, y también la primera lección de cada curso. En cada curso verás si es gratis o cuánto cuesta." },
  { q: "¿Para qué edades es?", a: "Para niñas, niños, adolescentes y adultos. Si eres menor de edad, tu acudiente debe autorizar el uso de la plataforma, y puede acompañarte desde una cuenta de familia." },
];

const ACCIONES = (
  <>
    <Link href="/registro" className="btn btn-primary">Crear cuenta gratis</Link>
    <Link href="/programas" className="btn btn-secondary">Ver cursos</Link>
  </>
);

export default function ComoSeJuegaPage() {
  return (
    <SiteShell>
      <FranjaPortada
        id="como-se-juega-t" antetitulo="Cómo se juega" titulo="Aprender es una aventura" acciones={ACCIONES}
        ilustracion={<Sprite src={asset.kuro("saludar")} alt="Kuro te saluda" className="h-52 w-auto sm:h-64" />}
      >
        <p>En UNEX Academy cada curso es un portal del Gremio. Lo cruzas lección a lección, superas misiones, enfrentas a su Guardián y ganas recompensas por lo que aprendes.</p>
        <p>No necesitas instalar nada: funciona en el navegador del celular, la tableta o el computador, y tu avance se guarda en tu cuenta.</p>
      </FranjaPortada>

      <div className="mx-auto w-full max-w-5xl space-y-20 px-4 py-14 sm:px-6 sm:py-16">
        <section aria-labelledby="pasos-t">
          <h2 id="pasos-t">Tu aventura, paso a paso</h2>
          <ol className="mt-8 space-y-4">
            {PASOS.map((p, i) => (
              <li key={p.t} className="panel flex gap-4 p-5 sm:p-6">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-accion font-display font-bold text-sobre-accion">{i + 1}</span>
                <div>
                  <h3>{p.t}</h3>
                  <p className="mt-1 text-muted">{p.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="guardianes-t">
          <h2 id="guardianes-t">Los Guardianes</h2>
          <p className="mt-3 max-w-2xl text-muted">Cada Guardián es un obstáculo que todos conocemos. Vencerlo es aprender a superarlo.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {GUARDIANES.map((g) => (
              <li key={g.slug} className="panel flex items-center gap-5 p-5 sm:p-6">
                <Sprite src={asset.boss(g.slug)} alt="" decorative className="size-28 shrink-0 object-contain" />
                <div>
                  <h3>{g.nombre}</h3>
                  <p className="mt-1 text-muted">Su obstáculo: {g.obstaculo}. {g.vence}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="recompensas-t">
          <h2 id="recompensas-t">Lo que ganas al jugar</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {RECOMPENSAS.map((r) => (
              <li key={r.t} className="panel p-5 sm:p-6">
                <h3>{r.t}</h3>
                <p className="mt-1 text-muted">{r.d}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="tienda-t">
            <h2 id="tienda-t">La Tienda y Arsenal</h2>
            <p className="mt-3 text-muted">Con tus monedas visitas a la Forjadora Brann:</p>
            <ul className="mt-5 list-disc space-y-2 pl-5 marker:text-accion">
              {TIENDA.map((t) => <li key={t.t}><strong className="font-semibold">{t.t}</strong>: {t.d}</li>)}
            </ul>
          </section>

          <section aria-labelledby="poderes-t">
            <h2 id="poderes-t">Poderes para las preguntas difíciles</h2>
            <p className="mt-3 text-muted">Cada poder se usa en una pregunta y tiene su efecto. Algunos se desbloquean al subir de rango y todos tienen un límite de usos al día.</p>
            <ul className="mt-5 list-disc space-y-2 pl-5 marker:text-accion">
              {PODERES.map((p) => <li key={p.t}><strong className="font-semibold">{p.t}</strong>: {p.d}</li>)}
              <li><strong className="font-semibold">Sombra Dorada</strong> y <strong className="font-semibold">Segundo Aliento</strong>: se ganan al llegar a Leyenda (S).</li>
            </ul>
          </section>
        </div>

        <section aria-labelledby="preguntas-t" className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <h2 id="preguntas-t">Preguntas frecuentes</h2>
          <div className="divide-y divide-line border-y border-line">
            {PREGUNTAS.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-cyan/10 text-cyan transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="cierre-t" className="panel p-8 text-center sm:p-12">
          <h2 id="cierre-t">¿Todo listo para cruzar tu primer portal?</h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">{ACCIONES}</div>
        </section>
      </div>
    </SiteShell>
  );
}
