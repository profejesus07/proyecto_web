import type { Metadata } from "next";
import { HomeBold } from "@/components/home/home-bold";
import { loadCatalog } from "@/lib/data/queries";

// Portada alternativa en prueba: no se indexa.
export const metadata: Metadata = { title: "Diseño atrevido (prueba)", robots: { index: false, follow: false } };
export const revalidate = 600;

export default async function DisenoAtrevido() {
  return <HomeBold catalog={await loadCatalog()} />;
}
