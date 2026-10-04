#!/usr/bin/env python3
"""Extrae el dibujo de cada objeto que se viste (cosméticos y focos) desde public/assets/objetos
y genera src/content/wearables.ts para que el servidor lo ponga sobre el avatar.
Los cosméticos ya vienen en coordenadas del avatar (300 × 494); los focos se llevan a la mano."""
import json, os, re
D = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(D, '..')
cat = json.load(open(os.path.join(ROOT, 'public/assets/objetos/catalogo.json'), encoding='utf8'))

def inner_group(s, start):
    """Contenido del <g ...> que empieza en start (equilibrando <g> y </g>)."""
    open_end = s.index('>', start) + 1
    depth, i = 1, open_end
    for m in re.finditer(r'<g[\s>]|</g>', s[open_end:]):
        depth += -1 if m.group(0) == '</g>' else 1
        if depth == 0:
            return s[open_end:open_end + m.start()]
    raise ValueError('grupo sin cerrar')

out = {}
for it in cat['objetos']:
    if it['categoria'] not in ('cosmetico', 'foco'):
        continue
    s = open(os.path.join(ROOT, 'public/assets/objetos', it['archivo']), encoding='utf8').read()
    art = inner_group(s, s.index('<g class="o_art">'))
    if it['categoria'] == 'cosmetico':
        # Quita el transform de la ficha de la tienda: el dibujo queda en coordenadas del avatar.
        m = re.match(r'<g transform="[^"]+">', art)
        art = inner_group(art, 0) if m else art
        # obj_cosmetico_<tipo>_<nombre>: el tipo dice dónde se lleva.
        slot = {'capa': 'capa', 'alas': 'alas', 'aura': 'aura', 'bufanda': 'bufanda', 'gafas': 'gafas', 'sombrero': 'sombrero'}[it['id'].split('_')[2]]
    else:
        slot = 'foco'
        # Ficha de 256 × 256 → en la mano izquierda (106, 312).
        art = f'<g transform="translate(106 312) scale(0.42) translate(-110 -175)">{art}</g>'
    defs = re.search(r'<defs>(.*?)</defs>', s, re.S)
    style = re.search(r'<style>(.*?)</style>', s, re.S).group(1)
    # Solo las reglas propias del dibujo (alas, brillos…), no las de la ficha de la tienda.
    keep = [r for r in re.findall(r'(@keyframes[^{]+\{(?:[^{}]*\{[^}]*\})*[^}]*\}|[^{}@]+\{[^}]*\})', style)
            if not re.search(r'\.o_(art|hl|lock|ring|frame|fx|br)|data-state|data-marco|prefers-reduced|@keyframes o_', r)]
    out[it['id']] = {'slot': slot, 'art': art, 'defs': defs.group(1) if defs else '', 'css': ''.join(keep)}

ts = ('/** Generado por scripts/build_wearables.py desde public/assets/objetos. No editar a mano. */\n'
      'import type { WearSlot } from "@/lib/avatar-look";\n\n'
      'export interface WearableArt { slot: WearSlot; art: string; defs: string; css: string }\n'
      'export const WEARABLE_ART: Record<string, WearableArt> = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
open(os.path.join(ROOT, 'src/content/wearables.ts'), 'w', encoding='utf8').write(ts)
# Lista corta de ids por lugar (va al navegador para el código de la URL; sin dibujos).
order = ['capa', 'alas', 'aura', 'bufanda', 'gafas', 'sombrero', 'foco']
ids = {k: [i for i, v in out.items() if v['slot'] == k] for k in order}
open(os.path.join(ROOT, 'src/content/wearable-ids.ts'), 'w', encoding='utf8').write(
    '/** Generado por scripts/build_wearables.py. No editar a mano. El orden fija el código de la URL. */\n'
    'export const WEARABLE_IDS = ' + json.dumps(ids, ensure_ascii=False, indent=1) + ' as const;\n')
print(len(out), 'objetos;', sum(len(v['art']) for v in out.values()), 'bytes de dibujo')

# Decoración de la Terraza del Hogar: la misma ficha sin el medallón (data-marco="no") para ponerla en la escena.
for it in cat['objetos']:
    if it['categoria'] != 'decoracion':
        continue
    src = os.path.join(ROOT, 'public/assets/objetos', it['archivo'])
    s = open(src, encoding='utf8').read().replace('data-marco="si"', 'data-marco="no"', 1)
    open(src.replace('.svg', '-terraza.svg'), 'w', encoding='utf8').write(s)
