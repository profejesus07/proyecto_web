-- Clases anuales con código (forma 1).
--  · El administrador crea grupos ligados a una «clase» y elige el docente que los gestiona.
--  · Quien se une con el código de un grupo ligado recibe acceso a la clase hasta el fin del año lectivo.
--  · Si sale del grupo (o el docente lo quita), ese acceso se revoca; un acceso pagado aparte no se toca.
-- Sin borrados. Se puede ejecutar varias veces.

alter table public.classes add column if not exists course_slug text references public.courses(slug) on delete set null;
alter table public.course_access add column if not exists via_class uuid references public.classes(id) on delete set null;

-- Fin del acceso de una clase: el último día del año lectivo, a medianoche de Colombia.
create or replace function public.class_access_expiry(p_course text) returns timestamptz
language sql stable security definer set search_path = public as $$
  select case when access_until is null then null
              else ((access_until + 1)::timestamp at time zone 'America/Bogota') end
    from courses where slug = p_course;
$$;

create or replace function public.join_class(p_student uuid, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cl record; c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')); exp timestamptz; title text;
begin
  perform 1 from profiles where id = p_student and role = 'estudiante' for update;
  if not found then raise exception 'solo_estudiantes'; end if;
  select * into cl from classes where code = c and archived_at is null;
  if not found then raise exception 'codigo_invalido'; end if;
  if (select count(*) from class_members where student_id = p_student) >= 10 then raise exception 'demasiadas_clases'; end if;
  if (select count(*) from class_members where class_id = cl.id) >= 200 then raise exception 'clase_llena'; end if;
  insert into class_members (class_id, student_id) values (cl.id, p_student) on conflict do nothing;

  if cl.course_slug is not null then
    exp := public.class_access_expiry(cl.course_slug);
    select courses.title into title from courses where slug = cl.course_slug;
    insert into course_access (user_id, course_slug, source, granted_by, expires_at, via_class)
    values (p_student, cl.course_slug, 'admin', cl.teacher_id, exp, cl.id)
    on conflict (user_id, course_slug) do update
      set expires_at = excluded.expires_at, granted_by = excluded.granted_by, granted_at = now(), revoked_at = null, via_class = excluded.via_class
      -- No reemplaza un acceso vigente que llegó por otro camino (por ejemplo, pagado).
      where course_access.revoked_at is not null
         or (course_access.expires_at is not null and course_access.expires_at <= now())
         or course_access.via_class is not null;
  end if;

  return jsonb_build_object('id', cl.id, 'name', cl.name, 'course_slug', cl.course_slug, 'course_title', title, 'expires_at', exp);
end $$;

-- Quita el acceso que dio un grupo (al salir del grupo o al ser retirado por su docente).
create or replace function public.revoke_class_access(p_student uuid, p_class uuid)
returns void language sql security definer set search_path = public as $$
  update course_access set revoked_at = now()
   where user_id = p_student and via_class = p_class and revoked_at is null;
$$;

create or replace function public.admin_create_class(p_admin uuid, p_course text, p_name text, p_teacher uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; n text := btrim(coalesce(p_name, ''));
begin
  if not public.is_admin(p_admin) then raise exception 'solo_admin'; end if;
  perform 1 from courses where slug = p_course and kind = 'clase';
  if not found then raise exception 'curso_no_encontrado'; end if;
  perform 1 from profiles where id = p_teacher and (role = 'docente' or is_admin);
  if not found then raise exception 'solo_docentes'; end if;
  if char_length(n) < 2 or char_length(n) > 60 then raise exception 'nombre_invalido'; end if;
  insert into classes (teacher_id, name, code, course_slug) values (p_teacher, n, public.new_class_code(), p_course) returning * into r;
  return jsonb_build_object('id', r.id, 'name', r.name, 'code', r.code);
end $$;

create or replace function public.admin_assign_teacher(p_admin uuid, p_class uuid, p_teacher uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_admin) then raise exception 'solo_admin'; end if;
  perform 1 from profiles where id = p_teacher and (role = 'docente' or is_admin);
  if not found then raise exception 'solo_docentes'; end if;
  update classes set teacher_id = p_teacher where id = p_class;
  if not found then raise exception 'clase_no_encontrada'; end if;
end $$;

create or replace function public.admin_classes(p_admin uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin(p_admin) then raise exception 'solo_admin'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'code', c.code, 'archived', c.archived_at is not null, 'created_at', c.created_at,
      'teacher', p.display_name, 'teacher_id', c.teacher_id, 'course_slug', c.course_slug, 'course_title', co.title,
      'members', (select count(*) from class_members m where m.class_id = c.id)
    ) order by c.created_at desc)
      from classes c join profiles p on p.id = c.teacher_id left join courses co on co.slug = c.course_slug), '[]'::jsonb);
end $$;

revoke all on function public.class_access_expiry(text) from public, anon, authenticated;
revoke all on function public.join_class(uuid, text) from public, anon, authenticated;
revoke all on function public.revoke_class_access(uuid, uuid) from public, anon, authenticated;
revoke all on function public.admin_create_class(uuid, text, text, uuid) from public, anon, authenticated;
revoke all on function public.admin_assign_teacher(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.admin_classes(uuid) from public, anon, authenticated;
grant execute on function public.class_access_expiry(text) to service_role;
grant execute on function public.join_class(uuid, text) to service_role;
grant execute on function public.revoke_class_access(uuid, uuid) to service_role;
grant execute on function public.admin_create_class(uuid, text, text, uuid) to service_role;
grant execute on function public.admin_assign_teacher(uuid, uuid, uuid) to service_role;
grant execute on function public.admin_classes(uuid) to service_role;
