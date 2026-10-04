-- El informe del docente incluye el aspecto del avatar (colores, peinado y atuendo del Vestidor),
-- que se guarda en profiles.avatar->'look'. La web lo valida antes de usarlo.
-- Solo reemplaza la función (mismos permisos). Se puede ejecutar varias veces.

create or replace function public.class_report(p_teacher uuid, p_class uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare cl record;
begin
  select * into cl from classes where id = p_class and (teacher_id = p_teacher or public.is_admin(p_teacher));
  if not found then raise exception 'clase_no_encontrada'; end if;
  return jsonb_build_object(
    'class', jsonb_build_object('id', cl.id, 'name', cl.name, 'code', cl.code, 'created_at', cl.created_at, 'archived', cl.archived_at is not null),
    'students', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.display_name, 'avatar', coalesce(p.avatar->>'base', 'aria'), 'look', coalesce(p.avatar->'look', '{}'::jsonb),
        'xp', p.xp, 'streak', p.streak, 'last_active', p.last_active, 'joined_at', m.joined_at,
        'progress', coalesce((
          select jsonb_agg(jsonb_build_object('mission_id', pr.mission_id, 'best_score', pr.best_score, 'attempts', pr.attempts, 'completed', pr.completed_at is not null))
            from mission_progress pr where pr.user_id = p.id), '[]'::jsonb)
      ) order by p.display_name)
        from class_members m join profiles p on p.id = m.student_id
       where m.class_id = cl.id), '[]'::jsonb),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object('mission_id', x.mission_id, 'position', x.position, 'answered', x.answered, 'right', x.right_count))
        from (
          select q.mission_id, q.position, count(*)::int as answered, count(*) filter (where a.choice = q.correct_index)::int as right_count
            from attempts t
            join class_members m on m.student_id = t.user_id and m.class_id = cl.id
            cross join lateral unnest(t.answers) with ordinality as a(choice, ord)
            join (select qq.mission_id, qq.position, qq.correct_index,
                         row_number() over (partition by qq.mission_id order by qq.position) as rn
                    from questions qq) q on q.mission_id = t.mission_id and q.rn = a.ord
           where t.finished_at is not null and a.choice >= 0
           group by q.mission_id, q.position
        ) x), '[]'::jsonb)
  );
end $$;
