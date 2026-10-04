import "server-only";
import { WEARABLE_ART } from "@/content/wearables";
import { groupEnd } from "@/lib/avatar-hair";
import type { AvatarLook, WearSlot } from "@/lib/avatar-look";
import type { AvatarBase } from "@/lib/data/types";

/**
 * Pone sobre el SVG del avatar los objetos de la tienda que lleva puestos.
 * Los dibujos vienen del catálogo en coordenadas del avatar (ver scripts/build_wearables.py):
 *  - detrás del cuerpo (antes del cabello de atrás): aura, alas y capa;
 *  - delante del cuerpo (antes de la cabeza): bufanda y foco en la mano;
 *  - dentro de la cabeza (se mueven con ella): gafas y sombrero.
 */
const BACK: WearSlot[] = ["aura", "alas", "capa"];
const BODY: WearSlot[] = ["bufanda", "foco"];
const HEAD: WearSlot[] = ["gafas", "sombrero"];

function layer(slots: WearSlot[], look: AvatarLook): { svg: string; css: string } {
  let svg = "", css = "";
  for (const slot of slots) {
    const id = look.wear?.[slot];
    const w = id ? WEARABLE_ART[id] : undefined;
    if (!w || w.slot !== slot) continue;
    const defs = w.art.includes("url(#") && w.defs ? `<defs>${w.defs}</defs>` : "";
    svg += `<g class="ob" data-wear="${slot}">${defs}${w.art}</g>`;
    css += w.css;
  }
  return { svg, css };
}

export function applyWearables(svg: string, base: AvatarBase, look: AvatarLook): string {
  if (!look.wear || !Object.keys(look.wear).length) return svg;
  const back = layer(BACK, look), body = layer(BODY, look), head = layer(HEAD, look);
  let out = svg;

  const hd = out.indexOf('<g class="av-hd">');
  const hdEnd = hd >= 0 ? groupEnd(out, hd) : -1;
  if (head.svg && hdEnd > 0) out = out.slice(0, hdEnd) + head.svg + out.slice(hdEnd);

  const headStart = out.indexOf('<g class="av-head">');
  if (body.svg && headStart > 0) out = out.slice(0, headStart) + body.svg + out.slice(headStart);

  const hairb = out.indexOf('<g class="av-hairb">');
  if (back.svg && hairb > 0) {
    // Con Tomás, lo de la espalda llega solo hasta el asiento para no tapar la silla.
    const clip = base === "tomas" ? '<clipPath id="av-wclip"><rect x="0" y="0" width="300" height="330"/></clipPath>' : "";
    const wrapped = clip ? `${clip}<g clip-path="url(#av-wclip)">${back.svg}</g>` : back.svg;
    out = out.slice(0, hairb) + wrapped + out.slice(hairb);
  }

  const css = back.css + body.css + head.css;
  if (css) out = out.replace("</style>", `${css}</style>`);
  return out;
}
