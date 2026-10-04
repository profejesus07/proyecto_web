-- La Terraza del Hogar muestra la decoración que los estudiantes le regalan a su familia
-- (la compran en la tienda con sus monedas). family_overview devuelve también esos objetos.
-- Solo reemplaza la función (mismos permisos). Se puede ejecutar varias veces.

create or replace function public.family_overview(p_family uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform 1 from profiles where id = p_family and role = 'familia';
  if not found then raise exception 'solo_familias'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id, 'name', p.display_name,
      'avatar', coalesce(p.avatar->>'base', 'aria'), 'look', coalesce(p.avatar->'look', '{}'::jsonb),
      'xp', p.xp, 'streak', p.streak, 'last_active', p.last_active, 'since', l.created_at,
      'week_attempts', (select count(*)::int from attempts a where a.user_id = p.id and a.finished_at > now() - interval '7 days'),
      'courses', coalesce((
        select jsonb_agg(jsonb_build_object(
          'slug', c.slug, 'title', c.title, 'kind', c.kind,
          'total', (select count(*)::int from missions m where m.course_slug = c.slug),
          'lessons', coalesce((
            select jsonb_agg(jsonb_build_object('position', m.position, 'title', m.title, 'best_score', pr.best_score,
                                                'attempts', pr.attempts, 'completed', pr.completed_at is not null) order by m.position)
              from mission_progress pr join missions m on m.id = pr.mission_id
             where pr.user_id = p.id and m.course_slug = c.slug), '[]'::jsonb)
        ) order by c.position)
          from courses c
         where c.published and exists (select 1 from mission_progress pr join missions m on m.id = pr.mission_id
                                        where pr.user_id = p.id and m.course_slug = c.slug)), '[]'::jsonb),
      'classes', coalesce((
        select jsonb_agg(jsonb_build_object('name', cl.name, 'teacher', t.display_name) order by cl.name)
          from class_members cm join classes cl on cl.id = cm.class_id join profiles t on t.id = cl.teacher_id
         where cm.student_id = p.id and cl.archived_at is null), '[]'::jsonb),
      'decor', coalesce((select jsonb_agg(i.item_id order by i.item_id) from inventory i
                          where i.user_id = p.id and i.item_id like 'obj\_decoracion\_%'), '[]'::jsonb),
      'certificates', coalesce((
        select jsonb_agg(jsonb_build_object('code', ce.code, 'course_title', ce.course_title, 'hours', ce.hours, 'issued_at', ce.issued_at) order by ce.issued_at desc)
          from certificates ce where ce.user_id = p.id), '[]'::jsonb)
    ) order by p.display_name)
      from family_links l join profiles p on p.id = l.student_id
     where l.family_id = p_family and l.revoked_at is null and p.role = 'estudiante'), '[]'::jsonb);
end $$;
