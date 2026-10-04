"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveIssuerSettingsAction } from "@/app/actions/certificates";
import type { IssuerSettings } from "@/lib/data/types";

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>{pending ? "Guardando…" : "Guardar datos del responsable"}</button>;
}

/** Datos de quien firma las constancias y su firma (imagen PNG, idealmente con fondo transparente). */
export function IssuerSettingsForm({ settings }: { settings: IssuerSettings }) {
  const [state, action] = useActionState(saveIssuerSettingsAction, undefined);
  const [signature, setSignature] = useState(settings.signaturePng ?? "");
  const [fileError, setFileError] = useState<string | null>(null);

  function onFile(file: File | undefined) {
    setFileError(null);
    if (!file) return;
    if (file.type !== "image/png") return setFileError("La firma debe ser una imagen PNG.");
    if (file.size > 280_000) return setFileError("La imagen pesa demasiado. Usa una de menos de 250 KB.");
    const reader = new FileReader();
    reader.onload = () => setSignature(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1"><span className="label">Nombre de quien firma</span>
          <input name="issuerName" required defaultValue={settings.issuerName ?? "Mgtr. Jesús David Álvarez Sáez"} maxLength={120} className="input" />
        </label>
        <label className="block space-y-1"><span className="label">Cargo o título (opcional)</span>
          <input name="issuerTitle" defaultValue={settings.issuerTitle ?? ""} maxLength={160} placeholder="Responsable de la Academia Virtual Umbral" className="input" />
        </label>
        <label className="block space-y-1"><span className="label">Documento (opcional, no se muestra)</span>
          <input name="issuerDoc" defaultValue={settings.issuerDoc ?? ""} maxLength={40} className="input" />
        </label>
        <label className="block space-y-1"><span className="label">Ciudad de expedición</span>
          <input name="city" required defaultValue={settings.city ?? ""} maxLength={80} placeholder="Bogotá D. C." className="input" />
        </label>
      </div>
      <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
        <label className="block space-y-1"><span className="label">Firma (PNG, fondo transparente o blanco)</span>
          <input type="file" accept="image/png" onChange={(e) => onFile(e.target.files?.[0])} className="input file:mr-3 file:rounded-lg file:border-0 file:bg-cyan/20 file:px-3 file:py-1 file:text-cyan" />
          <span className="hint block">Firma con tinta negra en papel blanco, tómale una foto bien iluminada y recórtala; o firma en una app y expórtala como PNG.</span>
        </label>
        <div className="grid h-24 w-56 place-items-center rounded-xl bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {signature ? <img src={signature} alt="Vista previa de la firma" className="max-h-20 w-auto object-contain" /> : <span className="text-sm text-[#5b5788]">Sin firma</span>}
        </div>
      </div>
      <input type="hidden" name="signaturePng" value={signature} />
      <div aria-live="polite">
        {fileError && <p role="alert" className="text-sm font-medium text-[#ffb3b3]">{fileError}</p>}
        {state?.error && <p role="alert" className="text-sm font-medium text-[#ffb3b3]">{state.error}</p>}
        {state?.message && <p role="status" className="text-sm font-medium text-green">{state.message}</p>}
      </div>
      <Submit />
    </form>
  );
}
