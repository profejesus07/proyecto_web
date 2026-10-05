import { HomeSobrio } from "@/components/home/home-sobrio";
import { loadCatalog } from "@/lib/data/queries";

// El catálogo se vuelve a leer cada 10 minutos.
export const revalidate = 600;

// Portada en prueba: la sobria. La atrevida sigue en /disenos/atrevido para comparar.
export default async function Home() {
  return <HomeSobrio catalog={await loadCatalog()} />;
}
