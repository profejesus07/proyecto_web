import { HomeClaro } from "@/components/home/home-claro";
import { loadCatalog } from "@/lib/data/queries";

// El catálogo se vuelve a leer cada 10 minutos.
export const revalidate = 600;

// Portada en prueba: el Gremio en modo claro. Las otras dos siguen en /disenos/atrevido y /disenos/sobrio.
export default async function Home() {
  return <HomeClaro catalog={await loadCatalog()} />;
}
