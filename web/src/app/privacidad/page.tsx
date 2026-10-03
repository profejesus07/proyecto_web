import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Privacidad y datos" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacidad y datos" updated="octubre de 2026">
      <section>
        <h2>Quién es el responsable</h2>
        <p>El responsable del tratamiento de los datos es <strong>[NOMBRE DEL RESPONSABLE]</strong>. Puedes escribirnos a <strong>[CORREO DE CONTACTO]</strong> para cualquier consulta sobre tus datos.</p>
      </section>
      <section>
        <h2>Qué datos guardamos</h2>
        <ul>
          <li><strong>Correo electrónico y contraseña</strong>, para que puedas ingresar. La contraseña se guarda cifrada y nadie del equipo puede verla.</li>
          <li><strong>Nombre de aventurero</strong>, que eliges tú. Te pedimos no usar apellidos ni datos que identifiquen a un menor.</li>
          <li><strong>Tu avance en el juego</strong>: misiones completadas, notas, XP, monedas, objetos y racha.</li>
          <li><strong>Tu rol</strong> (estudiante, docente o familia) y la fecha en que aceptaste esta política.</li>
        </ul>
        <p className="mt-3">No pedimos fotos, ubicación, teléfono, documento de identidad ni datos de salud. No hay chat público ni mensajes entre usuarios.</p>
      </section>
      <section>
        <h2>Para qué los usamos</h2>
        <ul>
          <li>Crear y mantener tu cuenta.</li>
          <li>Guardar tu avance y mostrártelo en tu perfil.</li>
          <li>Mejorar los cursos y corregir errores.</li>
        </ul>
        <p className="mt-3">No vendemos tus datos ni los usamos para publicidad.</p>
      </section>
      <section>
        <h2>Niñas, niños y adolescentes</h2>
        <p>Si eres menor de edad, tu acudiente debe autorizar el uso de la plataforma. Por eso, al crear la cuenta se pide confirmar que eres mayor de edad o que cuentas con esa autorización. Te recomendamos usar el correo de tu acudiente.</p>
        <p className="mt-3">Los datos de menores se tratan únicamente para el funcionamiento educativo de la plataforma y respetando su interés superior.</p>
      </section>
      <section>
        <h2>Quién más ve tus datos</h2>
        <p>Tu perfil es privado: otros estudiantes no ven tu avance. Usamos <strong>Supabase</strong> para guardar los datos y autenticar a las personas, y <strong>Vercel</strong> para publicar el sitio. Ambos actúan como proveedores y tratan los datos solo para prestar ese servicio.</p>
      </section>
      <section>
        <h2>Tus derechos</h2>
        <p>Puedes conocer, actualizar, rectificar y pedir que eliminemos tus datos, o revocar tu autorización, escribiendo a <strong>[CORREO DE CONTACTO]</strong>. Responderemos en los plazos que establece la normativa colombiana de protección de datos personales (Ley 1581 de 2012 y sus decretos).</p>
      </section>
      <section>
        <h2>Cuánto tiempo los guardamos</h2>
        <p>Mientras tu cuenta esté activa. Si pides eliminarla, borramos tus datos personales y tu avance, salvo lo que la ley nos obligue a conservar.</p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>Usamos solo las cookies necesarias para mantener tu sesión iniciada. No usamos cookies de publicidad ni de seguimiento.</p>
      </section>
    </LegalPage>
  );
}
