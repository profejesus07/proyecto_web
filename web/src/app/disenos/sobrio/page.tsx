import type { Metadata } from "next";
import { HomeSobrio } from "@/components/home/home-sobrio";
import { loadCatalog } from "@/lib/data/queries";

// Portada alternativa en prueba: no se indexa.
export const metadata: Metadata = { title: "Diseño sobrio (prueba)", robots: { index: false, follow: false } };
export const revalidate = 600;

export default async function DisenoSobrio() {
  return <HomeSobrio catalog={await loadCatalog()} />;
}
