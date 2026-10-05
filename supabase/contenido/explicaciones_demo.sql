-- Curso de demostración: una lección de explicación al inicio de cada módulo.
-- Se ejecuta después de curso_demo.sql (y de la migración 0023). Se puede repetir sin duplicar nada.
-- Quien ya pasó la lección siguiente conserva su avance: la explicación queda como leída (sin premio).
do $do$
declare m1 uuid; m2 uuid; e1 uuid; e2 uuid; n1 uuid; n2 uuid;
begin
  if exists (select 1 from missions where course_slug = 'primer-portal' and kind = 'explicacion') then return; end if;
  select id into m1 from modules where course_slug = 'primer-portal' and position = 1;
  select id into m2 from modules where course_slug = 'primer-portal' and position = 2;
  if m1 is null or m2 is null then raise exception 'falta el curso de demostración (curso_demo.sql)'; end if;
  select id into n1 from missions where module_id = m1 order by position limit 1;
  select id into n2 from missions where module_id = m2 order by position limit 1;
  -- Espacio para las nuevas lecciones al inicio de cada módulo.
  update missions set position = position * 10 where course_slug = 'primer-portal';

  insert into missions (course_slug, position, title, intro, xp_reward, is_boss, module_id, kind, body)
  values ('primer-portal', (select position - 5 from missions where id = n1), 'Antes de empezar: los retos se comen a trozos',
    'Antes de enfrentar a Petrox, Sora te enseña el secreto de los retos grandes.', 20, false, m1, 'explicacion',
$t$Un reto grande asusta porque lo miramos completo, todo de una vez. El truco de los grandes aventureros es otro: **partirlo en pasos pequeños**.

## ¿Cómo se hace?
1. Escribe en una frase qué quieres lograr.
2. Haz una lista de pasos cortos y claros, que quepan en un rato.
3. Ponlos en orden: algunos pasos dependen de otros.
4. Empieza por el primero hoy mismo.

## Un paso pequeño es…
- **Claro**: sabes exactamente qué hacer.
- **Corto**: cabe en tu día.
- **Posible**: lo puedes lograr con lo que tienes.

Cuando termines un paso, márcalo. Ver tu avance te da fuerzas para el siguiente. Así, piedra a piedra, ningún reto es demasiado grande… ni siquiera Petrox.$t$)
  returning id into e1;

  insert into missions (course_slug, position, title, intro, xp_reward, is_boss, module_id, kind, body)
  values ('primer-portal', (select position - 5 from missions where id = n2), 'Antes de empezar: el error es una pista',
    'Ignaris teme equivocarse. Antes de ayudarlo, descubre qué hacer con los errores.', 20, false, m2, 'explicacion',
$t$Empezar algo nuevo da nervios: ¿y si sale mal? Ese miedo es normal, pero no tiene la última palabra. **Nadie aprende sin equivocarse.**

## El primer intento no tiene que ser perfecto
El primer borrador, el primer dibujo o la primera vuelta en bicicleta solo tienen un trabajo: **empezar**. Después se mejora.

## Los errores son pistas
Cada error te dice qué no funcionó y por dónde seguir. Cuando te equivoques, pregúntate:
- ¿Qué pasó exactamente?
- ¿Qué puedo cambiar la próxima vez?
- ¿A quién le puedo pedir ayuda?

## Probar de otra manera
Si repites lo mismo, obtienes lo mismo. Cambia de estrategia: divide el problema, míralo desde otro lado o pide una pista.

Decir «**todavía** no me sale» es decir que vas en camino. Con esa idea, las llamas de Ignaris pueden volver a brillar.$t$)
  returning id into e2;

  perform public.renumber_course('primer-portal');

  insert into mission_progress (user_id, mission_id, best_score, attempts, completed_at)
  select user_id, e1, 100, 1, completed_at from mission_progress where mission_id = n1 and completed_at is not null
  on conflict do nothing;
  insert into mission_progress (user_id, mission_id, best_score, attempts, completed_at)
  select user_id, e2, 100, 1, completed_at from mission_progress where mission_id = n2 and completed_at is not null
  on conflict do nothing;
end $do$;
