import { Icon, type IconName } from "@/components/icons";

/** Encabezado de una página del panel: título, una línea de contexto y acciones a la derecha. */
export function PanelHeader({ title, description, eyebrow, children }: { title: string; description?: React.ReactNode; eyebrow?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div className="min-w-0 space-y-1">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-muted">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

/** Indicador con icono, valor y una nota opcional. */
export function Kpi({ icon, label, value, hint, tone = "brand" }: { icon: IconName; label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "brand" | "ok" | "warn" | "muted" }) {
  const tones = { brand: "bg-accion-suave text-accion", ok: "bg-[#e7f6ee] text-[#0f6b3a]", warn: "bg-[#fff4d6] text-[#8a5a00]", muted: "bg-[#eef0f5] text-[#555a75]" };
  return (
    <div className="panel flex items-start gap-4 p-5">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon name={icon} /></span>
      <div className="min-w-0">
        <dt className="text-sm text-muted">{label}</dt>
        <dd className="text-2xl font-bold tabular-nums tracking-tight">{value}</dd>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

/** Sección con título y acción opcional. */
export function PanelSection({ id, title, description, action, children }: { id: string; title: string; description?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={id} className="text-lg">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Estado vacío. */
export function Empty({ icon = "grid", children }: { icon?: IconName; children: React.ReactNode }) {
  return (
    <div className="panel flex flex-col items-center gap-2 px-6 py-10 text-center text-muted">
      <span className="grid size-11 place-items-center rounded-full bg-[#eef0f5] text-[#8a8da6]"><Icon name={icon} /></span>
      <div className="max-w-md text-sm">{children}</div>
    </div>
  );
}
