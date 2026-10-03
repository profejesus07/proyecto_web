"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, registerAction, type FormState } from "@/app/actions/auth";
import { Sprite, asset } from "@/components/sprite";
import { PASSWORD_RULES } from "@/lib/validation";

function Submit({ children, pending: label }: { children: React.ReactNode; pending: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
      {pending ? label : children}
    </button>
  );
}

function Notice({ state }: { state: FormState }) {
  return (
    <div aria-live="polite" className="min-h-0">
      {state?.error && (
        <p role="alert" className="rounded-xl border border-coral/50 bg-coral/10 px-4 py-3 text-sm font-medium text-[#ffb3b3]">{state.error}</p>
      )}
      {state?.message && (
        <p role="status" className="rounded-xl border border-green/50 bg-green/10 px-4 py-3 text-sm font-medium text-[#b6f5cb]">{state.message}</p>
      )}
    </div>
  );
}

function PasswordField({ id = "password", autoComplete, onChange, describedBy, pattern, title }: {
  id?: string; autoComplete: string; onChange?: (v: string) => void; describedBy?: string; pattern?: string; title?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} name="password" type={show ? "text" : "password"} required minLength={8} maxLength={72} autoComplete={autoComplete} className="input pr-24"
        onChange={onChange && ((e) => onChange(e.target.value))} aria-describedby={describedBy} pattern={pattern} title={title} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-sm font-semibold text-cyan hover:bg-white/5">
        {show ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}

const ROLES = [
  { value: "estudiante", title: "Estudiante", text: "Voy a aprender" },
  { value: "docente", title: "Docente", text: "Acompaño a un grupo" },
  { value: "familia", title: "Familia", text: "Acompaño a mi hijo o hija" },
] as const;

const AVATARS = [
  { value: "aria", name: "Aria" },
  { value: "leo", name: "Leo" },
  { value: "tomas", name: "Tomás" },
  { value: "nuri", name: "Nuri" },
] as const;

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, undefined);
  const [role, setRole] = useState<string>("estudiante");
  const [password, setPassword] = useState("");
  // Tras un envío fallido React vacía el formulario: la lista de reglas vuelve a empezar con él.
  const [seen, setSeen] = useState(state);
  if (seen !== state) {
    setSeen(state);
    setPassword("");
  }

  if (state?.message) {
    return (
      <div className="space-y-5 text-center" aria-live="polite">
        <Sprite src={asset.kuro("celebrar")} alt="Kuro celebrando" className="mx-auto h-40 w-auto" />
        <h2 className="text-2xl">¡Revisa tu correo!</h2>
        <p className="text-muted">{state.message}</p>
        <Link href="/ingresar" className="btn btn-secondary">Ir a ingresar</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6" noValidate={false}>
      <fieldset className="space-y-3">
        <legend className="label">¿Quién eres?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {ROLES.map((r) => (
            <label key={r.value} className="cursor-pointer">
              <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} className="peer sr-only" required />
              <span className="block rounded-xl border-2 border-line bg-bg/40 p-3 text-center transition peer-checked:border-cyan peer-checked:bg-cyan/10 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan hover:border-[#4a43a0]">
                <span className="block font-bold">{r.title}</span>
                <span className="block text-xs text-muted">{r.text}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="label">Elige tu avatar</legend>
        <div className="grid grid-cols-4 gap-2">
          {AVATARS.map((a, i) => (
            <label key={a.value} className="cursor-pointer">
              <input type="radio" name="avatar" value={a.value} defaultChecked={i === 0} className="peer sr-only" />
              <span className="block overflow-hidden rounded-xl border-2 border-line bg-bg/40 p-1 text-center transition peer-checked:border-gold peer-checked:bg-gold/10 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan hover:border-[#4a43a0]">
                <span className="relative mx-auto block h-24 w-full overflow-hidden rounded-lg"><Sprite src={asset.avatar(a.value, "e")} alt="" decorative className="absolute left-1/2 top-0 !h-auto !max-w-none w-[150%] -translate-x-1/2" /></span>
                <span className="block pb-1 text-sm font-bold">{a.name}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="hint">Podrás cambiarlo cuando quieras desde tu perfil.</p>
      </fieldset>

      <div>
        <label htmlFor="displayName" className="label">Nombre de aventurero</label>
        <input id="displayName" name="displayName" required minLength={2} maxLength={24} autoComplete="nickname" className="input" placeholder="Por ejemplo: Luna del Norte" />
        <p className="hint mt-1.5">Es el nombre que verás en el juego. Mejor no uses tu apellido.</p>
      </div>

      <div>
        <label htmlFor="email" className="label">Correo electrónico</label>
        <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" className="input" placeholder="tu@correo.com" />
        {role === "estudiante" && <p className="hint mt-1.5">Si eres menor de edad, usa el correo de tu acudiente.</p>}
      </div>

      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <PasswordField autoComplete="new-password" onChange={setPassword} describedBy="password-rules"
          pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,72}" title="Al menos 8 caracteres, con letras y números" />
        <ul id="password-rules" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="La contraseña necesita">
          {PASSWORD_RULES.map((r) => {
            const ok = r.test(password);
            return (
              <li key={r.id} data-cumple={ok || undefined} className={`flex items-center gap-1.5 transition-colors ${ok ? "text-green" : "text-muted"}`}>
                <span aria-hidden="true" className={`grid size-4 place-items-center rounded-full text-[0.65rem] font-black ${ok ? "bg-green text-bg" : "border border-current"}`}>{ok ? "✓" : ""}</span>
                {r.label}
                <span className="sr-only">{ok ? " (listo)" : " (falta)"}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-bg/40 p-3 text-sm">
        <input type="checkbox" name="consent" required className="mt-1 size-5 shrink-0 accent-[#2ee6d6]" />
        <span>
          Soy mayor de edad, o mi acudiente autoriza que use esta plataforma. He leído la <Link href="/privacidad" className="text-cyan underline underline-offset-4" target="_blank">política de privacidad</Link> y los <Link href="/terminos" className="text-cyan underline underline-offset-4" target="_blank">términos de uso</Link>.
        </span>
      </label>

      <Notice state={state} />
      <Submit pending="Creando tu cuenta…">Crear mi cuenta</Submit>
      <p className="text-center text-sm text-muted">¿Ya tienes cuenta? <Link href="/ingresar" className="font-semibold text-cyan underline underline-offset-4">Ingresa aquí</Link></p>
    </form>
  );
}

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-5">
      {notice === "enlace" && (
        <p role="status" className="rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-sm font-medium text-[#ffe3a0]">Ese enlace ya no es válido. Ingresa con tu correo y contraseña o crea tu cuenta de nuevo.</p>
      )}
      <input type="hidden" name="siguiente" value={next ?? ""} />
      <div>
        <label htmlFor="email" className="label">Correo electrónico</label>
        <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" className="input" placeholder="tu@correo.com" />
      </div>
      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <PasswordField autoComplete="current-password" />
      </div>
      <Notice state={state} />
      <Submit pending="Entrando…">Entrar al gremio</Submit>
      <p className="text-center text-sm text-muted">¿Primera vez aquí? <Link href="/registro" className="font-semibold text-cyan underline underline-offset-4">Crea tu cuenta</Link></p>
    </form>
  );
}
