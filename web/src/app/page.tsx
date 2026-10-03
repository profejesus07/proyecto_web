import Link from "next/link";
import { Footer } from "@/components/footer";
import { PublicHeader } from "@/components/site-header";
import { Sprite, asset } from "@/components/sprite";
import { GUARDIANS } from "@/content/guardians";
import { RANKS } from "@/lib/game/ranks";

const STEPS = [
  { n: "1", title: "Elige a tu Despertado", text: "Crea tu cuenta y escoge tu avatar. Subir de rango le va dando equipo, capa y aura.", img: asset.avatar("aria", "c"), alt: "Aria, avatar con armadura de rango C" },
  { n: "2", title: "Cruza un portal", text: "Cada curso es un portal. Dentro encuentras misiones cortas para aprender un paso a la vez.", img: asset.scene("portales", "disponible"), alt: "La Sala de Portales con sus anillos de colores", wide: true },
  { n: "3", title: "Vence al Guardián", text: "Al final te espera un Guardián. No lo vences con fuerza, lo vences con lo que aprendiste.", img: asset.boss("petrox"), alt: "Petrox, el Guardián de piedra" },
];

const VALUES = [
  { icon: "🌱", title: "Equivocarse no castiga", text: "Si fallas, reagrupas y vuelves a intentar. Cada explicación te ayuda a entender, no a sentirte mal." },
  { icon: "🧭", title: "Siempre sabes dónde vas", text: "Tu rango, tu racha y tu siguiente misión están a la vista. El progreso se ve y se celebra." },
  { icon: "🛡️", title: "Un espacio tranquilo", text: "Sin anuncios, sin chat público y sin competencias humillantes. Solo tú, tu aventura y tu gremio." },
];

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main id="contenido">
        {/* ===== Hero ===== */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pt-16">
          <div className="rise space-y-6">
            <p className="eyebrow">Plataforma educativa · Umbral</p>
            <h1 className="text-5xl sm:text-6xl">
              Cruza portales.<br />
              <span className="bg-gradient-to-r from-cyan to-violet bg-clip-text text-transparent">Vence al Olvido.</span><br />
              Sube de rango.
            </h1>
            <p className="max-w-xl text-lg text-muted">
              Aprender se siente como una aventura: eliges tu avatar, completas misiones y enfrentas a Guardianes que representan los obstáculos de estudiar. Tú los vences paso a paso.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/registro" className="btn btn-primary btn-lg">Empezar mi aventura</Link>
              <Link href="/ingresar" className="btn btn-secondary btn-lg">Ya tengo cuenta</Link>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <li>✔ Gratis para empezar</li>
              <li>✔ Para niños, adolescentes y familias</li>
              <li>✔ Sin anuncios</li>
            </ul>
          </div>

          <div className="rise relative [animation-delay:120ms]">
            <div className="panel panel-glow relative aspect-[16/11] overflow-hidden rounded-3xl">
              <Sprite src={asset.scene("gremio", "dia")} alt="" decorative priority className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
              <Sprite src={asset.sora("saludar")} alt="Sora, la maestra del gremio, te da la bienvenida" priority className="absolute bottom-[-2%] right-[8%] h-[82%] w-auto" />
              <Sprite src={asset.avatar("aria", "c")} alt="Aria, un avatar de ejemplo" priority className="absolute bottom-[-3%] left-[24%] h-[78%] w-auto" />
              <Sprite src={asset.kuro("saludar")} alt="Kuro, el compañero lobo-dragón" priority className="absolute bottom-[-1%] left-[3%] h-[38%] w-auto" />
            </div>
          </div>
        </section>

        {/* ===== Cómo funciona ===== */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="como">
          <div className="max-w-2xl space-y-3">
            <p className="eyebrow">Cómo funciona</p>
            <h2 id="como" className="text-3xl sm:text-4xl">Tres pasos y ya estás dentro</h2>
          </div>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="panel flex flex-col overflow-hidden">
                <div className={`relative grid place-items-center overflow-hidden bg-gradient-to-b from-panel-2/80 to-panel/40 ${s.wide ? "h-56" : "h-56 pt-4"}`}>
                  <Sprite src={s.img} alt={s.alt} className={s.wide ? "size-full object-cover" : "h-full w-auto object-contain"} />
                </div>
                <div className="space-y-2 p-5">
                  <p className="flex items-center gap-3 font-display text-xl font-bold">
                    <span className="grid size-8 place-items-center rounded-full bg-gold font-extrabold text-ink">{s.n}</span>
                    {s.title}
                  </p>
                  <p className="text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ===== Guardianes ===== */}
        <section id="guardianes" className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="guardianes-t">
          <div className="max-w-2xl space-y-3">
            <p className="eyebrow">Los Guardianes</p>
            <h2 id="guardianes-t" className="text-3xl sm:text-4xl">Cada Guardián es un obstáculo de estudiar</h2>
            <p className="text-muted">No guardan una materia: guardan una dificultad que todos conocemos. Por eso sirven para cualquier curso, y por eso se vencen aprendiendo una habilidad.</p>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {GUARDIANS.map((g) => {
              const rank = RANKS.find((r) => r.key === g.rank)!;
              return (
                <li key={g.slug} className="panel group flex flex-col overflow-hidden transition-transform hover:-translate-y-1">
                  <div className="relative h-48 bg-gradient-to-b from-bg-2 to-panel/50">
                    <Sprite src={asset.boss(g.slug)} alt={`${g.name}, ${g.family} de ${g.element.toLowerCase()}`} className="mx-auto h-full w-auto object-contain p-2 transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute right-3 top-3 rounded-lg px-2 py-0.5 text-xs font-extrabold" style={{ background: rank.color, color: "#14123b" }} title={`Rango ${g.rank}`}>Rango {g.rank}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="text-xl">{g.name}</h3>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan">{g.family} · {g.element}</p>
                    <p className="font-semibold">{g.obstacle}</p>
                    <p className="text-sm text-muted">{g.blurb}</p>
                    <p className="mt-auto pt-2 text-sm"><span className="text-muted">Se vence con: </span><strong>{g.weakness}</strong></p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ===== Valores ===== */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="valores">
          <div className="max-w-2xl space-y-3">
            <p className="eyebrow">Aprender sin presión</p>
            <h2 id="valores" className="text-3xl sm:text-4xl">Pensado para que dé gusto volver</h2>
          </div>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {VALUES.map((v) => (
              <li key={v.title} className="panel space-y-3 p-6">
                <span className="grid size-12 place-items-center rounded-2xl bg-cyan/10 text-2xl" aria-hidden="true">{v.icon}</span>
                <h3 className="text-xl">{v.title}</h3>
                <p className="text-muted">{v.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ===== Docentes y familias ===== */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="adultos">
          <div className="panel grid items-center gap-8 overflow-hidden p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <p className="eyebrow">Docentes y familias</p>
              <h2 id="adultos" className="text-3xl sm:text-4xl">Tranquilidad para quien acompaña</h2>
              <ul className="space-y-3 text-muted">
                <li className="flex gap-3"><span aria-hidden="true">✔</span><span>Contenido creado y revisado por docentes, con retroalimentación clara después de cada misión.</span></li>
                <li className="flex gap-3"><span aria-hidden="true">✔</span><span>Datos mínimos: solo un correo y un nombre de aventurero. Nada de ubicación, fotos ni mensajes públicos.</span></li>
                <li className="flex gap-3"><span aria-hidden="true">✔</span><span>Cada perfil es privado: nadie más ve tu avance. Puedes leer cómo cuidamos tus datos en la <Link className="text-cyan underline underline-offset-4" href="/privacidad">página de privacidad</Link>.</span></li>
                <li className="flex gap-3"><span aria-hidden="true">⏳</span><span><strong className="text-text">Próximamente:</strong> paneles para que docentes y familias vean el avance y envíen mensajes de ánimo.</span></li>
              </ul>
            </div>
            <div className="relative mx-auto h-72 w-full max-w-sm">
              <Sprite src={asset.scene("terraza", "atardecer")} alt="La Terraza del Hogar al atardecer" className="size-full rounded-2xl object-cover" />
            </div>
          </div>
        </section>

        {/* ===== Rangos + CTA ===== */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="rangos">
          <h2 id="rangos" className="sr-only">Rangos</h2>
          <ol className="flex flex-wrap items-center justify-center gap-3" aria-label="Los seis rangos, de E a S">
            {RANKS.map((r, i) => (
              <li key={r.key} className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-xl font-display text-xl font-extrabold" style={{ background: r.color, color: "#14123b" }}>{r.key}</span>
                <span className="hidden text-sm text-muted sm:inline">{r.name}</span>
                {i < RANKS.length - 1 && <span aria-hidden="true" className="text-line">→</span>}
              </li>
            ))}
          </ol>
          <div className="mx-auto mt-12 max-w-2xl space-y-5 text-center">
            <h2 className="text-4xl sm:text-5xl">El primer portal ya está abierto</h2>
            <p className="text-lg text-muted">Empieza con «El Portal de los Pasos Pequeños» y enfrenta a Petrox, el gólem que cree que todo es demasiado grande.</p>
            <Link href="/registro" className="btn btn-primary btn-lg">Crear mi cuenta</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
