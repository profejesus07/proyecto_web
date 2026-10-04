import Link from "next/link";
import { Footer } from "@/components/footer";
import { Icon, type IconName } from "@/components/icons";
import { ProgramCard } from "@/components/program-card";
import { PublicHeader } from "@/components/site-header";
import { Sprite, asset } from "@/components/sprite";
import { GUARDIANES_HOGAR, MAESTROS, guideSrc } from "@/content/elenco";
import { loadCatalog } from "@/lib/data/queries";

// El catálogo se vuelve a leer cada 10 minutos.
export const revalidate = 600;

const HIGHLIGHTS: { icon: IconName; title: string; text: string }[] = [
  { icon: "lesson", title: "Lecciones cortas", text: "Un paso a la vez, a tu ritmo." },
  { icon: "feedback", title: "Retroalimentación al instante", text: "Cada respuesta se explica." },
  { icon: "people", title: "Acompañamiento", text: "Docentes y familias ven el avance." },
  { icon: "seal", title: "Constancias verificables", text: "Comprobables en línea." },
];

const METHOD: { n: string; title: string; text: string }[] = [
  { n: "01", title: "Aprende", text: "Cada programa se divide en lecciones breves con pistas y explicaciones claras." },
  { n: "02", title: "Practica", text: "Misiones con retroalimentación inmediata. Equivocarse no castiga: se reintenta y se aprende." },
  { n: "03", title: "Demuestra", text: "Al final, un Guardián pone a prueba lo aprendido. Superarlo te da tu diploma y, en los cursos cortos, tu constancia." },
];

const AUDIENCES = [
  {
    id: "estudiantes", title: "Estudiantes", img: asset.avatar("aria", "c"), alt: "Aria, una estudiante de la academia",
    text: "Avanza con un avatar que sube de rango contigo, sin anuncios ni competencias que presionen.",
    points: ["Primera lección de cada programa gratis", "Progreso, racha y logros a la vista"],
    cta: { href: "/registro", label: "Crear mi cuenta" },
  },
  {
    id: "docentes", title: "Docentes y colegios", img: guideSrc(MAESTROS[0], "saludar"), alt: "La Maestra Ilia",
    text: "Crea clases con un código y sigue el avance de cada estudiante y de todo el grupo.",
    points: ["Informe por estudiante y por pregunta", "Clases por periodos con acceso anual"],
    cta: { href: `mailto:profejesus365@gmail.com?subject=${encodeURIComponent("Quiero usar Umbral con mi clase")}`, label: "Escribir a la academia" },
  },
  {
    id: "familias", title: "Familias", img: guideSrc(GUARDIANES_HOGAR[0], "saludar"), alt: "Mamá Lucía, una Guardiana del Hogar",
    text: "Acompaña a tus hijos desde tu propia cuenta: ves su avance, nunca sus respuestas ni su contraseña.",
    points: ["Vinculación con el código del estudiante", "Mensajes de apoyo y pago de cursos"],
    cta: { href: "/registro", label: "Crear cuenta de familia" },
  },
];

const FAQ = [
  { q: "¿Cuánto cuesta?", a: "Crear la cuenta es gratis y la primera lección de cada programa también. Para continuar, cada programa tiene su precio en pesos colombianos y se paga en línea con Wompi o Mercado Pago (PSE, Nequi, tarjeta y más)." },
  { q: "¿Para qué edades es?", a: "Para niñas, niños, adolescentes y adultos. Si eres menor de edad, tu acudiente debe autorizar el uso de la plataforma; puede acompañarte desde una cuenta de familia." },
  { q: "¿Necesito instalar algo?", a: "No. Funciona en el navegador del celular, la tableta o el computador. Tu avance se guarda en tu cuenta." },
  { q: "¿Qué valor tienen las constancias?", a: "Los cursos cortos son educación informal (Ley 115 de 1994 y Decreto 1075 de 2015). Al terminarlos se expide una constancia de asistencia que cualquiera puede verificar en línea con su código. No conduce a título." },
  { q: "¿Cómo cuidan los datos?", a: "Pedimos lo mínimo: un correo y un nombre de aventurero. No hay chat público ni anuncios. Los docentes y las familias solo ven el avance si el estudiante comparte su código." },
];

export default async function Home() {
  const catalog = await loadCatalog();
  const featured = catalog.slice(0, 3);

  return (
    <>
      <PublicHeader />
      <main id="contenido">
        {/* ===== Portada ===== */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div className="rise space-y-7">
            <p className="eyebrow">Academia digital</p>
            <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl">
              Aprender bien,<br />
              <span className="bg-gradient-to-r from-cyan to-violet bg-clip-text text-transparent">un portal a la vez.</span>
            </h1>
            <p className="max-w-lg text-lg text-muted">
              Cursos cortos y clases en línea con lecciones breves, práctica guiada y una aventura que da ganas de volver cada día.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/registro" className="btn btn-primary btn-lg">Empieza gratis</Link>
              <Link href="/programas" className="btn btn-secondary btn-lg">Ver programas</Link>
            </div>
            <p className="text-sm text-muted">Primera lección gratis · Sin anuncios · En cualquier dispositivo</p>
          </div>

          <div className="rise relative [animation-delay:120ms]">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-line/70 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8)]">
              <Sprite src={asset.scene("gremio", "dia")} alt="" decorative priority className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/10 to-transparent" />
              <Sprite src={asset.sora("saludar")} alt="Sora, la maestra del gremio, da la bienvenida" priority className="absolute bottom-[-2%] right-[6%] h-[80%] w-auto" />
              <Sprite src={asset.avatar("aria", "c")} alt="Aria, una estudiante" priority className="absolute bottom-[-3%] left-[14%] h-[74%] w-auto" />
            </div>
            {/* Así se ve el avance dentro de la academia. */}
            <div aria-hidden="true" className="absolute -bottom-6 left-4 w-60 rounded-2xl border border-line bg-bg-2/95 p-4 shadow-2xl backdrop-blur sm:-left-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Tu avance</p>
              <p className="mt-1 font-display text-lg font-bold">Lección 3 de 4</p>
              <div className="bar mt-2"><i style={{ width: "75%" }} /></div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[#b6f5cb]"><Icon name="check" className="size-4" /> 92% en la última misión</p>
            </div>
          </div>
        </section>

        {/* ===== Lo esencial ===== */}
        <section aria-label="Lo que ofrece la academia" className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-line/70 bg-line/50 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3 bg-bg-2 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan/10 text-cyan"><Icon name={h.icon} /></span>
                <div>
                  <p className="font-semibold">{h.title}</p>
                  <p className="text-sm text-muted">{h.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ===== Programas ===== */}
        <section id="programas" aria-labelledby="programas-t" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-24 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl space-y-3">
              <p className="eyebrow">Programas</p>
              <h2 id="programas-t" className="text-3xl sm:text-4xl">Elige por dónde empezar</h2>
              <p className="text-muted">Cada programa termina con un Guardián que representa un obstáculo real de estudiar.</p>
            </div>
            {catalog.length > 0 && (
              <Link href="/programas" className="inline-flex items-center gap-1.5 font-semibold text-cyan hover:underline hover:underline-offset-4">
                Ver todos los programas <Icon name="arrow" className="size-4" />
              </Link>
            )}
          </div>
          {featured.length ? (
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((c) => <ProgramCard key={c.slug} c={c} />)}
            </ul>
          ) : (
            <p className="mt-10 rounded-2xl border border-line/70 bg-panel/40 p-8 text-center text-muted">Muy pronto publicaremos los primeros programas.</p>
          )}
        </section>

        {/* ===== Metodología ===== */}
        <section id="metodologia" aria-labelledby="metodo-t" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-24 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div className="space-y-4">
              <p className="eyebrow">Metodología</p>
              <h2 id="metodo-t" className="text-3xl sm:text-4xl">Aprender, practicar y demostrar</h2>
              <p className="text-muted">Un ciclo sencillo y probado: explicación breve, práctica con retroalimentación y un reto final. Los elementos de juego están al servicio del aprendizaje, no al revés.</p>
              <div className="relative mt-6 hidden h-56 overflow-hidden rounded-2xl border border-line/70 lg:block">
                <Sprite src={asset.scene("arena", "calma")} alt="" decorative className="absolute inset-0 size-full object-cover" />
                <Sprite src={asset.boss("petrox")} alt="Petrox, el Guardián del primer programa" className="absolute bottom-0 left-1/2 h-[90%] w-auto -translate-x-1/2" />
              </div>
            </div>
            <ol className="relative space-y-4 before:absolute before:bottom-8 before:left-[1.65rem] before:top-8 before:w-px before:bg-line">
              {METHOD.map((m) => (
                <li key={m.n} className="relative flex gap-5 rounded-2xl border border-line/70 bg-panel/50 p-5">
                  <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-xl border border-line bg-bg-2 font-display text-lg font-bold text-gold">{m.n}</span>
                  <div className="space-y-1">
                    <h3 className="text-xl">{m.title}</h3>
                    <p className="text-muted">{m.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ===== Comunidad ===== */}
        <section id="comunidad" aria-labelledby="comunidad-t" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-24 sm:px-6">
          <div className="max-w-xl space-y-3">
            <p className="eyebrow">Para quién</p>
            <h2 id="comunidad-t" className="text-3xl sm:text-4xl">Una academia para quien aprende y para quien acompaña</h2>
          </div>
          <ul className="mt-10 grid gap-5 lg:grid-cols-3">
            {AUDIENCES.map((a) => (
              <li key={a.id} id={a.id} className="flex flex-col overflow-hidden rounded-2xl border border-line/70 bg-panel/50">
                <div className="relative h-44 bg-gradient-to-b from-panel-2/70 to-transparent">
                  <Sprite src={a.img} alt={a.alt} className="absolute bottom-0 left-1/2 h-[95%] w-auto -translate-x-1/2" />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <h3 className="text-2xl">{a.title}</h3>
                  <p className="text-muted">{a.text}</p>
                  <ul className="space-y-1.5 text-sm">
                    {a.points.map((p) => <li key={p} className="flex gap-2"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-cyan" />{p}</li>)}
                  </ul>
                  <Link href={a.cta.href} className="mt-auto inline-flex items-center gap-1.5 pt-3 font-semibold text-cyan hover:underline hover:underline-offset-4">
                    {a.cta.label} <Icon name="arrow" className="size-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ===== Constancias ===== */}
        <section aria-labelledby="constancias-t" className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
          <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] border border-line/70 bg-gradient-to-br from-panel-2/70 via-panel/50 to-bg-2 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <p className="eyebrow">Constancias</p>
              <h2 id="constancias-t" className="text-3xl sm:text-4xl">Lo que aprendes queda certificado</h2>
              <p className="text-muted">Al completar un curso corto recibes una constancia de asistencia con su intensidad horaria. Cada una tiene un código único que cualquiera puede verificar en línea.</p>
              <Link href="/verificar" className="btn btn-secondary">Verificar una constancia</Link>
            </div>
            <div aria-hidden="true" className="mx-auto w-full max-w-sm rotate-[-2deg] rounded-2xl border border-gold/40 bg-[#f7f3e8] p-6 text-ink shadow-2xl">
              <p className="text-center text-[0.65rem] font-bold uppercase tracking-[0.25em] text-[#7a6a3a]">Constancia de asistencia</p>
              <p className="mt-3 text-center font-display text-xl font-bold">Nombre del curso corto</p>
              <p className="mt-1 text-center text-xs text-[#5a5470]">Ejemplo · Intensidad horaria y fechas</p>
              <div className="mt-5 flex items-end justify-between border-t border-[#d9cfae] pt-3 text-[0.65rem] text-[#5a5470]">
                <span>Código: UMB-7K3Q</span>
                <Icon name="seal" className="size-8 text-[#b8902a]" />
              </div>
            </div>
          </div>
        </section>

        {/* ===== Preguntas ===== */}
        <section id="preguntas" aria-labelledby="preguntas-t" className="mx-auto max-w-3xl scroll-mt-20 px-4 pt-24 sm:px-6">
          <div className="space-y-3 text-center">
            <p className="eyebrow">Preguntas frecuentes</p>
            <h2 id="preguntas-t" className="text-3xl sm:text-4xl">Lo que suelen preguntarnos</h2>
          </div>
          <div className="mt-10 divide-y divide-line/70 rounded-2xl border border-line/70 bg-panel/40">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ===== Cierre ===== */}
        <section aria-labelledby="cierre-t" className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
          <div className="relative isolate overflow-hidden rounded-[2rem] border border-line/70 px-6 py-14 text-center sm:px-12">
            <Sprite src={asset.scene("portales", "disponible")} alt="" decorative className="absolute inset-0 -z-10 size-full object-cover opacity-40" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg/60 to-bg/90" />
            <h2 id="cierre-t" className="mx-auto max-w-2xl text-3xl sm:text-5xl">Tu primera lección ya está abierta</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted">Crea tu cuenta en un minuto y empieza hoy, sin costo.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/registro" className="btn btn-primary btn-lg">Empieza gratis</Link>
              <Link href="/ingresar" className="btn btn-ghost btn-lg">Ya tengo cuenta</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
