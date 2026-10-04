"use client";

export function PrintButton({ children = "Descargar PDF / imprimir" }: { children?: React.ReactNode }) {
  return <button type="button" className="btn btn-primary" onClick={() => window.print()}>{children}</button>;
}
