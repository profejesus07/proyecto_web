import type { Metadata } from "next";
import Link from "next/link";
import { FranjaPortada } from "@/components/FranjaPortada";
import { PreguntasFrecuentes } from "@/components/PreguntasFrecuentes";
import { SiteShell } from "@/components/site-header";
import { Sprite, asset } from "@/components/sprite";
import { VIEWPORT_PUBLICO } from "@/config/viewport-publico";
import { GUARDIANS } from "@/content/guardians";

export const viewport = VIEWPORT_PUBLICO;

export const metadata: Metadata = {
  title: "Cómo se juega",
  description: "Cómo se aprende en UNEX Academy: portales con lecciones breves, misiones, Guardianes, rangos, recompensas y constancias verificables.",
  alternates: { canonical: "/como-se-juega" },
};

// Los datos (70 %, rangos, poderes, racha, recompensas) salen de lib/game y de la base de datos; si cambian allá,
// se actualizan aquí. El reparto de personajes está en CLAUDE.md («Reparto de personajes en páginas públicas»).

/** Fila de ilustraciones con su nombre debajo. Ninguna es la primera de la página: todas cargan en diferido. */
function Galeria({ items, tamano = "size-20", etiqueta }: { items: { src: string; nombre: string }[]; tamano?: string; etiqueta: string }) {
  return (
    <ul aria-label={etiqueta} className="mt-4 flex flex-wrap gap-x-4 gap-y-3">
      {items.map((i) => (
        <li key={i.src} className="flex w-20 flex-col items-center text-center">
          <Sprite src={i.src} alt="" decorative className={`${tamano} object-contain`} />
          <span className="mt-1 text-xs text-muted">{i.nombre}</span>
        </li>
      ))}
    </ul>
  );
}

const AVATARES = [["aria", "Aria"], ["leo", "Leo"], ["tomas", "Tomás"], ["nuri", "Nuri"]].map(([id, nombre]) => ({ src: asset.avatarAnim(id, "rango-e-reposo"), nombre }));
const ENEMIGOS = [["slime-confuso", "Slime Confuso"], ["duende-enredador", "Duende Enredador"], ["sombrita", "Sombrita"], ["cofre-mimico", "Cofre Mímico"]].map(([id, nombre]) => ({ src: asset.enemy(id), nombre }));
const RANGOS_ARIA = ["E", "D", "C", "B", "A", "S"].map((r) => ({ src: asset.avatarAnim("aria", `rango-${r.toLowerCase()}-reposo`), nombre: `Rango ${r}` }));
const OBJETOS = [
  ["cosmetico/obj_cosmetico_capa_estrellas", "Capa de estrellas"],
  ["cosmetico/obj_cosmetico_alas_cian", "Alas de luz cian"],
  ["cosmetico/obj_cosmetico_sombrero_mago", "Sombrero de mago"],
  ["marco/obj_marco_raro", "Marco de cristal"],
  ["poder/obj_poder_rayo", "Rayo de Claridad"],
].map(([archivo, nombre]) => ({ src: `/assets/objetos/${archivo}.svg`, nombre }));
const PIELES_KURO = [["cian", "Kuro cian"], ["dorado", "Kuro dorado"], ["coral", "Kuro coral"], ["bosque", "Kuro verde bosque"]]
  .map(([id, nombre]) => ({ src: `/assets/objetos/companero/obj_companero_kuro_${id}-cachorro.svg`, nombre }));

const PASOS: { t: string; d: string; arte?: React.ReactNode }[] = [
  { t: "Crea tu cuenta y elige tu avatar", d: "Crear la cuenta es gratis. Eliges a Aria, Leo, Tomás o Nuri, le pones tu nombre de aventurero y entras al Gremio, tu casa en el juego.", arte: <Galeria etiqueta="Los cuatro avatares" items={AVATARES} tamano="h-24 w-20" /> },
  { t: "Cruza un portal", d: "Cada curso es un portal con lecciones breves que se abren en orden. Algunas empiezan con una explicación y todas terminan en una misión. La primera lección de cada curso es gratis." },
  { t: "Supera las misiones", d: "Las misiones mezclan cinco tipos de pregunta: selección múltiple, verdadero o falso, completar, ordenar y relacionar. Superas la misión con 70 % o más. Si no lo logras, la repites las veces que quieras: siempre queda tu mejor nota.", arte: <Galeria etiqueta="Las criaturas de las misiones" items={ENEMIGOS} /> },
  { t: "Enfrenta al Guardián", d: "Al final de cada portal (o de cada módulo, en los cursos más largos) te espera un Guardián. Cada uno representa un obstáculo para aprender, y se vence con la habilidad contraria." },
  { t: "Gana tu diploma y tu constancia", d: "Al vencer al Guardián recibes el diploma del juego, el «Sello del Portal». En los cursos cortos, cuando completas todas las lecciones, incluida la prueba final, puedes pedir tu constancia de asistencia. Cualquiera puede verificarla en línea con su código." },
];

const TEXTO_GUARDIAN: Record<string, { nombre: string; texto: string }> = {
  petrox: { nombre: "Petrox, el Gólem de piedra", texto: "Su obstáculo: «Es demasiado grande». Se vence dividiendo el reto en pasos pequeños." },
  ignaris: { nombre: "Ignaris, el dragón joven", texto: "Su obstáculo: el miedo a empezar y a equivocarse. Se vence probando, errando y volviendo a intentar." },
};
// Los demás, con su nombre y su obstáculo tal como están en el juego (content/guardians.ts).
const GUARDIANES = GUARDIANS.map((g) => ({ slug: g.slug, ...(TEXTO_GUARDIAN[g.slug] ?? { nombre: g.name, texto: `Su obstáculo: ${g.obstacle}.` }) }));

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
        ilustracion={<Sprite src={asset.eon("saludar")} alt="El Archivista Eon te saluda" priority className="h-52 w-auto sm:h-64" />}
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
                  {p.arte}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="guardianes-t">
          <h2 id="guardianes-t">Los Guardianes</h2>
          <p className="mt-3 max-w-2xl text-muted">Cada Guardián es un obstáculo que todos conocemos. Vencerlo es aprender a superarlo.</p>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {GUARDIANES.map((g) => (
              <li key={g.slug} className="panel flex flex-col items-center p-4 text-center sm:p-5">
                <Sprite src={asset.boss(g.slug)} alt="" decorative className="size-20 object-contain sm:size-28" />
                <h3 className="mt-3 text-base sm:text-lg">{g.nombre}</h3>
                <p className="mt-1 text-sm text-muted">{g.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="recompensas-t">
          <h2 id="recompensas-t">Lo que ganas al jugar</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RECOMPENSAS.map((r) => (
              <li key={r.t} className={`panel p-5 sm:p-6 ${r.t === "XP y rangos" ? "sm:col-span-2 lg:col-span-3" : ""}`}>
                <h3>{r.t}</h3>
                <p className="mt-1 text-muted">{r.d}</p>
                {r.t === "XP y rangos" && <Galeria etiqueta="Aria en cada rango, de E a S" items={RANGOS_ARIA} tamano="h-24 w-20" />}
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="tienda-t">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <h2 id="tienda-t">La Tienda y Arsenal</h2>
                <p className="mt-3 text-muted">Con tus monedas visitas a la Forjadora Brann:</p>
              </div>
              <Sprite src={asset.brann("mostrar")} alt="La Forjadora Brann muestra un objeto de su tienda" className="h-32 w-auto shrink-0 sm:h-40" />
            </div>
            <ul className="mt-5 list-disc space-y-2 pl-5 marker:text-accion">
              {TIENDA.map((t) => <li key={t.t}><strong className="font-semibold">{t.t}</strong>: {t.d}</li>)}
            </ul>
            <Galeria etiqueta="Algunos objetos de la tienda" items={OBJETOS} tamano="size-16" />
            <h3 className="mt-6 text-base">Compañeros: las pieles de Kuro</h3>
            <Galeria etiqueta="Pieles de Kuro" items={PIELES_KURO} tamano="size-16" />
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

        <PreguntasFrecuentes ids={["equivocarse", "costo", "edades"]} />

        <section aria-labelledby="cierre-t" className="panel p-8 text-center sm:p-12">
          <h2 id="cierre-t">¿Todo listo para cruzar tu primer portal?</h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">{ACCIONES}</div>
        </section>
      </div>
    </SiteShell>
  );
}
