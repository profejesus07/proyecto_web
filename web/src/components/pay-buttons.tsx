"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { startPaymentAction } from "@/app/actions/payments";
import type { PaymentProvider } from "@/lib/data/types";

export interface PayOption { id: PaymentProvider; label: string }

const METHODS: Record<PaymentProvider, string> = {
  wompi: "PSE, Nequi, tarjeta o botón Bancolombia",
  mercadopago: "Tarjeta, PSE, Efecty o saldo de Mercado Pago",
};

function Submit({ label, primary }: { label: string; primary: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn w-full ${primary ? "btn-primary" : "btn-secondary"}`} disabled={pending} aria-busy={pending}>
      {pending ? "Abriendo el pago…" : `Pagar con ${label}`}
    </button>
  );
}

/** Botones para pagar un curso. El valor lo pone el servidor; aquí solo se elige la pasarela. */
export function PayButtons({ course, student, options, test }: { course: string; student?: string; options: PayOption[]; test: boolean }) {
  const [state, action] = useActionState(startPaymentAction, undefined);
  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${options.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {options.map((o, i) => (
          <form key={o.id} action={action} className="space-y-1.5 rounded-xl border border-line bg-bg/40 p-3">
            <input type="hidden" name="course" value={course} />
            <input type="hidden" name="provider" value={o.id} />
            {student && <input type="hidden" name="student" value={student} />}
            <Submit label={o.label} primary={i === 0} />
            <p className="text-center text-xs text-muted">{METHODS[o.id]}</p>
          </form>
        ))}
      </div>
      {test && <p className="text-center text-xs font-semibold text-gold">🧪 Modo de prueba: no se cobra dinero real.</p>}
      <div aria-live="polite">{state?.error && <p role="alert" className="text-sm font-medium text-err">{state.error}</p>}</div>
    </div>
  );
}
