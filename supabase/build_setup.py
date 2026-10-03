#!/usr/bin/env python3
"""Genera una migración por cada curso de supabase/seed/*.json (ver SEEDS),
copia los cursos a web/src/content/ para la vista previa local
y crea supabase/setup.sql (todo en un solo archivo para pegar en el editor SQL de Supabase)."""
import json, uuid, glob, os, shutil
D = os.path.dirname(os.path.abspath(__file__))
NS = uuid.UUID('6f1f6c36-9f0e-4a61-8d3c-0b5f7c2a9e11')
q = lambda s: "'" + str(s).replace("'", "''") + "'"
def build_seed(path):
    d = json.load(open(path, encoding='utf8'))
    c = d['course']
    out = ["-- Contenido de ejemplo: " + c['title'], "-- Generado por supabase/build_setup.py. No editar a mano.\n",
      "insert into public.courses (slug,title,summary,element,guardian,position,published) values (%s,%s,%s,%s,%s,%d,%s)\n  on conflict (slug) do update set title=excluded.title, summary=excluded.summary, element=excluded.element, guardian=excluded.guardian, position=excluded.position, published=excluded.published;\n" % (q(c['slug']),q(c['title']),q(c['summary']),q(c['element']),q(c['guardian']),c['position'],'true' if c['published'] else 'false')]
    for m in d['missions']:
        mid = uuid.uuid5(NS, c['slug'] + ':m:%d' % m['position'])
        out.append("insert into public.missions (id,course_slug,position,title,intro,xp_reward,is_boss) values ('%s',%s,%d,%s,%s,%d,%s)\n  on conflict (id) do update set title=excluded.title, intro=excluded.intro, xp_reward=excluded.xp_reward, is_boss=excluded.is_boss;" % (mid,q(c['slug']),m['position'],q(m['title']),q(m['intro']),m['xp_reward'],'true' if m['is_boss'] else 'false'))
        for i, qu in enumerate(m['questions'], 1):
            qid = uuid.uuid5(NS, c['slug'] + ':q:%d:%d' % (m['position'], i))
            out.append("insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('%s','%s',%d,%s,%s::jsonb,%d,%s,%s)\n  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;" % (qid,mid,i,q(qu['prompt']),q(json.dumps(qu['options'],ensure_ascii=False)),qu['correct_index'],q(qu['hint']),q(qu['explanation'])))
        out.append("")
    return "\n".join(out) + "\n"
# curso -> migración que lo siembra (en orden de aparición en la plataforma)
SEEDS = {
    'primer-portal.json': '0002_seed_primer_portal.sql',
    'portal-del-primer-intento.json': '0005_seed_portal_del_primer_intento.sql',
}
CONTENT = os.path.join(D, '..', 'web', 'src', 'content')
for seed, mig in SEEDS.items():
    src = os.path.join(D, 'seed', seed)
    open(os.path.join(D, 'migrations', mig), 'w', encoding='utf8').write(build_seed(src))
    shutil.copyfile(src, os.path.join(CONTENT, seed))
missing = set(os.path.basename(f) for f in glob.glob(os.path.join(D, 'seed', '*.json'))) - set(SEEDS)
if missing: raise SystemExit('Añade a SEEDS: ' + ', '.join(sorted(missing)))
parts = ["-- ============================================================\n-- UMBRAL · configuración completa de la base de datos\n-- Pega todo este archivo en Supabase > SQL Editor > New query > Run.\n-- Se puede ejecutar más de una vez sin problema.\n-- Generado por supabase/build_setup.py\n-- ============================================================\n"]
for f in sorted(glob.glob(os.path.join(D, 'migrations', '*.sql'))):
    parts.append("\n-- >>> %s\n" % os.path.basename(f)); parts.append(open(f, encoding='utf8').read())
open(os.path.join(D, 'setup.sql'), 'w', encoding='utf8').write("".join(parts))
print('ok', os.path.getsize(os.path.join(D,'setup.sql')), 'bytes')
