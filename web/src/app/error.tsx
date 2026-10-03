"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="contenido" className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="eyebrow">Algo salió mal</p>
      <h1 className="text-4xl">Un hechizo falló</h1>
      <p className="text-muted">No es tu culpa. Tu avance está a salvo. Puedes intentarlo de nuevo.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">Reintentar</button>
        <Link href="/" className="btn btn-secondary">Ir al inicio</Link>
      </div>
      {error.digest && <p className="text-xs text-muted">Código: {error.digest}</p>}
    </main>
  );
}
