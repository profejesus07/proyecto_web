-- Clases del Maestro del Gremio: el docente crea grupos con un código y sus estudiantes se unen.
-- El docente ve solo a los estudiantes de sus clases: nombre de aventurero, rango y avance.
-- Nunca ve el correo ni los datos de acceso. Todo pasa por funciones del servidor.
-- Sin DROP: se puede ejecutar varias veces.

create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 60),
  code        text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);
create index if not exists classes_teacher_idx on public.classes (teacher_id);

create table if not exists public.class_members (
  class_id   uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (class_id, student_id)
);
create index if not exists class_members_student_idx on public.class_members (student_id);

alter table public.classes       enable row level security;
alter table public.class_members enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'classes' and policyname = 'clases propias') then
    create policy "clases propias" on public.classes for select to authenticated using (teacher_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'class_members' and policyname = 'membresias propias') then
    create policy "membresias propias" on public.class_members for select to authenticated using (student_id = (select auth.uid()));
  end if;
end $$;
revoke all on public.classes, public.class_members from anon, authenticated;
grant select on public.classes, public.class_members to authenticated;

-- Código de 6 caracteres sin letras que se confunden (sin O, 0, I, 1).
create or replace function public.new_class_code() returns text language plpgsql volatile set search_path = public as $$
declare alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text;
begin
  loop
    select string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), '') into c from generate_series(1, 6);
    exit when not exists (select 1 from classes where code = c);
  end loop;
  return c;
end $$;

create or replace function public.create_class(p_teacher uuid, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; n text := btrim(coalesce(p_name, ''));
begin
  perform 1 from profiles where id = p_teacher and role = 'docente' for update;
  if not found then raise exception 'solo_docentes'; end if;
  if char_length(n) < 2 or char_length(n) > 60 then raise exception 'nombre_invalido'; end if;
  if (select count(*) from classes where teacher_id = p_teacher and archived_at is null) >= 30 then raise exception 'demasiadas_clases'; end if;
  insert into classes (teacher_id, name, code) values (p_teacher, n, public.new_class_code()) returning * into r;
  return jsonb_build_object('id', r.id, 'name', r.name, 'code', r.code);
end $$;

-- Un estudiante se une con el código que le da su docente.
create or replace function public.join_class(p_student uuid, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cl record; c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  perform 1 from profiles where id = p_student and role = 'estudiante' for update;
  if not found then raise exception 'solo_estudiantes'; end if;
  select * into cl from classes where code = c and archived_at is null;
  if not found then raise exception 'codigo_invalido'; end if;
  if (select count(*) from class_members where student_id = p_student) >= 10 then raise exception 'demasiadas_clases'; end if;
  if (select count(*) from class_members where class_id = cl.id) >= 200 then raise exception 'clase_llena'; end if;
  insert into class_members (class_id, student_id) values (cl.id, p_student) on conflict do nothing;
  return jsonb_build_object('id', cl.id, 'name', cl.name);
end $$;

create or replace function public.leave_class(p_student uuid, p_class uuid)
returns void language sql security definer set search_path = public as $$
  delete from class_members where class_id = p_class and student_id = p_student;
$$;

-- Acciones del docente sobre sus propias clases (cualquier otra clase responde «clase_no_encontrada»).
create or replace function public.manage_class(p_teacher uuid, p_class uuid, p_action text, p_arg text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cl record; n text;
begin
  select * into cl from classes where id = p_class and teacher_id = p_teacher for update;
  if not found then raise exception 'clase_no_encontrada'; end if;
  case p_action
    when 'nuevo_codigo' then
      update classes set code = public.new_class_code() where id = cl.id returning * into cl;
    when 'renombrar' then
      n := btrim(coalesce(p_arg, ''));
      if char_length(n) < 2 or char_length(n) > 60 then raise exception 'nombre_invalido'; end if;
      update classes set name = n where id = cl.id returning * into cl;
    when 'archivar' then
      update classes set archived_at = coalesce(archived_at, now()) where id = cl.id returning * into cl;
    when 'quitar' then
      delete from class_members where class_id = cl.id and student_id = p_arg::uuid;
    else raise exception 'accion_invalida';
  end case;
  return jsonb_build_object('id', cl.id, 'name', cl.name, 'code', cl.code, 'archived', cl.archived_at is not null);
end $$;

-- Informe de una clase para su docente: estudiantes, avance por misión y aciertos por pregunta.
create or replace function public.class_report(p_teacher uuid, p_class uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare cl record;
begin
  select * into cl from classes where id = p_class and teacher_id = p_teacher;
  if not found then raise exception 'clase_no_encontrada'; end if;
  return jsonb_build_object(
    'class', jsonb_build_object('id', cl.id, 'name', cl.name, 'code', cl.code, 'created_at', cl.created_at, 'archived', cl.archived_at is not null),
    'students', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.display_name, 'avatar', coalesce(p.avatar->>'base', 'aria'),
        'xp', p.xp, 'streak', p.streak, 'last_active', p.last_active, 'joined_at', m.joined_at,
        'progress', coalesce((
          select jsonb_agg(jsonb_build_object('mission_id', pr.mission_id, 'best_score', pr.best_score, 'attempts', pr.attempts, 'completed', pr.completed_at is not null))
            from mission_progress pr where pr.user_id = p.id), '[]'::jsonb)
      ) order by p.display_name)
        from class_members m join profiles p on p.id = m.student_id
       where m.class_id = cl.id), '[]'::jsonb),
    -- Por pregunta: cuántos intentos terminados la respondieron y cuántos acertaron.
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

revoke all on function public.new_class_code() from public, anon, authenticated;
revoke all on function public.create_class(uuid, text) from public, anon, authenticated;
revoke all on function public.join_class(uuid, text) from public, anon, authenticated;
revoke all on function public.leave_class(uuid, uuid) from public, anon, authenticated;
revoke all on function public.manage_class(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.class_report(uuid, uuid) from public, anon, authenticated;
grant execute on function public.new_class_code() to service_role;
grant execute on function public.create_class(uuid, text) to service_role;
grant execute on function public.join_class(uuid, text) to service_role;
grant execute on function public.leave_class(uuid, uuid) to service_role;
grant execute on function public.manage_class(uuid, uuid, text, text) to service_role;
grant execute on function public.class_report(uuid, uuid) to service_role;
