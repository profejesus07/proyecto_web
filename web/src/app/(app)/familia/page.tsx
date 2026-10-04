import type { Metadata } from "next";
import Link from "next/link";
import { AvatarFace } from "@/components/avatar-face";
import { SpeechBubble } from "@/components/dialogue";
import { LinkFamilyForm, SendMessage, UnlinkButton } from "@/components/family-client";
import { GuidePicker } from "@/components/guide-picker";
import { PayButtons, type PayOption } from "@/components/pay-buttons";
import { FAMILY_MESSAGES_PER_DAY, GUARDIANES_HOGAR, guideSrc, type Guide, type GuideAnim } from "@/content/elenco";
import { Sprite, asset } from "@/components/sprite";
import { Terrace } from "@/components/terrace";
import { PageTitle } from "@/components/ui";
import { daysAgo, lastSeen } from "@/lib/activity";
import { requireFamily } from "@/lib/auth";
import { titleLabel } from "@/lib/catalog";
import { getRepo } from "@/lib/data";
import { guideFor } from "@/lib/guides";
import { formatPrice } from "@/lib/data/queries";
import type { Course, FamilyChild, Payment } from "@/lib/data/types";
import { isRecentPending, payOptions } from "@/lib/payments/config";
import { PASS_MARK } from "@/lib/game/grading";
import { rankProgress } from "@/lib/game/ranks";

export const metadata: Metadata = { title: "Mi familia" };

/** La terraza cambia con la hora de Bogotá. */
function terraceState(): "manana" | "atardecer" | "noche" {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return h >= 5 && h < 16 ? "manana" : h >= 16 && h < 19 ? "atardecer" : "noche";
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" });

/** Una frase para la familia, según cómo va la semana (y el gesto de su Guardián del Hogar). */
function nudge(c: FamilyChild): { text: string; anim: GuideAnim } {
  const d = daysAgo(c.lastActive);
  if (d === null) return { anim: "senalar", text: `${c.name} todavía no ha empezado. Anímale a cruzar su primer portal: la primera lección siempre es gratis.` };
  if (d <= 1 && c.streak >= 3) return { anim: "orgullo", text: `¡${c.streak} días seguidos! Celebren juntos esa constancia.` };
  if (d <= 2) return { anim: "hablar", text: "Va al día. Pregúntale qué aprendió hoy: contarlo ayuda a recordarlo." };
  if (d <= 7) return { anim: "pensar", text: "Lleva unos días sin entrar. Un rato corto hoy basta para retomar la racha." };
  return { anim: "animar", text: "Hace más de una semana que no entra. Acompáñale en la próxima lección; equivocarse también es parte de aprender." };
}

interface PayInfo { options: PayOption[]; test: boolean; courses: Course[]; access: Set<string>; pending: Payment[] }

/** Cursos que ya empezó, sin acceso completo y con precio: la familia puede pagarlos aquí. */
function Unlock({ c, pay }: { c: FamilyChild; pay: PayInfo }) {
  const price = new Map(pay.courses.map((k) => [k.slug, k.price]));
  const locked = c.courses.filter((k) => !pay.access.has(k.slug) && (price.get(k.slug) ?? 0) > 0);
  if (!locked.length) return null;
  return (
    <section aria-label="Desbloquear cursos" className="space-y-3">
      <h3 className="text-lg">Desbloquear un curso</h3>
      <p className="text-sm text-muted">La primera lección es gratis. Con el curso completo, {c.name} sigue con el resto de lecciones y la batalla final.</p>
      <ul className="space-y-3">
        {locked.map((k) => {
          const waiting = pay.pending.find((p) => p.userId === c.id && p.courseSlug === k.slug);
          return (
            <li key={k.slug} className="space-y-3 rounded-xl border border-line bg-bg/40 p-4">
              <p className="flex flex-wrap items-baseline justify-between gap-2 font-bold">{k.title} <span className="font-display text-xl text-gold">{formatPrice(price.get(k.slug) ?? null)}</span></p>
              {waiting && (
                <p role="status" className="text-sm text-[#ffe3a0]">⏳ Hay un pago en proceso. <Link href={`/pago/${waiting.reference}`} className="font-semibold text-cyan underline underline-offset-4">Ver cómo va</Link></p>
              )}
              {pay.options.length
                ? <PayButtons course={k.slug} student={c.id} options={pay.options} test={pay.test} />
                : <p className="text-sm text-muted">Los pagos en línea llegan muy pronto. Mientras tanto, escríbenos y lo activamos a mano.</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ChildCard({ c, guide, left, pay }: { c: FamilyChild; guide: Guide; left: number; pay: PayInfo }) {
  const tip = nudge(c);
  const p = rankProgress(c.xp);
  const done = c.courses.reduce((n, k) => n + k.lessons.filter((l) => l.completed).length, 0);
  return (
    <article className="panel space-y-6 p-5 sm:p-6" aria-labelledby={`child-${c.id}`}>
      <header className="flex flex-wrap items-center gap-4">
        <AvatarFace base={c.avatar} look={c.avatarLook} rank={p.rank.key} size={72} />
        <div className="min-w-0 flex-1">
          <h2 id={`child-${c.id}`} className="text-2xl">{c.name}</h2>
          {titleLabel(c.avatarLook.title) && <p className="text-sm font-bold text-[#d9c9ff]">🎖️ «{titleLabel(c.avatarLook.title)}»</p>}
          <p className="text-sm text-muted">
            <span className="rounded-md px-1.5 text-xs font-extrabold" style={{ background: p.rank.color, color: "#14123b" }}>{p.rank.key}</span>{" "}
            Rango {p.rank.name} · {c.xp} XP
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Última vez", lastSeen(c.lastActive)],
          ["Racha", `🔥 ${c.streak} ${c.streak === 1 ? "día" : "días"}`],
          ["Esta semana", `${c.weekAttempts} ${c.weekAttempts === 1 ? "misión" : "misiones"}`],
          ["Lecciones superadas", String(done)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line bg-bg/40 p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</dt>
            <dd className="mt-1 font-display text-lg font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      <SpeechBubble name={guide.name} src={guideSrc(guide, tip.anim)} alt={guide.name} tone="cyan">{tip.text}</SpeechBubble>

      <SendMessage studentId={c.id} name={c.name} left={left} />

      <section aria-label="Portales" className="space-y-3">
        <h3 className="text-lg">Portales</h3>
        {c.courses.length === 0 ? (
          <p className="text-sm text-muted">Aún no ha empezado ningún portal.</p>
        ) : (
          <ul className="space-y-4">
            {c.courses.map((k) => {
              const ok = k.lessons.filter((l) => l.completed).length;
              return (
                <li key={k.slug} className="space-y-2 rounded-xl border border-line bg-bg/40 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-bold">{k.title} <span className="text-xs font-normal text-muted">· {k.kind === "clase" ? "Clase" : "Curso corto"}</span></p>
                    <p className="text-sm text-muted">{ok} de {k.total} lecciones</p>
                  </div>
                  <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={k.total} aria-valuenow={ok} aria-label={`Avance en ${k.title}`}>
                    <i style={{ width: `${(ok / Math.max(k.total, 1)) * 100}%` }} />
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {k.lessons.map((l) => (
                      <li key={l.position} title={`${l.title}: mejor nota ${l.bestScore}% en ${l.attempts} ${l.attempts === 1 ? "intento" : "intentos"}`}
                        className={`rounded-lg px-2 py-1 text-xs font-bold ${l.completed ? "bg-green/20 text-[#b6f5cb]" : "bg-gold/15 text-[#ffe3a0]"}`}>
                        L{l.position} · {l.bestScore}%{l.completed ? " ✔" : ""}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
        <p className="hint">Una lección se supera con {PASS_MARK}% o más. Puede repetirla las veces que quiera.</p>
      </section>

      <Unlock c={c} pay={pay} />

      {(c.classes.length > 0 || c.certificates.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {c.classes.length > 0 && (
            <section aria-label="Clases" className="space-y-2">
              <h3 className="text-lg">Clases</h3>
              <ul className="space-y-1 text-sm">
                {c.classes.map((x) => <li key={x.name}>🏫 <strong>{x.name}</strong> <span className="text-muted">· {x.teacher}</span></li>)}
              </ul>
            </section>
          )}
          {c.certificates.length > 0 && (
            <section aria-label="Constancias" className="space-y-2">
              <h3 className="text-lg">Constancias</h3>
              <ul className="space-y-1 text-sm">
                {c.certificates.map((x) => (
                  <li key={x.code}>🎓 <strong>{x.courseTitle}</strong> <span className="text-muted">· {x.hours} h · {fmtDate(x.issuedAt)}</span>{" "}
                    <Link href={`/verificar/${x.code}`} className="font-semibold text-cyan underline underline-offset-4">Verificar</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
        <p className="text-xs text-muted">Acompañas a {c.name} desde el {fmtDate(c.since)}.</p>
        <UnlinkButton otherId={c.id} label="Dejar de acompañar" confirmText={`¿Dejar de ver el avance de ${c.name}? Podrás volver a vincularte con su código.`} />
      </footer>
    </article>
  );
}

export default async function FamilyPage({ searchParams }: PageProps<"/familia">) {
  const viewer = await requireFamily("/familia");
  const passwordChanged = (await searchParams).aviso === "clave";
  const repo = getRepo();
  const [children, left, courses, payments] = await Promise.all([
    repo.familyOverview(viewer.id), repo.familyMessagesLeft(viewer.id), repo.listCourses(), repo.listPayments(viewer.id),
  ]);
  const access = new Map(await Promise.all(children.map(async (c) => [c.id, await repo.getCourseAccess(c.id)] as const)));
  const { options, test } = payOptions();
  const pending = payments.filter(isRecentPending);
  const guide = guideFor(viewer)!;

  return (
    <div className="space-y-8">
      <section className="panel relative isolate overflow-hidden rounded-3xl" aria-label="Terraza del Hogar">
        <Sprite src={asset.scene("terraza", terraceState())} alt="" decorative priority className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/90 via-bg/60 to-transparent" />
        <div className="flex items-end justify-between gap-4 p-6 sm:p-10">
          <div className="md:max-w-md">
            <PageTitle eyebrow="Guardianes del Hogar" title="Mi familia">
              <p className="text-text/80">Acompaña el avance de tus hijos en UMBRAL: sus portales, sus notas y su racha. Solo lo ves; no puedes cambiar nada de su cuenta.</p>
            </PageTitle>
          </div>
          <Sprite src={guideSrc(guide, "saludar")} alt={`${guide.name}, tu Guardián del Hogar, te saluda`} className="hidden h-48 w-auto sm:block" />
        </div>
      </section>

      {children.length > 0 && (
        <section aria-labelledby="terraza-t" className="panel space-y-3 p-5 sm:p-6">
          <h2 id="terraza-t" className="text-xl">La Terraza del Hogar</h2>
          <Terrace decor={[...new Set(children.flatMap((c) => c.decor))]} state={terraceState()} />
          <p className="text-sm text-muted">
            {children.some((c) => c.decor.length)
              ? `Regalos de ${children.filter((c) => c.decor.length).map((c) => c.name).join(" y ")}: los compraron con las monedas que ganaron aprendiendo.`
              : "Tus hijos pueden decorarla con las monedas que ganan en sus misiones (en la tienda, sección «Decoración»)."}
          </p>
        </section>
      )}

      {passwordChanged && <p role="status" className="panel !border-green/50 p-4 font-medium text-[#b6f5cb]">✔ Tu contraseña quedó guardada.</p>}

      {children.map((c) => <ChildCard key={c.id} c={c} guide={guide} left={left[c.id] ?? FAMILY_MESSAGES_PER_DAY}
        pay={{ options, test, courses, access: access.get(c.id) ?? new Set(), pending }} />)}

      <section className="panel grid gap-6 p-5 sm:p-6 md:grid-cols-2" aria-labelledby="vincular-t">
        <div className="space-y-2">
          <h2 id="vincular-t" className="text-xl">{children.length ? "Acompañar a otro estudiante" : "Vincula a tu hijo o hija"}</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>Tu hijo o hija entra a su cuenta y abre <strong className="text-text">Perfil → Mi familia</strong>.</li>
            <li>Pulsa «Mostrar mi código de familia» y te dice el código de 8 caracteres.</li>
            <li>Escríbelo aquí. Así sabe que verás su avance y da su permiso.</li>
          </ol>
        </div>
        <LinkFamilyForm />
      </section>

      <section aria-labelledby="hogar-t" className="panel max-w-2xl space-y-3 p-5">
        <h2 id="hogar-t" className="text-xl">Tu Guardián del Hogar</h2>
        <p className="text-sm text-muted">Elige quién te representa. Tu hijo o hija lo verá junto a tus mensajes de apoyo.</p>
        <GuidePicker options={GUARDIANES_HOGAR} current={guide.id} legend="Guardián del Hogar" />
      </section>

      <p className="text-center text-xs text-muted">Nunca verás su correo, su contraseña ni sus respuestas. Tu hijo o hija puede dejar de compartir su avance desde su perfil.</p>
    </div>
  );
}
