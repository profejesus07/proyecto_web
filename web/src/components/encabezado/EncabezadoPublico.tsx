// Encabezado de las páginas públicas de UNEX Academy, como el del sitio principal UNEX Education:
// una sola barra Cosmos, sólida y no fija. Logo, secciones, selector de plataformas (Academy marcada),
// Ingresar y Crear cuenta. Reúne lo que antes hacían la franja UNEX y la cabecera pública.
//
// Celular y tableta (hasta 1079 px): logo, «Ingresar» siempre visible (los estudiantes que vuelven lo usan a
// diario) y un menú con las secciones, «Crear cuenta» y las plataformas. Escritorio: todo en la barra.
// La consola y el panel docente siguen con FranjaUnex.
import Link from "next/link";
import type { CSSProperties } from "react";
import { Logo } from "@/components/logo";
import { productos, sitioPrincipal, type Producto } from "@/config/productos";
import { Desplegable } from "./Desplegable";
import { NavSecciones } from "./NavSecciones";
import styles from "./EncabezadoPublico.module.css";

function Plataforma({ producto }: { producto: Producto }) {
  const colores = { "--plataforma": producto.colores.base, "--plataforma-claro": producto.colores.claro } as CSSProperties;
  const nombre = <><span className={styles.punto} aria-hidden="true" />{producto.nombre}</>;
  if (!producto.url) {
    return (
      <li style={colores}>
        <span className={styles.inactivo}>{nombre}<span className={styles.pronto}>Próximamente</span></span>
      </li>
    );
  }
  const actual = producto.id === "academy";
  return (
    <li style={colores}>
      {/* Academy lleva al inicio de este mismo sitio (también en las vistas previas). */}
      <a href={actual ? "/" : producto.url} className={styles.plataforma} aria-current={actual ? "page" : undefined}>{nombre}</a>
    </li>
  );
}

/** El sitio principal y las cuatro plataformas UNEX. */
function PlataformasUnex() {
  return (
    <ul className={styles.plataformas} aria-label="Plataformas UNEX">
      <li><a href={sitioPrincipal.url} className={styles.plataforma}>{sitioPrincipal.nombre}</a></li>
      {productos.map((p) => <Plataforma key={p.id} producto={p} />)}
    </ul>
  );
}

export function EncabezadoPublico() {
  return (
    <header data-tema="oscuro" className={`${styles.encabezado} print:hidden`}>
      <div className={styles.barra}>
        <Logo href="/" compact size="h-14" />
        <NavSecciones className={styles.soloEscritorio} />
        <div className={styles.acciones}>
          <Desplegable className={`${styles.desplegable} ${styles.soloEscritorio}`} claseResumen={styles.resumen} resumen="Plataformas">
            <div className={styles.panel}><PlataformasUnex /></div>
          </Desplegable>
          <Link href="/ingresar" className="btn btn-secondary btn-sm">Ingresar</Link>
          <Link href="/registro" className={`btn btn-primary btn-sm ${styles.soloEscritorio}`}>Crear cuenta</Link>
          <Desplegable className={`${styles.desplegable} ${styles.soloCelular}`} claseResumen={styles.resumen} resumen="Menú">
            <div className={`${styles.panel} ${styles.panelMenu}`}>
              <NavSecciones columna />
              <Link href="/registro" className="btn btn-primary w-full">Crear cuenta</Link>
              <p className={styles.tituloPanel}>Plataformas UNEX</p>
              <PlataformasUnex />
            </div>
          </Desplegable>
        </div>
      </div>
    </header>
  );
}
