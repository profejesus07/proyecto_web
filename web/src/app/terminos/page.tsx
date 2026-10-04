import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Términos de uso" };

export default function TermsPage() {
  return (
    <LegalPage title="Términos de uso" updated="octubre de 2026">
      <section>
        <h2>Qué es Umbral</h2>
        <p>Umbral es una plataforma educativa en la que los cursos se viven como una aventura. Al usarla aceptas estos términos.</p>
      </section>
      <section>
        <h2>Tu cuenta</h2>
        <ul>
          <li>Debes dar un correo válido y cuidar tu contraseña.</li>
          <li>Si eres menor de edad, necesitas la autorización de tu acudiente.</li>
          <li>Eres responsable de lo que ocurra desde tu cuenta; avísanos si crees que alguien más entró.</li>
        </ul>
      </section>
      <section>
        <h2>Cómo esperamos que uses la plataforma</h2>
        <ul>
          <li>Con respeto: tu nombre de aventurero no puede ser ofensivo ni imitar a otra persona.</li>
          <li>De forma honesta: no intentes alterar tu XP, monedas o notas ni acceder a datos de otras personas.</li>
          <li>Sin dañar el servicio: no intentes sobrecargarlo ni vulnerarlo.</li>
        </ul>
        <p className="mt-3">Podemos suspender cuentas que incumplan estas reglas.</p>
      </section>
      <section>
        <h2>Contenido</h2>
        <p>Los cursos, textos, personajes, ilustraciones y animaciones de Umbral pertenecen a <strong>[NOMBRE DEL TITULAR]</strong>. Puedes usarlos para aprender en la plataforma, pero no copiarlos ni redistribuirlos sin permiso.</p>
      </section>
      <section>
        <h2>Monedas, gemas y objetos</h2>
        <p>Son elementos del juego sin valor en dinero. No se pueden cambiar por dinero ni transferir entre cuentas. Las ayudas de aprendizaje tienen límites para que el juego sea justo.</p>
      </section>
      <section>
        <h2>Cambios y contacto</h2>
        <p>Podemos actualizar estos términos; si el cambio es importante, te avisaremos en la plataforma. Escríbenos a <strong><a href="mailto:jesuspunksaez@gmail.com" className="text-cyan underline underline-offset-4">jesuspunksaez@gmail.com</a></strong> si tienes dudas.</p>
      </section>
    </LegalPage>
  );
}
