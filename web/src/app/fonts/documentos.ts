import localFont from "next/font/local";

/*
 * Fuentes de los documentos. Solo las importan la constancia y el diploma, así que se precargan
 * únicamente en esas páginas y no en todo el sitio (el resto usa Unbounded y Lexend, en layout.tsx).
 */

/** Fraunces: títulos y nombre de la constancia de asistencia (licencia OFL). */
export const fraunces = localFont({
  src: "./fraunces.woff2",
  variable: "--font-serif",
  weight: "400 700",
  display: "swap",
});

/**
 * DM Sans: texto de las constancias emitidas con la marca anterior y del diploma «Sello del Portal».
 * La variable se llama --font-body porque así la usa la plantilla del diploma (content/diploma-svg.ts).
 */
export const dmSans = localFont({
  src: "./dmsans.woff2",
  variable: "--font-body",
  weight: "100 1000",
  display: "swap",
});

/**
 * Bricolage Grotesque: títulos del diploma «Sello del Portal», que es arte del mundo y conserva su
 * tipografía. La plantilla la pide como --font-display; esta variable solo existe dentro del diploma.
 */
export const bricolage = localFont({
  src: "./bricolage.woff2",
  variable: "--font-display",
  weight: "200 800",
  display: "swap",
});
