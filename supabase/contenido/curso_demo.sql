-- Contenido de producción (no es una migración y no va en setup.sql).
-- Deja un solo curso de demostración: «El Portal de los Pasos Pequeños» absorbe a «El Portal del Primer Intento»
-- como su segundo módulo, queda gratis y trae un ejemplo de cada tipo de actividad.
-- Las lecciones movidas conservan su id, así que el avance de los estudiantes se mantiene.
-- Se puede ejecutar más de una vez.

do $$
declare m1 uuid; m2 uuid; moved integer;
begin
  -- Módulo 1: Petrox.
  select id into m1 from modules where course_slug = 'primer-portal' order by position limit 1;
  if m1 is null then
    insert into modules (course_slug, position, title, guardian) values ('primer-portal', 1, 'Pasos pequeños', 'petrox') returning id into m1;
  end if;
  update modules set title = 'Pasos pequeños', guardian = 'petrox',
         summary = 'Cómo empezar un reto enorme: dividirlo en pasos que sí puedes terminar.' where id = m1;
  update missions set module_id = m1 where course_slug = 'primer-portal' and module_id is null;

  -- Módulo 2: Ignaris, con las lecciones del otro portal de ejemplo.
  select id into m2 from modules where course_slug = 'primer-portal' and guardian = 'ignaris' limit 1;
  if m2 is null then
    insert into modules (course_slug, position, title, guardian) values ('primer-portal', 2, 'El primer intento', 'ignaris') returning id into m2;
  end if;
  update modules set title = 'El primer intento',
         summary = 'Equivocarse no es perder: es parte de aprender.' where id = m2;
  if exists (select 1 from courses where slug = 'portal-del-primer-intento') then
    update missions set position = position + 1000 where course_slug = 'portal-del-primer-intento';
    update missions set course_slug = 'primer-portal', module_id = m2 where course_slug = 'portal-del-primer-intento';
    get diagnostics moved = row_count;
    perform public.renumber_course('primer-portal');
    -- Accesos, jefes vencidos y vínculos de grupos del portal viejo se van con él (no tiene pagos ni constancias).
    delete from courses where slug = 'portal-del-primer-intento';
    insert into admin_log (action, target, detail)
    values ('unir_cursos_demo', 'portal-del-primer-intento', jsonb_build_object('a', 'primer-portal', 'lecciones', moved));
  end if;

  update courses set title = 'Curso de demostración: aprender paso a paso',
         summary = 'Dos módulos para conocer la plataforma: aprende a dividir un reto enorme con Petrox y a perderle el miedo al error con Ignaris. Gratis y completo.',
         is_free = true, published = true, updated_at = now()
   where slug = 'primer-portal';
end $$;

-- Un ejemplo de cada tipo de actividad (ids fijos: no se duplican al repetir el script).
insert into questions (id, mission_id, position, prompt, kind, options, correct_index, data, hint, explanation)
select x.id::uuid, mi.id, (select coalesce(max(position), 0) + 1 from questions q where q.mission_id = mi.id),
       x.prompt, x.kind, x.options::jsonb, x.correct, x.data::jsonb, x.hint, x.explanation
  from (values
    ('d3a00000-0000-4000-8000-000000000001', 'Ordenar el camino', 'ordenar',
     'Ordena los pasos para empezar un reto grande.',
     '["Mirar el reto completo", "Dividirlo en pasos pequeños", "Elegir el primer paso", "Hacer ese paso hoy"]', 0, '{}',
     'Primero se mira el reto; al final, se actúa.',
     'Ver el reto completo ayuda a dividirlo; elegir un primer paso y hacerlo hoy convierte el plan en avance.'),
    ('d3a00000-0000-4000-8000-000000000002', 'Pasos que caben en un día', 'relacionar',
     'Relaciona cada reto grande con un primer paso pequeño.',
     '["Leer un libro", "Aprender a nadar", "Ordenar la habitación"]', 0,
     '{"right": ["Leer un capítulo", "Flotar con ayuda", "Guardar la ropa"]}',
     'Busca el paso que se puede hacer en un solo día.',
     'Cada reto grande empieza con un paso que cabe en un día.'),
    ('d3a00000-0000-4000-8000-000000000003', 'La llama del primer intento', 'vf',
     'Equivocarse en el primer intento significa que no sirves para eso.',
     '["Verdadero", "Falso"]', 1, '{}',
     'Piensa en cómo aprendiste a caminar.',
     'Falso: el primer intento casi nunca sale perfecto. Equivocarse es parte de aprender.'),
    ('d3a00000-0000-4000-8000-000000000004', 'Los errores son pistas', 'completar',
     'Cuando te equivocas, el error te da una ___ para mejorar.',
     '["pista", "pista"]', 0, '{}',
     'Es justo el nombre de esta lección.',
     'Cada error es una pista: te muestra qué cambiar en el siguiente intento.')
  ) as x(id, lesson, kind, prompt, options, correct, data, hint, explanation)
  join missions mi on mi.course_slug = 'primer-portal' and mi.title = x.lesson
on conflict (id) do nothing;
