import type { Metadata } from "next";
import Link from "next/link";
import { JoinClassForm, LeaveClassButton } from "@/components/classes-client";
import { logoutAction } from "@/app/actions/auth";
import { FamilyCodeCard, UnlinkButton } from "@/components/family-client";
import { DisplayNameForm } from "@/components/profile-client";
import { Sprite, asset } from "@/components/sprite";
import { Terrace } from "@/components/terrace";
import { ItemTile, PageTitle, RankCard, Stat } from "@/components/ui";
import { requirePlayer } from "@/lib/auth";
import { allItems, getItem, petImage, titleLabel, type CatalogItem } from "@/lib/catalog";
import { getRepo } from "@/lib/data";
import { loadDiplomas } from "@/lib/data/queries";
import { rankProgress } from "@/lib/game/ranks";
import { EN_TEXTO, Icon } from "@/components/icons";
import { ObjetoJuego } from "@/components/objeto-juego";

export const metadata: Metadata = { title: "Tu perfil" };

const SECTIONS: { key: string; title: string; cats: string[]; showMissing?: boolean; empty: string }[] = [
  { key: "recompensas", title: "Recompensas de Guardianes", cats: ["recompensa"], showMissing: true, empty: "Vence a un Guardián para conseguir la primera." },
  { key: "titulos", title: "Títulos", cats: ["titulo"], empty: "Los títulos se ganan al vencer Guardianes y explorar." },
  { key: "insignias", title: "Insignias y rangos", cats: ["rango", "insignia"], showMissing: true, empty: "Completa tu primera misión para empezar tu colección." },
  { key: "sellos", title: "Sellos y certificados", cats: ["sello", "certificado"], empty: "Termina un portal para recibir su sello y tu certificado." },
  { key: "tienda", title: "Tus compras", cats: ["poder", "ayuda", "marco", "cosmetico", "foco", "decoracion", "equipo", "companero"], empty: "Visita la tienda para conseguir ayudas, accesorios y compañeros." },
];

export default async function ProfilePage() {
  const viewer = await requirePlayer("/perfil");
  const isStudent = viewer.role === "estudiante";
  const [inventory, myClasses, myCerts, families] = await Promise.all([
    getRepo().getInventory(viewer.id), isStudent ? getRepo().listStudentClasses(viewer.id) : Promise.resolve([]), getRepo().listCertificates({ userId: viewer.id }),
    isStudent ? getRepo().listStudentFamilies(viewer.id) : Promise.resolve([]),
  ]);
  const diplomas = await loadDiplomas(viewer.id);
  const owned = new Set(inventory.map((i) => i.itemId));
  const p = rankProgress(viewer.xp);
  const pet = petImage(viewer.avatarLook.pet, p.rank.key);
  const title = titleLabel(viewer.avatarLook.title);

  const ownedItems = inventory.map((i) => getItem(i.itemId)).filter((i): i is CatalogItem => !!i);

  return (
    <div className="space-y-8">
      <section className="panel panel-glow relative isolate grid gap-6 overflow-hidden rounded-3xl p-6 sm:p-8 md:grid-cols-[auto_1fr]">
        <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(50% 80% at 12% 50%, ${p.rank.color}30, transparent 70%)` }} />
        <div className="relative mx-auto flex h-64 w-52 items-end justify-center md:h-72 md:w-60">
          <Sprite src={asset.avatar(viewer.avatarBase, p.rank.key, viewer.avatarLook)} alt={`Tu avatar, rango ${p.rank.key}`} priority className="h-full w-auto" />
          {pet && <Sprite src={pet} alt="Tu compañero" className="absolute bottom-0 right-0 h-1/3 w-auto" />}
        </div>
        <div className="space-y-5 self-center">
          <PageTitle eyebrow="Tu perfil" title={viewer.displayName} />
          <p className="text-muted">Rango {p.rank.key} · {p.rank.name}</p>
          {title && <p className="w-fit rounded-lg bg-gold/15 px-3 py-1 text-sm font-bold text-gold"><Icon name="medal" className={EN_TEXTO} /> «{title}»</p>}
          <div className="flex flex-wrap gap-2">
            <Link href="/perfil/avatar" className="btn btn-primary btn-sm"><Icon name="palette" className="size-4" /> Personalizar avatar</Link>
            <a href="#editar" className="btn btn-secondary btn-sm"><Icon name="pencil" className="size-4" /> Editar perfil</a>
          </div>
        </div>
      </section>

      <section id="editar" aria-labelledby="editar-t" className="panel scroll-mt-24 space-y-6 p-6">
        <h2 id="editar-t" className="text-2xl">Editar perfil</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <DisplayNameForm current={viewer.displayName} />
          <div className="space-y-2">
            <p className="label">Avatar</p>
            <p className="text-sm text-muted">Cambia de personaje, colores de piel, cabello, ojos y ropa, y los atuendos que ganas al subir de rango.</p>
            <Link href="/perfil/avatar" className="btn btn-secondary btn-sm"><Icon name="palette" className="size-4" /> Abrir el Vestidor</Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Link href="/nueva-contrasena" className="btn btn-ghost btn-sm"><Icon name="key" className="size-4" /> Cambiar mi contraseña</Link>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-ghost btn-sm"><Icon name="logout" className="size-4" /> Cerrar sesión</button>
          </form>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <RankCard xp={viewer.xp} />
        <Stat icon={<ObjetoJuego nombre="moneda" className="size-10" />} label="Monedas" value={viewer.coins} />
        <Stat icon={<ObjetoJuego nombre="gema" className="size-10" />} label="Gemas" value={viewer.gems} />
        <Stat icon={<ObjetoJuego nombre="racha" className="size-10" />} label={viewer.streak === 1 ? "Día de racha" : "Días de racha"} value={viewer.streak} />
      </div>

      {myCerts.length > 0 && (
        <section aria-labelledby="const-t" className="panel space-y-3 p-6">
          <h2 id="const-t" className="text-2xl">Mis constancias</h2>
          <ul className="space-y-2">
            {myCerts.map((c) => (
              <li key={c.code} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-bg/40 px-4 py-2.5">
                <span><strong>{c.courseTitle}</strong> <span className="text-sm text-muted">· {c.hours} horas · {c.code}</span></span>
                <Link href={`/constancia/${c.code}`} className="btn btn-secondary btn-sm"><Icon name="seal" className="size-4" /> Ver y descargar</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isStudent && (
        <section aria-labelledby="clases-t" className="panel grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-3">
            <h2 id="clases-t" className="text-2xl">Mis clases</h2>
            {myClasses.length === 0 ? (
              <p className="text-muted">Si tu docente o tu colegio usan UNEX Academy, te darán un código de 6 caracteres. Con él te unes a tu grupo y, si es una clase, entras gratis durante el año lectivo.</p>
            ) : (
              <ul className="space-y-2">
                {myClasses.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg/40 px-4 py-2.5">
                    <span><strong>{c.name}</strong> <span className="text-sm text-muted">· {c.teacherName}{c.courseTitle ? ` · ${c.courseTitle}` : ""}</span></span>
                    <LeaveClassButton classId={c.id} name={c.name} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-3">
            <JoinClassForm />
            <p className="hint">Al unirte, tu docente verá tu nombre de aventurero, tu rango y tu avance en los portales. Nunca verá tu correo ni tu contraseña. Puedes salir cuando quieras.</p>
          </div>
        </section>
      )}

      {isStudent && (
        <section aria-labelledby="familia-t" className="panel grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-3">
            <h2 id="familia-t" className="text-2xl">Mi familia</h2>
            <p className="text-muted">Comparte tu código con tu mamá, papá o quien te acompañe. Con él podrá ver tu rango, tu racha y tu avance en los portales. No verá tu correo, tu contraseña ni tus respuestas, y no podrá cambiar nada.</p>
            {families.length > 0 && (
              <ul className="space-y-2">
                {families.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg/40 px-4 py-2.5">
                    <span><Icon name="people" className={EN_TEXTO} /> <strong>{f.name}</strong> <span className="text-sm text-muted">ve tu avance</span></span>
                    <UnlinkButton otherId={f.id} label="Quitar" confirmText={`¿Dejar de compartir tu avance con ${f.name}?`} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-3">
            <Terrace decor={inventory.map((i) => i.itemId)} />
            <p className="hint">La Terraza del Hogar de tu familia{families.length ? "" : " (cuando se vinculen)"}. <Link href="/tienda?c=decoracion" className="font-semibold text-cyan underline underline-offset-4">Decórala en la tienda</Link>.</p>
            <FamilyCodeCard />
            <p className="hint">Tu familia lo escribe en su cuenta de UNEX Academy (tipo «Familia»), en «Mi familia». Si lo compartiste con quien no debías, cámbialo.</p>
          </div>
        </section>
      )}

      {diplomas.length > 0 && (
        <section aria-labelledby="diplomas-t" className="panel space-y-3 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <Sprite src="/assets/objetos/certificado/obj_certificado_portal.svg" alt="" decorative className="h-16 w-auto" />
            <div className="flex-1">
              <h2 id="diplomas-t" className="text-2xl">Mis diplomas</h2>
              <p className="text-sm text-muted">Un diploma «Sello del Portal» por cada portal que completaste. Descárgalo con tu nombre.</p>
            </div>
          </div>
          <ul className="space-y-2">
            {diplomas.map((d) => (
              <li key={d.slug} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-bg/40 px-4 py-2.5">
                <strong>{d.title}</strong>
                <Link href={`/diploma/${d.slug}`} className="btn btn-secondary btn-sm"><Icon name="scroll" className="size-4" /> Ver y descargar</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {SECTIONS.map((s) => {
        const mine = ownedItems.filter((i) => s.cats.includes(i.categoria));
        const missing = s.showMissing ? allItems().filter((i) => s.cats.includes(i.categoria) && !owned.has(i.id)) : [];
        const total = mine.length + missing.length;
        return (
          <section key={s.key} className="space-y-4" aria-labelledby={`sec-${s.key}`}>
            <div className="flex items-end justify-between gap-3">
              <h2 id={`sec-${s.key}`} className="text-2xl">{s.title}</h2>
              {s.showMissing && <p className="text-sm font-semibold text-muted">{mine.length} de {total}</p>}
            </div>
            {mine.length === 0 && missing.length === 0 ? (
              <p className="panel p-5 text-muted">{s.empty}</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {mine.map((it) => <li key={it.id}><ItemTile item={it} /></li>)}
                {missing.map((it) => <li key={it.id}><ItemTile item={it} owned={false} /></li>)}
              </ul>
            )}
            {mine.length === 0 && missing.length > 0 && <p className="text-sm text-muted">{s.empty}</p>}
          </section>
        );
      })}

      <p className="text-center text-sm text-muted">¿Quieres más accesorios y ayudas? <Link href="/tienda" className="font-semibold text-cyan underline underline-offset-4">Visita la tienda</Link></p>
    </div>
  );
}
