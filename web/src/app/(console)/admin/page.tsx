import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { DeleteButton } from "@/components/delete-button";
import { IssuerSettingsForm } from "@/components/issuer-settings-form";
import { AccessChip, CreateLinkedClassForm, CreateTeacherForm, GrantAccess, PriceForm, RoleSelect, TeacherSelect } from "@/components/admin-client";
import { PageTitle } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { formatPrice } from "@/lib/data/queries";
import { ROLE_LABEL, isAccessActive } from "@/lib/roles";
import { PROVIDER_LABEL, isTestMode, providerMode } from "@/lib/payments/config";
import { siteUrl } from "@/lib/site";
import type { AdminPayment, PaymentProvider, PaymentStatus } from "@/lib/data/types";

const STATUS_LABEL: Record<PaymentStatus, string> = { aprobado: "✔ Aprobado", pendiente: "⏳ Pendiente", rechazado: "✖ Rechazado", anulado: "↩ Anulado", error: "⚠ Error" };
const STATUS_CLASS: Record<PaymentStatus, string> = {
  aprobado: "text-[#b6f5cb]", pendiente: "text-[#ffe3a0]", rechazado: "text-muted", anulado: "text-[#ffb3b3]", error: "text-[#ffb3b3]",
};

/** Estado de las pasarelas y últimos pagos. */
function Payments({ payments, site }: { payments: AdminPayment[]; site: string }) {
  const providers: { id: PaymentProvider; env: string; hook: string }[] = [
    { id: "wompi", env: "WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET y WOMPI_EVENTS_SECRET", hook: `${site}/api/pagos/wompi` },
    { id: "mercadopago", env: "MERCADOPAGO_ACCESS_TOKEN (y MERCADOPAGO_WEBHOOK_SECRET)", hook: `${site}/api/pagos/mercadopago` },
  ];
  const fmt = (iso: string) => new Date(iso).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" });
  const approved = payments.filter((p) => p.status === "aprobado").reduce((n, p) => n + p.amount, 0);
  return (
    <section aria-labelledby="pagos-t" className="space-y-4">
      <h2 id="pagos-t" className="text-2xl">Pagos en línea</h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {providers.map((p) => {
          const mode = providerMode(p.id);
          return (
            <li key={p.id} className="panel space-y-1 p-4 text-sm">
              <p className="font-bold">{PROVIDER_LABEL[p.id]}{" "}
                <span className={mode ? "text-[#b6f5cb]" : "text-muted"}>
                  · {mode === "simulado" ? "simulado (vista previa)" : mode ? (isTestMode(p.id) ? "activo en modo de prueba" : "activo") : "sin configurar"}
                </span>
              </p>
              {!mode && <p className="text-muted">Pon {p.env} en Vercel → Settings → Environment Variables.</p>}
              <p className="text-muted">URL de avisos (webhook): <code className="break-all text-text">{p.hook}</code></p>
            </li>
          );
        })}
      </ul>
      {payments.length === 0 ? (
        <p className="panel p-5 text-muted">Todavía no hay pagos.</p>
      ) : (
        <div className="panel overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="p-4 text-left text-muted">Últimos {payments.length} pagos · aprobados en esta lista: {formatPrice(approved)}</caption>
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr><th className="p-3">Fecha</th><th className="p-3">Estudiante</th><th className="p-3">Curso</th><th className="p-3">Valor</th><th className="p-3">Pasarela</th><th className="p-3">Estado</th><th className="p-3">Referencia</th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.reference} className="border-b border-line/60 last:border-0">
                  <td className="p-3 whitespace-nowrap">{fmt(p.createdAt)}</td>
                  <td className="p-3">{p.student}{p.payer && <span className="block text-xs text-muted">pagó {p.payer}</span>}</td>
                  <td className="p-3">{p.courseTitle}</td>
                  <td className="p-3 whitespace-nowrap">{formatPrice(p.amount)}</td>
                  <td className="p-3">{PROVIDER_LABEL[p.provider]}</td>
                  <td className={`p-3 font-semibold ${STATUS_CLASS[p.status]}`} title={p.detail ?? undefined}>{STATUS_LABEL[p.status]}</td>
                  <td className="p-3 font-mono text-xs">{p.reference}{p.providerRef && <span className="block text-muted">{p.providerRef}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export const metadata: Metadata = { title: "Administración" };

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const viewer = await requireAdmin("/admin");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const repo = getRepo();
  const [users, courses, classes, allCourses, everyone, settings, certs, payments, site] = await Promise.all([
    repo.adminUsers(viewer.id, q), repo.listCourses(), repo.adminClasses(viewer.id), repo.listAllCourses(), q ? repo.adminUsers(viewer.id, "") : Promise.resolve(null),
    repo.getIssuerSettings(), repo.listCertificates({ limit: 50 }), repo.adminPayments(viewer.id), siteUrl(),
  ]);
  const teachers = (everyone ?? users).filter((u) => u.role === "docente" || u.role === "admin").map((u) => ({ id: u.id, name: u.role === "admin" ? `${u.name} (yo)` : u.name }));
  const clases = allCourses.filter((c) => c.kind === "clase").map((c) => ({ slug: c.slug, title: c.title }));
  const title = new Map(courses.map((c) => [c.slug, c.title]));
  const count = (role: string) => users.filter((u) => u.role === role).length;
  const activeAccess = users.reduce((n, u) => n + u.access.filter((a) => isAccessActive(a.expiresAt)).length, 0);

  return (
    <div className="space-y-10">
      <PageTitle eyebrow="Panel del administrador" title="Administración">
        <p>Cuentas de docente, acceso a los cursos, precios y todas las clases.</p>
      </PageTitle>
      <AdminNav current="general" />

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: q ? "Personas encontradas" : "Personas", value: users.length, icon: "👥" },
          { label: "Estudiantes", value: count("estudiante"), icon: "🧑‍🎓" },
          { label: "Docentes", value: count("docente"), icon: "🧑‍🏫" },
          { label: "Cursos activados", value: activeAccess, icon: "🔑" },
        ].map((s) => (
          <div key={s.label} className="panel flex items-center gap-4 p-5">
            <span aria-hidden="true" className="text-3xl">{s.icon}</span>
            <div><dt className="text-sm text-muted">{s.label}</dt><dd className="font-display text-3xl font-extrabold">{s.value}</dd></div>
          </div>
        ))}
      </dl>

      <Payments payments={payments} site={site} />

      <section aria-labelledby="docente-t" className="panel space-y-3 p-6">
        <h2 id="docente-t" className="text-2xl">Crear cuenta de docente</h2>
        <p className="text-sm text-muted">La cuenta queda lista para entrar, con una contraseña temporal. Los docentes pueden crear clases y ver el avance de sus estudiantes, pero no cambiar sus datos ni sus notas.</p>
        <CreateTeacherForm />
      </section>

      <section aria-labelledby="personas-t" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="personas-t" className="text-2xl">Personas</h2>
          <form role="search" className="flex w-full flex-wrap gap-2 sm:w-auto">
            <label htmlFor="buscar" className="sr-only">Buscar por nombre o correo</label>
            <input id="buscar" name="q" defaultValue={q} placeholder="Buscar por nombre o correo" className="input min-w-0 flex-1 sm:!w-64 sm:flex-none" />
            <button type="submit" className="btn btn-secondary">Buscar</button>
            {q && <Link href="/admin" className="btn btn-ghost">Limpiar</Link>}
          </form>
        </div>
        {users.length === 0 ? (
          <p className="panel p-6 text-muted">No hay personas que coincidan.</p>
        ) : (
          <ul className="space-y-3">
            {users.map((u) => (
              <li key={u.id} className="panel grid gap-3 p-4 md:grid-cols-[1.2fr_auto_2fr] md:items-center">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{u.name} <span className="text-xs font-normal text-muted">· {ROLE_LABEL[u.role]} · {u.xp} XP</span></p>
                  <p className="truncate text-sm text-muted">{u.email}</p>
                  <p className="text-xs text-muted">Desde {new Date(u.createdAt).toLocaleDateString("es-CO")}{u.lastSignInAt ? ` · último ingreso ${new Date(u.lastSignInAt).toLocaleDateString("es-CO")}` : ""}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RoleSelect userId={u.id} role={u.role} name={u.name} />
                  {u.role !== "admin" && u.id !== viewer.id && (
                    <DeleteButton kind="cuenta" id={u.id} name={u.name} consequences={
                      u.role === "docente"
                        ? ["Se borra la cuenta y no podrá volver a entrar con ese correo (salvo que se registre de nuevo).", "Se borran sus grupos; sus estudiantes siguen con sus cuentas, pero pierden el acceso que les dio el código.", "Si solo quieres quitarle el rol, cámbialo a Estudiante."]
                        : ["Se borra la cuenta con todo su avance, su inventario, sus vínculos de familia y sus clases.", "Sus pagos quedan en la copia contable y sus constancias expedidas siguen verificables (sin enlace a la cuenta)."]
                    } />
                  )}
                </div>
                <div className="space-y-2">
                  {u.role === "docente" || u.role === "admin" ? (
                    <p className="text-sm text-muted">Ve todos los cursos completos.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {u.access.length === 0 && <span className="text-sm text-muted">Solo lecciones gratis</span>}
                        {u.access.map((a) => <AccessChip key={a.course} userId={u.id} course={a.course} title={title.get(a.course) ?? a.course} expiresAt={a.expiresAt} expired={!isAccessActive(a.expiresAt)} />)}
                      </div>
                      <GrantAccess userId={u.id} name={u.name} courses={courses.map((c) => ({ slug: c.slug, title: c.title }))} />
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {users.length >= 200 && <p className="text-sm text-muted">Se muestran las 200 más recientes. Usa la búsqueda para encontrar a alguien.</p>}
      </section>

      <section aria-labelledby="precios-t" className="space-y-4">
        <h2 id="precios-t" className="text-2xl">Cursos y precios</h2>
        <ul className="space-y-3">
          {courses.map((c) => (
            <li key={c.slug} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-muted">Precio actual: {formatPrice(c.price)}. La primera lección siempre es gratis.</p>
              </div>
              <PriceForm course={c.slug} title={c.title} price={c.price} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="clases-t" className="space-y-4">
        <h2 id="clases-t" className="text-2xl">Grupos y códigos</h2>
        <div className="panel space-y-3 p-5">
          <h3 className="font-display text-lg font-bold">Crear grupo para una clase</h3>
          <p className="text-sm text-muted">Quien se une con el código del grupo entra gratis a la clase hasta el fin del año lectivo. El docente que elijas lo gestiona y ve el avance de sus estudiantes.</p>
          <CreateLinkedClassForm clases={clases} teachers={teachers} />
        </div>
        {classes.length === 0 ? (
          <p className="panel p-6 text-muted">Todavía no hay grupos.</p>
        ) : (
          <ul className="space-y-2">
            {classes.map((c) => (
              <li key={c.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link href={`/maestro/${c.id}`} className="font-semibold text-cyan hover:underline">{c.name}{c.archived ? " · archivado" : ""}</Link>
                  <p className="text-sm text-muted">
                    {c.courseTitle ? <>Da acceso a <strong className="text-text">{c.courseTitle}</strong></> : "Grupo propio del docente (no da acceso)"} · {c.members} estudiantes · código <span className="font-mono font-bold text-gold">{c.code}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {c.courseSlug ? <TeacherSelect classId={c.id} teacherId={c.teacherId} teachers={teachers} name={c.name} /> : <span className="text-sm text-muted">{c.teacher}</span>}
                  <DeleteButton kind="grupo" id={c.id} name={c.name} consequences={[
                    `Sus ${c.members} estudiantes salen del grupo (sus cuentas y su avance se conservan).`,
                    ...(c.courseSlug ? ["Pierden el acceso a la clase que les dio el código."] : []),
                    "El código deja de funcionar. Si solo quieres cerrarlo, el docente puede archivarlo.",
                  ]} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="const-t" className="space-y-4">
        <h2 id="const-t" className="text-2xl">Constancias de asistencia</h2>
        <div className="panel space-y-3 p-5">
          <h3 className="font-display text-lg font-bold">Responsable y firma</h3>
          <p className="text-sm text-muted">Aparecen en todas las constancias que se expidan desde ahora. Las ya expedidas no cambian.</p>
          {(!settings.issuerName || !settings.signaturePng) && <p role="note" className="text-sm font-semibold text-[#ffe3a0]">⚠ Mientras falten el nombre y la firma, los estudiantes no podrán obtener su constancia.</p>}
          <IssuerSettingsForm settings={settings} />
        </div>
        {certs.length === 0 ? (
          <p className="panel p-5 text-muted">Todavía no se ha expedido ninguna constancia.</p>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Últimas constancias expedidas</caption>
              <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <tr><th className="px-4 py-3">N.º</th><th className="px-3 py-3">Participante</th><th className="px-3 py-3">Curso</th><th className="px-3 py-3">Expedida</th><th className="px-3 py-3">Código</th></tr>
              </thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c.code} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-2 font-mono">{String(c.number).padStart(6, "0")}</td>
                    <td className="px-3 py-2">{c.participantName}</td>
                    <td className="px-3 py-2">{c.courseTitle} · {c.hours} h</td>
                    <td className="px-3 py-2">{new Date(c.issuedAt).toLocaleDateString("es-CO")}</td>
                    <td className="px-3 py-2"><Link href={`/constancia/${c.code}`} className="font-mono text-cyan hover:underline">{c.code}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
