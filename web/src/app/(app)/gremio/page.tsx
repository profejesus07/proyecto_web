import type { Metadata } from "next";
import Link from "next/link";
import { AvatarFace } from "@/components/avatar-face";
import { SpeechBubble } from "@/components/dialogue";
import { SoraWelcome } from "@/components/sora-welcome";
import { Sprite, asset } from "@/components/sprite";
import { ItemTile, RankCard, Stat } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { getItem } from "@/lib/catalog";
import { getRepo } from "@/lib/data";
import { loadChronicles, unreadCount } from "@/lib/data/chronicles";
import { loadCourseViews } from "@/lib/data/queries";
import { kuroStage } from "@/lib/game/battle";
import { isStaff } from "@/lib/roles";
import { rankProgress } from "@/lib/game/ranks";

export const metadata: Metadata = { title: "El Gremio" };

function isDay(): boolean {
  const h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/Bogota" }).format(new Date()));
  return h >= 6 && h < 18;
}

export default async function GremioPage({ searchParams }: PageProps<"/gremio">) {
  const viewer = await requireViewer("/gremio");
  const passwordChanged = (await searchParams).aviso === "clave";
  const [courses, inventory, shelves] = await Promise.all([loadCourseViews(viewer.id), getRepo().getInventory(viewer.id), loadChronicles(viewer)]);
  const unread = unreadCount(shelves);
  const newest = shelves.flatMap((s) => s.chapters).filter((c) => c.unlocked && !c.read).at(-1);
  const rank = rankProgress(viewer.xp).rank;
  // Primero el curso que ya va en camino; si no, el siguiente que se puede empezar.
  const pending = courses.find((c) => c.next && c.status === "en-curso") ?? courses.find((c) => c.next);
  const started = courses.some((c) => c.done > 0);
  const toSubscribe = courses.find((c) => c.needsSubscription);
  const recent = inventory.slice(0, 6).map((i) => getItem(i.itemId)).filter((i): i is NonNullable<typeof i> => !!i);

  const greeting = pending?.next
    ? pending.status === "en-curso"
      ? `Muy bien, ${viewer.displayName}. Tu próxima misión es «${pending.next.title}».`
      : !started
        ? `¡Bienvenido, ${viewer.displayName}! Tu primer portal te espera: «${pending.title}». La primera lección es gratis.`
        : `Te espera «${pending.title}», ${viewer.displayName}. Su primera lección es gratis.`
    : toSubscribe
      ? `¡Gran trabajo, ${viewer.displayName}! Terminaste las lecciones gratis. Suscríbete a «${toSubscribe.title}» para seguir la aventura.`
      : courses.length > 0
        ? `¡Increíble, ${viewer.displayName}! Cruzaste todos los portales abiertos. Pronto habrá más.`
        : `Hola, ${viewer.displayName}. Todavía no hay portales abiertos.`;

  return (
    <div className="space-y-8">
      <section className="panel panel-glow relative isolate overflow-hidden rounded-3xl" aria-label="Bienvenida">
        <Sprite src={asset.scene("gremio", isDay() ? "dia" : "noche")} alt="" decorative priority className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/90 via-bg/50 to-transparent" />
        <div className="grid min-h-[22rem] items-end gap-6 p-6 sm:p-10 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-5 self-center">
            <p className="eyebrow">El Gremio</p>
            <div className="relative max-w-md rounded-2xl border-[2.5px] border-ink bg-white p-4 text-ink shadow-xl">
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#0f8f86]">Sora</p>
              <p className="mt-1 text-lg font-medium leading-snug">{greeting}</p>
            </div>
            {pending?.next ? (
              <Link href={`/mision/${pending.next.id}`} className="btn btn-primary btn-lg">Continuar aventura</Link>
            ) : toSubscribe ? (
              <Link href={`/suscribirse/${toSubscribe.slug}`} className="btn btn-primary btn-lg">Desbloquear «{toSubscribe.title}»</Link>
            ) : (
              <Link href="/portales" className="btn btn-primary btn-lg">Ir a la Sala de Portales</Link>
            )}
          </div>
          <div className="relative hidden h-72 md:block" aria-hidden="true">
            <Sprite src={asset.sora("saludar")} alt="" decorative className="absolute bottom-[-6%] right-[6%] h-[110%] w-auto" />
            <Sprite src={asset.avatar(viewer.avatarBase, rank.key)} alt="" decorative className="absolute bottom-[-8%] right-[38%] h-[105%] w-auto" />
            <Sprite src={asset.kuro("reposo", kuroStage(rank.key))} alt="" decorative className="absolute bottom-0 right-[66%] h-[42%] w-auto" />
          </div>
        </div>
      </section>

      {passwordChanged && <p role="status" className="panel !border-green/50 p-4 font-medium text-[#b6f5cb]">✔ Tu contraseña quedó guardada.</p>}

      {!viewer.introSeen && <SoraWelcome name={viewer.displayName} firstPortal={courses[0]?.slug ?? null} teacher={isStaff(viewer.role)} />}

      {isStaff(viewer.role) && (
        <section aria-label="Maestro del Gremio" className="panel flex flex-wrap items-center justify-between gap-4 !border-gold/40 p-5">
          <p><strong className="font-display text-lg">🧑‍🏫 Maestro del Gremio.</strong> <span className="text-muted">Crea clases y sigue el avance de tus estudiantes.</span></p>
          <Link href="/maestro" className="btn btn-primary">Ir a mis clases</Link>
        </section>
      )}

      {newest && (
        <section aria-label="Crónicas nuevas" className="panel flex flex-wrap items-center gap-4 !border-violet/40 p-4 sm:p-5">
          <SpeechBubble name="Archivista Eon" src={asset.eon("cronica")} alt="El Archivista Eon con su libro" tone="violet" className="min-w-0 flex-1">
            {unread === 1 ? "Se abrió un capítulo nuevo de las Crónicas: " : `Tienes ${unread} capítulos nuevos en las Crónicas. El más reciente: `}
            <strong>«{newest.chapter.title}»</strong>.
          </SpeechBubble>
          <Link href={`/cronicas/${newest.chapter.id}`} className="btn btn-secondary">📜 Leer ahora</Link>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <RankCard xp={viewer.xp} />
        <Stat icon="🪙" label="Monedas" value={viewer.coins} />
        <Stat icon="💎" label="Gemas" value={viewer.gems} />
        <Stat icon="🔥" label={viewer.streak === 1 ? "Día de racha" : "Días de racha"} value={viewer.streak} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="space-y-4" aria-labelledby="portales-t">
          <div className="flex items-end justify-between gap-4">
            <h2 id="portales-t" className="text-2xl">Tus portales</h2>
            <Link href="/portales" className="text-sm font-semibold text-cyan hover:underline">Ver la Sala de Portales →</Link>
          </div>
          {courses.length === 0 ? (
            <p className="panel p-6 text-muted">Pronto se abrirá el primer portal.</p>
          ) : (
            <ul className="space-y-3">
              {courses.map((c) => (
                <li key={c.slug}>
                  <Link href={`/portales/${c.slug}`} className="panel flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-cyan/50">
                    <Sprite src={asset.boss(c.guardian)} alt="" decorative className="size-16 shrink-0 object-contain" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="font-display text-lg font-bold leading-tight">{c.title}</p>
                      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={c.total} aria-valuenow={c.done} aria-label="Misiones completadas"><i style={{ width: `${(c.done / Math.max(c.total, 1)) * 100}%` }} /></div>
                      <p className="text-sm text-muted">{c.done} de {c.total} misiones{c.bossDefeated ? " · Guardián vencido ✔" : ""}{c.needsSubscription ? " · 🔓 Suscríbete para continuar" : ""}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4" aria-labelledby="botin-t">
          <div className="flex items-end justify-between gap-4">
            <h2 id="botin-t" className="text-2xl">Tu botín</h2>
            <Link href="/perfil" className="text-sm font-semibold text-cyan hover:underline">Ver todo →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="panel flex items-center gap-4 p-5">
              <AvatarFace base={viewer.avatarBase} rank={rank.key} size={56} />
              <p className="text-muted">Aún no tienes objetos. Completa tu primera misión y recibirás tu primera insignia.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {recent.map((it) => <li key={it.id}><ItemTile item={it} size="sm" /></li>)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
