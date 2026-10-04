/**
 * Peinados del Vestidor. Los cuatro avatares comparten el mismo esqueleto de cabeza
 * (cara entre x=112 y x=188, orejas en y≈142, cejas en y≈118), así que cada peinado se
 * dibuja una sola vez y se coloca en lugar del cabello original:
 *  - `back`: va en el grupo «av-hairb», detrás del cuerpo (melenas largas, coletas, moños).
 *  - `front`: va dentro de «av-hd», encima de la cara (flequillo, mechones, trenzas).
 * Las cejas y los audífonos de Nuri se conservan del dibujo original.
 */
import { shift } from "@/lib/color";

export interface HairColors { m: string; d: string; l: string }
export interface Hairstyle {
  id: string;
  name: string;
  group: "masculino" | "femenino";
  back: (c: HairColors) => string;
  front: (c: HairColors) => string;
}

const OUT = 'stroke="#0E0C2B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"';
/** Sombra del lado derecho, como en los dibujos originales. */
const SHADE = "M166 20 C200 80 214 160 216 330 L270 330 L270 20 Z";

/** Masa de cabello: relleno, sombra, luz de borde cian y contorno (mismo estilo que los SVG). */
function mass(id: string, d: string, c: HairColors, extra = ""): string {
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${c.m}"/>`
    + `<g clip-path="url(#${id})"><path d="${SHADE}" fill="${c.d}"/>${extra}`
    + `<path d="${d}" fill="none" stroke="#2EE6D6" stroke-width="9" mask="url(#av-rim)"/></g>`
    + `<path d="${d}" fill="none" ${OUT}/>`;
}

const shine = (c: HairColors, d = "M120 84 C134 73 166 73 180 84 L178 91 C164 81 136 81 122 91 Z") => `<path d="${d}" fill="${c.l}"/>`;
const strands = (c: HairColors, d: string) => `<path d="${d}" fill="none" stroke="${c.d}" stroke-width="2" stroke-linecap="round"/>`;
const circles = (c: HairColors, list: [number, number, number][], sw = 3) =>
  `<g fill="${c.m}" stroke="#0E0C2B" stroke-width="${sw}">${list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`;
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_m, x: string, y: string) => `${300 - Number(x)} ${y}`);

/** Contorno ondulado (afro, rizos): n bultos alrededor de una elipse. */
function scallop(cx: number, cy: number, rx: number, ry: number, n: number, bump: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
    if (i === 0) pts.push(`M${x.toFixed(1)} ${y.toFixed(1)}`);
    else {
      const am = ((i - 0.5) / n) * Math.PI * 2;
      const qx = cx + (rx + bump * 2) * Math.cos(am), qy = cy + (ry + bump * 2) * Math.sin(am);
      pts.push(`Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
  }
  return pts.join(" ") + " Z";
}

/** Trenza: eslabones de arriba abajo, con lazo al final. */
function braid(c: HairColors, x: number, y0: number, links: number, dir: 1 | -1): string {
  let s = "";
  for (let i = 0; i < links; i++) {
    const cx = x - dir * i * 1.2, cy = y0 + i * 17;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="10" ry="11" fill="${i % 2 ? c.d : c.m}" ${OUT.replace("3.5", "3")}/>`
      + `<path d="M${cx - 6} ${cy - 4} Q${cx} ${cy + 3} ${cx + 6} ${cy - 4}" fill="none" stroke="${c.l}" stroke-width="2" stroke-linecap="round"/>`;
  }
  const ex = x - dir * links * 1.2, ey = y0 + links * 17 - 4;
  return s + `<path d="M${ex - 7} ${ey} L${ex + 7} ${ey} L${ex + 9} ${ey + 16} C${ex + 3} ${ey + 20} ${ex - 3} ${ey + 20} ${ex - 9} ${ey + 16} Z" fill="${c.m}" ${OUT.replace("3.5", "3")}/>`
    + `<rect x="${ex - 8}" y="${ey - 4}" width="16" height="6" rx="3" fill="#FF6B6B" stroke="#0E0C2B" stroke-width="2.4"/>`;
}

// Formas que se repiten.
const BOB_BACK = "M104 122 C100 80 130 58 150 58 C172 58 200 80 196 122 L201 188 C191 196 181 194 177 186 L123 186 C119 194 109 196 99 188 Z";
const SWEPT_FRINGE = "M106 136 C98 84 130 58 150 58 C176 58 204 84 194 136 C190 124 186 118 182 114 C182 122 180 128 176 132 C172 118 166 110 158 106 C160 114 158 120 152 124 C150 114 144 108 136 106 C138 114 134 120 126 122 C124 116 120 112 116 110 C116 118 112 126 106 136 Z";
const PULLED_BACK = "M108 132 C102 86 126 62 150 62 C174 62 198 86 192 132 C190 118 186 108 178 102 C166 94 148 94 136 100 C124 104 114 114 108 132 Z";
const CENTER_PART = "M108 134 C102 86 126 62 150 62 C174 62 198 86 192 134 C188 120 182 110 172 104 C162 100 154 102 150 108 C146 102 138 100 128 104 C118 110 112 120 108 134 Z";
const LOCK_L = "M106 128 C100 152 100 192 96 232 C104 240 116 238 122 230 C120 200 117 170 115 142 Z";

export const HAIRSTYLES: readonly Hairstyle[] = [
  // ===== Masculinos =====
  {
    id: "corto", name: "Corto clásico", group: "masculino",
    back: () => "",
    front: (c) => mass("av-hs1", "M108 128 C102 86 126 64 150 64 C174 64 198 86 192 128 C190 118 187 110 182 106 C174 110 162 110 154 104 C146 110 132 112 122 106 C116 110 111 118 108 128 Z", c, strands(c, "M136 70 C140 82 140 94 136 104 M164 70 C168 82 168 94 166 102"))
      + shine(c, "M120 82 C134 72 166 72 180 82 L178 89 C164 80 136 80 122 89 Z"),
  },
  {
    id: "tupe", name: "Tupé", group: "masculino",
    back: () => "",
    front: (c) => mass("av-hs1", "M108 128 C104 98 108 76 124 64 C138 52 166 48 182 58 C196 68 198 94 192 128 C190 116 186 108 180 104 C170 100 156 98 146 100 C134 102 124 104 118 108 C113 113 110 120 108 128 Z", c, strands(c, "M128 70 C144 60 168 60 184 70 M122 84 C142 74 168 74 188 84"))
      + shine(c, "M128 64 C142 55 164 55 176 62 L174 68 C162 62 142 62 130 70 Z"),
  },
  {
    id: "puntas", name: "Puntas de cazador", group: "masculino",
    back: () => "",
    front: (c) => mass("av-hs1", "M108 128 C100 110 98 96 102 84 L88 70 L112 72 L108 48 L130 62 L138 34 L152 58 L168 32 L172 60 L196 46 L190 74 L212 74 L196 92 C200 104 198 116 192 128 C188 116 184 108 178 104 L172 114 L164 102 L152 113 L144 100 L134 111 L128 100 L120 108 C114 112 110 120 108 128 Z", c)
      + shine(c, "M122 80 C136 70 164 70 178 80 L176 87 C162 78 138 78 124 87 Z"),
  },
  {
    id: "rapado", name: "Rapado", group: "masculino",
    back: () => "",
    front: (c) => mass("av-hs1", "M110 126 C106 84 128 70 150 70 C172 70 194 84 190 126 C188 114 184 106 178 102 C166 96 134 96 122 102 C116 106 112 114 110 126 Z", c)
      + shine(c, "M124 82 C138 75 162 75 176 82 L175 87 C162 81 138 81 125 87 Z"),
  },
  {
    id: "rizos-cortos", name: "Rizos cortos", group: "masculino",
    back: (c) => circles(c, [[112, 122, 16], [118, 96, 18], [136, 78, 19], [160, 74, 20], [182, 86, 18], [190, 110, 16]]),
    front: (c) => circles(c, [[116, 114, 10], [126, 100, 13], [143, 92, 14], [160, 92, 14], [176, 100, 13], [185, 114, 10]])
      + `<path d="M122 94 C128 86 138 82 146 84 M154 82 C164 82 172 86 178 94" fill="none" stroke="${c.l}" stroke-width="3" stroke-linecap="round"/>`,
  },
  {
    id: "afro", name: "Afro", group: "masculino",
    back: (c) => mass("av-hs0", scallop(150, 104, 58, 54, 18, 4), c),
    front: (c) => circles(c, [[114, 118, 9], [121, 106, 11], [134, 98, 12], [150, 95, 12], [166, 98, 12], [179, 106, 11], [186, 118, 9]], 2.6)
      + `<path d="M118 70 C132 58 168 58 182 70" fill="none" stroke="${c.l}" stroke-width="3" stroke-linecap="round"/>`,
  },

  // ===== Femeninos =====
  {
    id: "melena", name: "Melena corta", group: "femenino",
    back: (c) => mass("av-hs0", BOB_BACK, c),
    front: (c) => mass("av-hs1", SWEPT_FRINGE, c, strands(c, "M138 64 C144 80 144 96 138 108 M162 64 C168 80 168 96 164 106")) + shine(c),
  },
  {
    id: "larga", name: "Larga lisa", group: "femenino",
    back: (c) => mass("av-hs0", "M102 124 C98 78 126 56 150 56 C174 56 202 78 198 124 L208 258 C198 268 182 266 176 256 L124 256 C118 266 102 268 92 258 Z", c),
    front: (c) => mass("av-hs2", LOCK_L, c) + mass("av-hs3", mirror(LOCK_L), c)
      + mass("av-hs1", SWEPT_FRINGE, c, strands(c, "M138 64 C144 80 144 96 138 108 M162 64 C168 80 168 96 164 106")) + shine(c),
  },
  {
    id: "coleta", name: "Coleta alta", group: "femenino",
    back: (c) => mass("av-hs0", "M168 66 C198 54 224 78 222 122 C220 162 208 198 196 218 C188 202 190 178 190 160 C190 122 186 94 166 80 Z", c,
      strands(c, "M196 90 C206 120 206 160 198 200")),
    front: (c) => mass("av-hs1", PULLED_BACK, c, strands(c, "M130 72 C150 66 166 70 176 80 M124 86 C144 78 166 80 182 92"))
      + shine(c, "M122 80 C136 70 160 68 174 76 L172 83 C158 76 138 78 124 87 Z")
      + `<circle cx="172" cy="70" r="7" fill="#FF6B6B" stroke="#0E0C2B" stroke-width="2.6"/>`,
  },
  {
    id: "trenzas", name: "Dos trenzas", group: "femenino",
    back: (c) => mass("av-hs0", "M104 126 C100 82 128 60 150 60 C172 60 200 82 196 126 Z", c),
    front: (c) => braid(c, 108, 146, 6, 1) + braid(c, 192, 146, 6, -1)
      + mass("av-hs1", CENTER_PART, c, strands(c, "M150 66 L150 106 M136 72 C126 84 118 100 114 120 M164 72 C174 84 182 100 186 120")) + shine(c),
  },
  {
    id: "mono", name: "Moño alto", group: "femenino",
    back: (c) => mass("av-hs0", "M150 22 C164 22 172 32 172 44 C172 56 162 64 150 64 C138 64 128 56 128 44 C128 32 136 22 150 22 Z", c,
      strands(c, "M138 40 C142 30 158 30 162 40 C164 50 150 54 144 46")),
    front: (c) => mass("av-hs1", "M108 132 C102 86 126 62 150 62 C174 62 198 86 192 132 C188 116 180 106 170 102 C158 98 142 98 130 102 C120 106 112 116 108 132 Z", c,
      strands(c, "M150 64 C146 76 146 90 150 100 M132 70 C128 82 124 94 120 106 M168 70 C172 82 176 94 180 106"))
      + `<rect x="134" y="58" width="32" height="8" rx="4" fill="#FF6B6B" stroke="#0E0C2B" stroke-width="2.6"/>`,
  },
  {
    id: "dos-monos", name: "Dos moños", group: "femenino",
    back: (c) => mass("av-hs0", "M112 46 C122 46 130 54 130 64 C130 74 122 82 112 82 C102 82 94 74 94 64 C94 54 102 46 112 46 Z", c, strands(c, "M104 60 C108 52 118 52 120 60"))
      + mass("av-hs4", "M188 46 C198 46 206 54 206 64 C206 74 198 82 188 82 C178 82 170 74 170 64 C170 54 178 46 188 46 Z", c, strands(c, "M180 60 C184 52 194 52 196 60")),
    front: (c) => mass("av-hs1", CENTER_PART, c, strands(c, "M150 66 L150 106")) + shine(c),
  },
];

export function hairColors(main: string): HairColors {
  return { m: main, d: shift(main, -0.12), l: shift(main, 0.2) };
}

/** Busca el </g> que cierra el grupo que empieza en `start`. */
function groupEnd(svg: string, start: number): number {
  let depth = 0;
  const re = /<g[\s>]|<\/g>/g;
  re.lastIndex = start;
  for (let m = re.exec(svg); m; m = re.exec(svg)) {
    depth += m[0] === "</g>" ? -1 : 1;
    if (depth === 0) return m.index;
  }
  return -1;
}

/** Cambia el cabello del SVG por el peinado elegido. Si la estructura no es la esperada, no toca nada. */
export function applyHairstyle(svg: string, style: Hairstyle, main: string): string {
  const c = hairColors(main);
  const hb = svg.indexOf('<g class="av-hairb">');
  const eyes = svg.indexOf('<g class="av-eyes">');
  const hd = svg.indexOf('<g class="av-hd">');
  if (hb < 0 || eyes < 0 || hd < 0) return svg;
  const hbEnd = groupEnd(svg, hb);
  const frontStart = groupEnd(svg, eyes) + 4;
  const frontEnd = groupEnd(svg, hd);
  if (hbEnd < 0 || frontStart < 4 || frontEnd < frontStart || hbEnd > hd) return svg;

  const oldFront = svg.slice(frontStart, frontEnd);
  const brows = oldFront.match(/<path class="av-b[lr]"[^>]*\/>/g)?.join("") ?? "";
  // Audífonos de Nuri: van encima del peinado nuevo.
  const devices = oldFront.match(/<g><path d="M100 136[\s\S]*?<\/g>/)?.[0] ?? "";

  return svg.slice(0, hb) + `<g class="av-hairb">${style.back(c)}`
    + svg.slice(hbEnd, frontStart) + style.front(c) + brows + devices
    + svg.slice(frontEnd);
}
