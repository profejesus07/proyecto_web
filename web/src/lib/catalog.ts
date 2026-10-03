import catalogJson from "../../public/assets/objetos/catalogo.json";

export type Rarity = "comun" | "poco" | "raro" | "epico" | "legendario";

export interface CatalogItem {
  id: string;
  nombre: string;
  categoria: string;
  rareza: Rarity;
  precio: number | string | null;
  desbloqueo: string;
  descripcion: string;
  alt: string;
  archivo: string;
}

export const RARITY: Record<Rarity, { label: string; color: string; order: number }> = {
  comun: { label: "Común", color: "#9AA0B4", order: 0 },
  poco: { label: "Poco común", color: "#4ADE80", order: 1 },
  raro: { label: "Raro", color: "#2EE6D6", order: 2 },
  epico: { label: "Épico", color: "#8A5CFF", order: 3 },
  legendario: { label: "Legendario", color: "#FFC83D", order: 4 },
};

export const CATEGORY_LABEL: Record<string, string> = {
  poder: "Poderes", ayuda: "Ayudas", recurso: "Recursos", interfaz: "Interfaz", cofre: "Cofres",
  recompensa: "Recompensas", insignia: "Insignias", sello: "Sellos de portal", marco: "Marcos", titulo: "Títulos",
  certificado: "Certificado", rango: "Rangos", equipo: "Equipo", cosmetico: "Cosméticos", foco: "Focos mágicos",
  companero: "Compañeros", decoracion: "Decoración",
};

const items = (catalogJson as unknown as { objetos: CatalogItem[] }).objetos;
const byId = new Map(items.map((i) => [i.id, i]));

export function allItems(): readonly CatalogItem[] {
  return items;
}

export function getItem(id: string): CatalogItem | undefined {
  return byId.get(id);
}

/** Precio en monedas si el objeto se puede comprar; null si no. */
export function priceOf(item: CatalogItem): number | null {
  return typeof item.precio === "number" && item.precio > 0 ? item.precio : null;
}

/** Categorías que se venden en la tienda. */
export const SHOP_CATEGORIES = ["poder", "ayuda", "marco", "cosmetico", "foco", "decoracion", "equipo"] as const;

export function shopItems(): CatalogItem[] {
  return items.filter((i) => priceOf(i) !== null && (SHOP_CATEGORIES as readonly string[]).includes(i.categoria));
}

export function itemImage(item: CatalogItem): string {
  return `/assets/objetos/${item.archivo}`;
}
