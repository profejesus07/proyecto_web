import type { Viewport } from "next";

// Páginas públicas (tema claro con encabezado Cosmos): la barra del navegador en celular va en Cosmos, como el
// encabezado. Cada página pública lo exporta como `viewport`; el Gremio conserva el de app/layout.tsx.
export const VIEWPORT_PUBLICO: Viewport = { themeColor: "#15173F", colorScheme: "light" };
