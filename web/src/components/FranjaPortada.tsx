// Franja Cosmos con el título de una página pública, como la portada del inicio: ruta (opcional), antetítulo,
// título, entradilla, acciones y, a un lado, una ilustración del mundo. La usan Cursos, la ficha de cada curso,
// Cómo se juega y Familias y docentes.
import styles from "./FranjaPortada.module.css";

/** amplia: el ancho de las páginas con rejilla de tarjetas (Cursos y la ficha, max-w-6xl), para alinear la franja con
 *  el contenido de abajo. */
export function FranjaPortada({ id, ruta, antetitulo, titulo, children, acciones, ilustracion, amplia = false }: {
  id: string; ruta?: React.ReactNode; antetitulo: React.ReactNode; titulo: string; children: React.ReactNode;
  acciones?: React.ReactNode; ilustracion?: React.ReactNode; amplia?: boolean;
}) {
  return (
    <section data-tema="oscuro" aria-labelledby={id} className={styles.franja}>
      <div className={`${styles.contenido} ${ilustracion ? styles.conIlustracion : ""} ${amplia ? styles.amplia : ""}`}>
        <div className="min-w-0">
          {ruta && <div className="mb-6">{ruta}</div>}
          <div className="eyebrow">{antetitulo}</div>
          <h1 id={id} className="mt-2">{titulo}</h1>
          <div className={styles.entradilla}>{children}</div>
          {acciones && <div className="mt-7 flex flex-wrap gap-3">{acciones}</div>}
        </div>
        {ilustracion && <div className={styles.ilustracion}>{ilustracion}</div>}
      </div>
    </section>
  );
}
