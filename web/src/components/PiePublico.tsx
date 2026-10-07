// Pie de las páginas públicas, con la estructura del sitio principal UNEX Education: sobre Cosmos, logo con
// su lema, columnas de enlaces, las plataformas UNEX y la línea legal. El Gremio conserva su pie (footer.tsx).
import Link from "next/link";
import { Logo } from "@/components/logo";
import { productos, sitioPrincipal } from "@/config/productos";
import { SECCIONES_PUBLICAS } from "@/config/secciones-publicas";
import { SUPPORT_EMAIL } from "@/lib/features";
import styles from "./PiePublico.module.css";

const COLUMNAS = [
  { id: "academy", titulo: "UNEX Academy", enlaces: SECCIONES_PUBLICAS.map((s) => [s.href, s.label] as const) },
  { id: "cuenta", titulo: "Tu cuenta", enlaces: [["/ingresar", "Ingresar"], ["/registro", "Crear cuenta"], ["/verificar", "Verificar una constancia"]] as const },
  { id: "legal", titulo: "Legal", enlaces: [["/privacidad", "Privacidad y datos"], ["/terminos", "Términos de uso"]] as const },
];

export function PiePublico() {
  return (
    <footer data-tema="oscuro" className={`${styles.pie} print:hidden`}>
      <div className={styles.contenido}>
        <div className={styles.marca}>
          <Logo size="h-14" />
          <p>Cursos en línea con historia, práctica guiada y constancias verificables.</p>
          <p><a href={`mailto:${SUPPORT_EMAIL}`} className={styles.correo}>{SUPPORT_EMAIL}</a></p>
        </div>

        {COLUMNAS.map((c) => (
          <nav key={c.id} aria-labelledby={`pie-${c.id}`}>
            <h2 id={`pie-${c.id}`} className={styles.titulo}>{c.titulo}</h2>
            <ul className={styles.lista}>
              {c.enlaces.map(([href, label]) => <li key={href}><Link href={href}>{label}</Link></li>)}
            </ul>
          </nav>
        ))}

        <nav aria-labelledby="pie-plataformas">
          <h2 id="pie-plataformas" className={styles.titulo}>Plataformas UNEX</h2>
          <ul className={styles.lista}>
            <li><a href={sitioPrincipal.url}>{sitioPrincipal.nombre}</a></li>
            {productos.filter((p) => p.id !== "academy").map((p) => (
              <li key={p.id}>
                {p.url ? <a href={p.url}>{p.nombre}</a> : (
                  <span className={styles.inactivo}>{p.nombre} <span className={styles.pronto}>(próximamente)</span></span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className={styles.legal}>© {new Date().getFullYear()} UNEX Academy · Mgtr. Jesús David Álvarez Sáez. Todos los derechos reservados.</p>
    </footer>
  );
}
