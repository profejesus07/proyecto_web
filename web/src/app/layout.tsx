import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_NAME } from "@/lib/env";

const display = localFont({
  src: "./fonts/bricolage.woff2",
  variable: "--font-display",
  weight: "200 800",
  display: "swap",
});
const body = localFont({
  src: "./fonts/dmsans.woff2",
  variable: "--font-body",
  weight: "100 1000",
  display: "swap",
});

const base = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: { default: `${SITE_NAME} · Academia digital`, template: `%s · ${SITE_NAME}` },
  description: "Academia digital de cursos cortos y clases: lecciones breves, práctica con retroalimentación inmediata y constancias verificables. La primera lección es gratis.",
  applicationName: SITE_NAME,
  openGraph: { type: "website", locale: "es_CO", siteName: SITE_NAME, title: `${SITE_NAME} · Academia digital`, description: "Cursos cortos y clases en línea que se viven como una aventura." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0f0d2e", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        {children}
      </body>
    </html>
  );
}
