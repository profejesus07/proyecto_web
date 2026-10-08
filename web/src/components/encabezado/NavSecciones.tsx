"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECCIONES_PUBLICAS } from "@/config/secciones-publicas";
import styles from "./EncabezadoPublico.module.css";

/** Las secciones del menú público. La actual queda marcada (aria-current) con la estrella de Nova. */
export function NavSecciones({ columna = false, className = "" }: { columna?: boolean; className?: string }) {
  const path = usePathname();
  return (
    <nav aria-label="Secciones" className={className}>
      <ul className={columna ? styles.seccionesColumna : styles.seccionesFila}>
        {SECCIONES_PUBLICAS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className={styles.seccion} aria-current={path === s.href || path.startsWith(`${s.href}/`) ? "page" : undefined}>
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
