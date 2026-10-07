// Franja UNEX: acceso al sitio principal y a las otras plataformas, encima de la cabecera de Academy.
//
// Adaptada del encabezado común del sitio principal (unex-education-web, src/components/encabezado/).
// Usa los mismos datos (src/config/productos.ts) y los mismos estados: la plataforma actual marcada y
// las que aún no tienen dirección como "Próximamente". Es más delgada porque debajo va la cabecera de
// Academy con su propio logo, y no repite el enlace "Saltar al contenido" (ya está en layout.tsx).
// No usa JavaScript: en pantallas pequeñas el menú se abre con <details>.
//
// Va en el sitio público y en los paneles de trabajo. En el Gremio no: ahí el acceso está en el pie.
import type { CSSProperties } from "react";
import { productos, sitioPrincipal, type PlataformaId, type Producto } from "@/config/productos";
import styles from "./FranjaUnex.module.css";

const ACTUAL: PlataformaId = "academy";

function Plataforma({ producto }: { producto: Producto }) {
  const colores = {
    "--plataforma": producto.colores.base,
    "--plataforma-claro": producto.colores.claro,
  } as CSSProperties;

  const nombre = (
    <>
      <span className={styles.punto} aria-hidden="true" />
      {producto.nombreCorto}
    </>
  );

  if (!producto.url) {
    return (
      <li style={colores}>
        <span className={styles.inactivo}>
          {nombre}
          <span className={styles.pronto}>Próximamente</span>
        </span>
      </li>
    );
  }

  const actual = producto.id === ACTUAL;
  return (
    <li style={colores}>
      {/* La plataforma actual lleva al inicio de este mismo sitio (también en las vistas previas). */}
      <a href={actual ? "/" : producto.url} className={styles.enlace} aria-current={actual ? "page" : undefined}>
        {nombre}
      </a>
    </li>
  );
}

/** ancha: alinea la franja con los paneles de trabajo (max-w-[90rem]) en vez del sitio público (max-w-6xl). */
export function FranjaUnex({ ancha = false }: { ancha?: boolean }) {
  const plataformas = productos.map((p) => <Plataforma key={p.id} producto={p} />);

  return (
    <div className={`${styles.franja} print:hidden`}>
      <div className={`${styles.barra} ${ancha ? styles.ancha : ""}`}>
        <a href={sitioPrincipal.url} className={styles.principal}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/unex-isotipo-negativo.svg" alt="" width={24} height={24} />
          {sitioPrincipal.nombre}
        </a>
        <nav aria-label="Plataformas UNEX">
          <ul className={styles.lista}>{plataformas}</ul>
          <details className={styles.menu}>
            <summary>Plataformas</summary>
            <ul className={styles.panel}>{plataformas}</ul>
          </details>
        </nav>
      </div>
    </div>
  );
}
