import catalogJson from "../../public/assets/objetos/catalogo.json";
import { aidByItem } from "@/lib/game/aids";

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

/**
 * Categorías que se venden en la tienda: solo lo que ya hace algo en el juego.
 * Ayudas (Pista y 50/50, ver lib/game/aids.ts), lo que se viste en el Vestidor (cosméticos y focos),
 * marcos del retrato, compañeros y decoración para la Terraza del Hogar de su familia.
 * Poderes y piezas sueltas de equipo esperan a tener uso.
 */
export const SHOP_CATEGORIES = ["ayuda", "cosmetico", "foco", "marco", "companero", "decoracion"] as const;

export function shopItems(): CatalogItem[] {
  return items.filter((i) => priceOf(i) !== null && (SHOP_CATEGORIES as readonly string[]).includes(i.categoria) && (i.categoria !== "ayuda" || !!aidByItem(i.id)));
}

export function isForSale(item: CatalogItem): boolean {
  return shopItems().some((i) => i.id === item.id);
}

export function itemImage(item: CatalogItem): string {
  return `/assets/objetos/${item.archivo}`;
}

/** Nombre corto de un título: «Título «Constructor»» → «Constructor». */
export function titleLabel(id: string | undefined): string | null {
  const item = id ? getItem(id) : undefined;
  if (!item || item.categoria !== "titulo") return null;
  return item.nombre.match(/«(.+)»/)?.[1] ?? item.nombre;
}

/** Imagen del compañero. Las pieles de Kuro crecen con el rango: cachorro (E-D), joven (C-B), majestuoso (A-S). */
export function petImage(id: string | undefined, rank: string): string | null {
  const item = id ? getItem(id) : undefined;
  if (!item || item.categoria !== "companero") return null;
  if (!item.id.startsWith("obj_companero_kuro_")) return itemImage(item);
  const stage = "ED".includes(rank) ? "cachorro" : "CB".includes(rank) ? "joven" : "majestuoso";
  return `/assets/objetos/companero/${item.id}-${stage}.svg`;
}
