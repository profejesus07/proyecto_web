import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AlturasFijas } from "@/components/alturas-fijas";
import { PageTransition } from "@/components/page-transition";
import { SITE_NAME } from "@/lib/env";

// Tipografía UNEX (manual de marca): Unbounded para títulos y Lexend para el texto. Archivos
// variables locales, subconjunto latín (licencia OFL; ver fonts/OFL-*.txt). Las fuentes de la
// constancia y del diploma están en fonts/documentos.ts y solo se cargan en esas páginas.
const unbounded = localFont({
  src: "./fonts/unbounded.woff2",
  variable: "--font-unbounded",
  weight: "200 900",
  display: "swap",
});
const lexend = localFont({
  src: "./fonts/lexend.woff2",
  variable: "--font-lexend",
  weight: "100 900",
  display: "swap",
});

const base = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: "UNEX Academy, la plataforma de cursos cortos de UNEX Education: lecciones breves, práctica con retroalimentación inmediata y constancias verificables. La primera lección es gratis.",
  applicationName: SITE_NAME,
  openGraph: { type: "website", locale: "es_CO", siteName: SITE_NAME, title: SITE_NAME, description: "Cursos cortos y clases en línea que se viven como una aventura. Una plataforma de UNEX Education." },
  robots: { index: true, follow: true },
};

// themeColor = --bg de globals.css (#0D0F2B): la barra del navegador en el celular continúa el fondo.
export const viewport: Viewport = { themeColor: "#0D0F2B", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${unbounded.variable} ${lexend.variable}`}>
      <body>
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <PageTransition />
        <AlturasFijas />
        {children}
      </body>
    </html>
  );
}
