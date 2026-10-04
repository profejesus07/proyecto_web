import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Términos de uso" };

export default function TermsPage() {
  return (
    <LegalPage title="Términos de uso" updated="octubre de 2026">
      <section>
        <h2>Qué es la Academia Virtual Umbral</h2>
        <p>La Academia Virtual Umbral es una plataforma educativa en la que los cursos se viven como una aventura. Al usarla aceptas estos términos.</p>
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
        <p>Los cursos, textos, personajes, ilustraciones y animaciones de la Academia Virtual Umbral pertenecen a <strong>Mgtr. Jesús David Álvarez Sáez</strong>. Puedes usarlos para aprender en la plataforma, pero no copiarlos ni redistribuirlos sin permiso.</p>
      </section>
      <section>
        <h2>Cursos gratuitos y de pago</h2>
        <ul>
          <li>Crear una cuenta es gratis, y la primera lección de cada curso también.</li>
          <li>Para continuar con el resto de un curso hay que suscribirse a ese curso. Su precio se muestra antes de suscribirte, en pesos colombianos.</li>
          <li>Puedes pagar en línea con <strong>Wompi</strong> o <strong>Mercado Pago</strong>; el estudiante o su familia vinculada pueden hacer el pago. El curso se activa apenas la pasarela confirma el pago. Un curso corto queda sin vencimiento y una clase, hasta el fin de su año lectivo.</li>
          <li>La Academia Virtual Umbral no ve ni guarda los datos de tu tarjeta ni las claves de tu banco: los recibe directamente la pasarela.</li>
          <li>Si un pago se anula o se reembolsa, se retira el acceso que dio ese pago. Puedes ejercer el derecho de retracto y pedir la reversión del pago en los términos de la Ley 1480 de 2011 (Estatuto del Consumidor), escribiendo al correo de contacto con la referencia del pago.</li>
          <li>También puedes acordar el pago por correo; en ese caso, el acceso se activa a mano y su duración se informa al activarlo.</li>
          <li>Tu avance se conserva: si te suscribes después, sigues donde quedaste.</li>
        </ul>
      </section>
      <section>
        <h2>Monedas, gemas y objetos</h2>
        <p>Son elementos del juego sin valor en dinero. No se pueden cambiar por dinero ni transferir entre cuentas. Las ayudas de aprendizaje tienen límites para que el juego sea justo.</p>
      </section>
      <section>
        <h2>Cambios y contacto</h2>
        <p>Podemos actualizar estos términos; si el cambio es importante, te avisaremos en la plataforma. Escríbenos a <strong><a href="mailto:profejesus365@gmail.com" className="text-cyan underline underline-offset-4">profejesus365@gmail.com</a></strong> si tienes dudas.</p>
      </section>
    </LegalPage>
  );
}
