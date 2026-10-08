// Franja Cosmos con el título de una página pública, como la portada del inicio: antetítulo, título, entradilla,
// acciones y, a un lado, una ilustración del mundo.
import styles from "./FranjaPortada.module.css";

export function FranjaPortada({ id, antetitulo, titulo, children, acciones, ilustracion }: {
  id: string; antetitulo: string; titulo: string; children: React.ReactNode; acciones?: React.ReactNode; ilustracion?: React.ReactNode;
}) {
  return (
    <section data-tema="oscuro" aria-labelledby={id} className={styles.franja}>
      <div className={`${styles.contenido} ${ilustracion ? styles.conIlustracion : ""}`}>
        <div>
          <p className="eyebrow">{antetitulo}</p>
          <h1 id={id} className="mt-2">{titulo}</h1>
          <div className={styles.entradilla}>{children}</div>
          {acciones && <div className="mt-7 flex flex-wrap gap-3">{acciones}</div>}
        </div>
        {ilustracion && <div className={styles.ilustracion}>{ilustracion}</div>}
      </div>
    </section>
  );
}
