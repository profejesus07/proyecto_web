/**
 * Personalizador del avatar: colores de piel, cabello, ojos y ropa, y el atuendo de rango.
 *
 * Los SVG de los avatares traen colores fijos. Para no duplicar 4 × 6 × N archivos, el
 * servidor sustituye los colores de cada grupo (piel, cabello…) al vuelo. Las sombras y
 * luces se conservan: se aplica al color nuevo la misma diferencia de luminosidad que
 * tenía cada tono original respecto al color principal del grupo.
 *
 * El aspecto viaja en la URL de la imagen como un código corto («s2h5e1»), así el SVG se
 * puede cachear en la CDN y se sigue usando como <img> (con sus animaciones).
 */
import type { AvatarBase } from "@/lib/data/types";
import { RANKS, type RankKey } from "@/lib/game/ranks";
import { HAIRSTYLES, applyHairstyle } from "@/lib/avatar-hair";
import { clamp, hexToHsl, hslToHex } from "@/lib/color";

export interface Swatch { name: string; color: string }
export interface EyeSwatch { name: string; stops: [string, string, string] }

export const SKIN: readonly Swatch[] = [
  { name: "Porcelana", color: "#F3D2B6" },
  { name: "Clara", color: "#E4B48E" },
  { name: "Trigueña", color: "#C68E5E" },
  { name: "Canela", color: "#A86E44" },
  { name: "Morena", color: "#7A4A2B" },
  { name: "Ébano", color: "#4E2E1C" },
];

export const HAIR: readonly Swatch[] = [
  { name: "Negro", color: "#211D2C" },
  { name: "Castaño oscuro", color: "#4A2A1A" },
  { name: "Castaño", color: "#7A4A2A" },
  { name: "Pelirrojo", color: "#B4482A" },
  { name: "Rubio", color: "#E2B85A" },
  { name: "Plateado", color: "#BFC5D6" },
  { name: "Azul", color: "#2F6BFF" },
  { name: "Morado", color: "#7A4EF0" },
  { name: "Rosa", color: "#F06AB0" },
  { name: "Menta", color: "#2EC8A0" },
];

export const EYES: readonly EyeSwatch[] = [
  { name: "Café", stops: ["#B27A4E", "#6B4426", "#2A140A"] },
  { name: "Miel", stops: ["#F0D47A", "#B08A2E", "#5A3E10"] },
  { name: "Verde", stops: ["#A8E59A", "#3E9A4A", "#13421E"] },
  { name: "Azul", stops: ["#A6CCFF", "#3A78D8", "#12305E"] },
  { name: "Gris", stops: ["#DCE1EA", "#8A94A8", "#3A4152"] },
  { name: "Violeta", stops: ["#D6BCFF", "#8A5CFF", "#3A1E7A"] },
];

export const TOP: readonly Swatch[] = [
  { name: "Añil", color: "#2B2678" },
  { name: "Arena", color: "#F1E4C3" },
  { name: "Naranja", color: "#E8853A" },
  { name: "Rojo", color: "#C8364A" },
  { name: "Bosque", color: "#2F8F5B" },
  { name: "Cielo", color: "#3A8FD8" },
  { name: "Lavanda", color: "#9A7BE0" },
  { name: "Grafito", color: "#3A3F4E" },
];

export const PANTS: readonly Swatch[] = [
  { name: "Noche", color: "#1E1B4B" },
  { name: "Negro", color: "#1A1A22" },
  { name: "Gris", color: "#5A6070" },
  { name: "Jean", color: "#2E5A8E" },
  { name: "Café", color: "#5A3A26" },
  { name: "Oliva", color: "#4A5A2A" },
];

/** Atuendos de rango: cada rango alcanzado deja vestir su equipo (o uno anterior). */
export const GEAR: Record<RankKey, string> = {
  E: "Ropa de aprendiz",
  D: "Capa del explorador",
  C: "Hombreras de cazador",
  B: "Manto arcano",
  A: "Alas de élite",
  S: "Armadura de leyenda",
};

export interface AvatarLook {
  skin?: number;
  hair?: number;
  eyes?: number;
  top?: number;
  pants?: number;
  /** Peinado (índice en HAIRSTYLES); sin valor, el del personaje. */
  style?: number;
  /** Atuendo de rango elegido (si no, el del rango actual). */
  gear?: RankKey;
}

const SLOTS = [
  ["s", "skin", SKIN.length],
  ["h", "hair", HAIR.length],
  ["e", "eyes", EYES.length],
  ["t", "top", TOP.length],
  ["p", "pants", PANTS.length],
  ["y", "style", HAIRSTYLES.length],
] as const;

const RANK_KEYS = RANKS.map((r) => r.key);
const rankIndex = (k: string) => RANK_KEYS.indexOf(k.toUpperCase() as RankKey);

/** Limpia un aspecto que llega de la base de datos o de un formulario. */
export function sanitizeLook(raw: unknown): AvatarLook {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: AvatarLook = {};
  for (const [, key, len] of SLOTS) {
    const v = r[key];
    if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < len) out[key] = v;
  }
  if (typeof r.gear === "string" && rankIndex(r.gear) >= 0) out.gear = r.gear.toUpperCase() as RankKey;
  return out;
}

/** Código corto de colores para la URL (el atuendo no va aquí: elige el archivo). */
export function encodeColors(look: AvatarLook): string {
  return SLOTS.map(([c, key]) => (look[key] === undefined ? "" : `${c}${look[key]}`)).join("");
}

export function decodeColors(code: string): AvatarLook {
  const out: Record<string, number> = {};
  for (const [c, key] of SLOTS) {
    const m = code.match(new RegExp(`${c}(\\d+)`));
    if (m) out[key] = Number(m[1]);
  }
  return sanitizeLook(out);
}

/** Rango cuyo archivo se dibuja: el atuendo elegido, nunca por encima del rango real. */
export function gearRank(rank: string, look?: AvatarLook): string {
  const real = rankIndex(rank);
  if (!look?.gear || real < 0) return rank;
  return rankIndex(look.gear) <= real ? look.gear : rank;
}

export function canWearGear(gear: RankKey, rank: string): boolean {
  return rankIndex(gear) >= 0 && rankIndex(gear) <= rankIndex(rank);
}

export function avatarSrc(base: string, rank: string, look?: AvatarLook): string {
  const file = `${base}-rango-${gearRank(rank, look).toLowerCase()}-reposo.svg`;
  const code = look ? encodeColors(look) : "";
  return code ? `/avatar/${base}/${file}?c=${code}&v=${LOOK_VERSION}` : `/assets/avatares/${base}/${file}`;
}

/** Súbelo si cambian los SVG o las paletas, para que la CDN no sirva versiones viejas. */
export const LOOK_VERSION = 2;

// ---------------------------------------------------------------------------
// Grupos de color de cada avatar (el primero es el principal del grupo).

interface BasePalette { skin: string[]; hair: string[]; top: string[] }

const PANTS_SRC = ["#1E1B4B", "#16133A"];

export const BASE_PALETTE: Record<AvatarBase, BasePalette> = {
  aria: { skin: ["#C68E5E", "#A8703F", "#8A5A34"], hair: ["#2F6BFF", "#1F4BB5", "#8FB4FF"], top: ["#2B2678", "#3B3694", "#211D5E", "#4A44A8"] },
  leo: { skin: ["#7A4A2B", "#5E3620", "#3E200F"], hair: ["#1B1B3A", "#4A4A8C"], top: ["#F1E4C3", "#D8C79B", "#E3D4AE", "#C9B88A"] },
  tomas: { skin: ["#C99A74", "#A97C58", "#7A5236"], hair: ["#2A1C14", "#5A4030"], top: ["#F1E4C3", "#D8C79B", "#E3D4AE", "#C9B88A"] },
  nuri: { skin: ["#D9A07A", "#BC825C", "#8E5A3A"], hair: ["#7A3A2A", "#5A2618", "#B0644A"], top: ["#E8853A", "#C46A24", "#F09A54", "#B05C1C"] },
};

/** Lleva todo un grupo de tonos al color nuevo, conservando sombras y luces. */
export function shadeGroup(source: string[], target: string): Record<string, string> {
  const [, , l0] = hexToHsl(source[0]);
  const [th, ts, tl] = hexToHsl(target);
  const map: Record<string, string> = {};
  for (const c of source) {
    const [, , l] = hexToHsl(c);
    map[c.toUpperCase()] = c === source[0] ? target.toUpperCase() : hslToHex([th, ts, clamp(tl + (l - l0), 0.04, 0.96)]);
  }
  return map;
}

/** Aplica los colores elegidos a un SVG de avatar. */
export function recolorSvg(svg: string, base: AvatarBase, look: AvatarLook): string {
  const pal = BASE_PALETTE[base];
  const map: Record<string, string> = {};
  if (look.skin !== undefined) Object.assign(map, shadeGroup(pal.skin, SKIN[look.skin].color));
  if (look.hair !== undefined) Object.assign(map, shadeGroup(pal.hair, HAIR[look.hair].color));
  if (look.top !== undefined) Object.assign(map, shadeGroup(pal.top, TOP[look.top].color));
  if (look.pants !== undefined) Object.assign(map, shadeGroup(PANTS_SRC, PANTS[look.pants].color));

  // Solo atributos fill/stroke: los degradados (stop-color) de efectos y auras no se tocan.
  let out = svg.replace(/\b(fill|stroke)="(#[0-9A-Fa-f]{6})"/g, (m, attr: string, hex: string) => {
    const to = map[hex.toUpperCase()];
    return to ? `${attr}="${to}"` : m;
  });

  if (look.eyes !== undefined) {
    const stops = EYES[look.eyes].stops;
    out = out.replace(/(<radialGradient id="av-iris"[^>]*>)([\s\S]*?)(<\/radialGradient>)/, (_m, open: string, inner: string, close: string) => {
      let i = 0;
      return open + inner.replace(/stop-color="#[0-9A-Fa-f]{6}"/g, (s) => (i < 3 ? `stop-color="${stops[i++]}"` : s)) + close;
    });
  }

  // El peinado va al final: sus colores ya salen calculados y no deben volver a sustituirse.
  if (look.style !== undefined) {
    out = applyHairstyle(out, HAIRSTYLES[look.style], look.hair !== undefined ? HAIR[look.hair].color : pal.hair[0]);
  }
  return out;
}
