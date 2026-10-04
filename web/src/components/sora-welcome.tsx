"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { markIntroSeenAction } from "@/app/actions/game";
import { Sprite, asset } from "@/components/sprite";

interface Step {
  anim: string;
  title: string;
  text: string;
  extra?: { src: string; alt: string };
}

/** Bienvenida de la Maestra Sora: aparece una sola vez, la primera vez que se entra al Gremio. */
export function SoraWelcome({ name, firstPortal, teacher = false }: { name: string; firstPortal: string | null; teacher?: boolean }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const [, start] = useTransition();

  const steps: Step[] = [
    { anim: "saludar", title: `¡Bienvenido al Gremio, ${name}!`, text: "Soy la Maestra Sora. Desde hoy eres un Despertado: alguien que puede cruzar los Portales del Saber." },
    { anim: "hablar", title: "Cada portal es un curso", text: "Hace mucho, el Saber del mundo se rompió en pedazos y cada pedazo quedó dentro de un Portal. Allí te esperan misiones cortas: respóndelas para avanzar." },
    {
      anim: "senalar", title: "Kuro va contigo",
      text: "Este pequeño es Kuro. Celebra tus aciertos y, si te equivocas, te explica por qué. Aquí equivocarse no es perder: es parte de aprender.",
      extra: { src: asset.kuro("saludar"), alt: "Kuro te saluda moviendo la cola" },
    },
    { anim: "abrir-portal", title: "Al final, un Guardián", text: "Cada portal lo custodia un Guardián atrapado por la niebla. No se vence con fuerza: se purifica con lo que aprendiste. Así ganas XP, monedas, objetos y subes de rango." },
    teacher
      ? { anim: "celebrar", title: "Tu panel de Maestro del Gremio", text: "En «Mi clase» creas grupos con un código. Tus estudiantes se unen desde su perfil y tú ves su avance y las preguntas que más les cuestan. También puedes jugar los portales para conocerlos." }
      : { anim: "celebrar", title: "¿Listo para empezar?", text: "El Archivista Eon guarda toda esta historia en las Crónicas, y se irá abriendo a medida que avances. Tu primer portal te espera." },
  ];
  const s = steps[step];
  const last = step === steps.length - 1;

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  function close(to?: string) {
    ref.current?.close();
    start(async () => {
      await markIntroSeenAction();
      if (to) router.push(to);
      else router.refresh();
    });
  }

  return (
    <dialog ref={ref} aria-labelledby="sora-title" onCancel={(e) => { e.preventDefault(); close(); }}
      className="m-auto w-[min(40rem,calc(100%-2rem))] overflow-hidden rounded-3xl border border-cyan/40 bg-panel p-0 text-text shadow-2xl backdrop:bg-bg/80 backdrop:backdrop-blur-sm">
      <div className="relative isolate">
        <Sprite src={asset.scene("gremio", "dia")} alt="" decorative className="absolute inset-0 -z-10 size-full object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-panel via-panel/70 to-transparent" />
        <div className="flex items-end justify-center gap-4 px-6 pt-6">
          <Sprite key={s.anim} src={asset.sora(s.anim)} alt="La Maestra Sora" className="h-44 w-auto sm:h-52" />
          {s.extra && <Sprite src={s.extra.src} alt={s.extra.alt} className="h-28 w-auto sm:h-32" />}
        </div>
      </div>
      <div className="space-y-4 p-6 pt-4">
        <div aria-live="polite" className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan">Maestra Sora · {step + 1} de {steps.length}</p>
          <h2 id="sora-title" className="text-2xl leading-tight sm:text-3xl">{s.title}</h2>
          <p className="text-muted sm:text-lg">{s.text}</p>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {steps.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-cyan" : "bg-white/15"}`} />)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {!last ? (
            <>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => close()}>Saltar</button>
              <div className="flex gap-2">
                {step > 0 && <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>Atrás</button>}
                <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)} autoFocus>Siguiente</button>
              </div>
            </>
          ) : (
            <>
              <Link href="/cronicas/prologo" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); close("/cronicas/prologo"); }}>📜 Leer el prólogo</Link>
              {teacher ? (
                <button type="button" className="btn btn-primary" autoFocus onClick={() => close("/maestro")}>Crear mi primera clase</button>
              ) : (
                <button type="button" className="btn btn-primary" autoFocus onClick={() => close(firstPortal ? `/portales/${firstPortal}` : undefined)}>Cruzar mi primer portal</button>
              )}
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
