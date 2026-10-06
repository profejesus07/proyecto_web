"use client";

import { Icon } from "@/components/icons";

export function PrintButton({ children = "Descargar PDF / imprimir", className = "btn btn-primary" }: { children?: React.ReactNode; className?: string }) {
  return <button type="button" className={className} onClick={() => window.print()}><Icon name="printer" className="size-4" />{children}</button>;
}
